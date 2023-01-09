// TODO why we have MS copyright here?
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";

import * as vscode from "vscode";
import { execSync } from "child_process";
import * as shell from "shelljs";
import * as path from "path";

import { workspace, ExtensionContext, WorkspaceFolder, Uri } from "vscode";
import {
  ExecuteCommandParams,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ServerOptions
} from "vscode-languageclient/node";
import * as os from "os";
import Commands from "./constants/commands";
import runFromCodeLens from "./commands/runTestFromCodeLens";
import runTest from "./commands/runTest";

interface TerminalLinkWithData extends vscode.TerminalLink {
  data: {
    app: string,
    file: string,
    line: number
  }
}

const ExpandMacroTitle = 'Expand macro result'

export let defaultClient: LanguageClient | null = null;
const clients: Map<string, LanguageClient> = new Map();
let _sortedWorkspaceFolders: string[] | undefined;

function allClients(): LanguageClient[] {
  const result = [...clients.values()];

  if (defaultClient) {
    result.push(defaultClient);
  }

  return result;
}

function testElixirCommand(command: string): false | Buffer {
  try {
    return execSync(`${command} -e " "`);
  } catch {
    return false;
  }
}

function testElixir(): boolean {
  let testResult = testElixirCommand("elixir");
  if (testResult === false) {
    // Try finding elixir in the path directly
    const elixirPath = shell.which("elixir");
    if (elixirPath) {
      testResult = testElixirCommand(elixirPath);
    }
  }

  if (!testResult) {
    vscode.window.showErrorMessage(
      "Failed to run 'elixir' command. ElixirLS will probably fail to launch. Logged PATH to Development Console."
    );
    console.warn(
      `Failed to run 'elixir' command. Current process's PATH: ${process.env["PATH"]}`
    );
    return false;
  } else if (testResult.length > 0) {
    vscode.window.showErrorMessage(
      "Running 'elixir' command caused extraneous print to stdout. See VS Code's developer console for details."
    );
    console.warn(
      "Running 'elixir -e \"\"' printed to stdout:\n" + testResult.toString()
    );
    return false;
  } else {
    return true;
  }
}

function detectConflictingExtension(extensionId: string): void {
  const extension = vscode.extensions.getExtension(extensionId);
  if (extension) {
    vscode.window.showErrorMessage(
      "Warning: " +
        extensionId +
        " is not compatible with ElixirLS, please uninstall " +
        extensionId
    );
  }
}

function sortedWorkspaceFolders(): string[] {
  if (_sortedWorkspaceFolders === void 0) {
    _sortedWorkspaceFolders = workspace.workspaceFolders
      ? workspace.workspaceFolders
        .map((folder) => {
          let result = folder.uri.toString();
          if (result.charAt(result.length - 1) !== "/") {
            result = result + "/";
          }
          return result;
        })
        .sort((a, b) => {
          return a.length - b.length;
        })
      : [];
  }
  return _sortedWorkspaceFolders;
}
let workspaceSubscription: vscode.Disposable | null | undefined = workspace.onDidChangeWorkspaceFolders(
  () => (_sortedWorkspaceFolders = undefined)
);

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
  let uri = folder.uri.toString();
  if (uri.charAt(uri.length - 1) !== "/") {
    uri = uri + "/";
  }

  for (const element of sortedWorkspaceFolders()) {
    if (uri.startsWith(element)) {
      return workspace.getWorkspaceFolder(Uri.parse(element))!;
    }
  }
  throw "this should not happen";
}

function configureCopyDebugInfo(context: ExtensionContext) {
  const disposable = vscode.commands.registerCommand("extension.copyDebugInfo", () => {
    const elixirVersion = execSync(`elixir --version`);
    const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");
    if (!extension) {
      return;
    }

    const message = `
* Elixir & Erlang versions (elixir --version): ${elixirVersion}
* VSCode ElixirLS version: ${extension.packageJSON.version}
* Operating System Version: ${os.platform()} ${os.release()}
`;

    vscode.window.showInformationMessage(`Copied to clipboard: ${message}`);
    vscode.env.clipboard.writeText(message);
  });
  context.subscriptions.push(disposable);
}

function getExpandMacroWebviewContent(content: Record<string, string>) {
  let body = "";
  for (const [key, value] of Object.entries(content)) {
    body += `<div>
      <h4>${key}</h4>
      <code><pre>${value}</pre></code>
    </div>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ExpandMacroTitle}</title>
</head>
<body>
  ${body}
</body>
</html>`;
}

function configureExpandMacro(context: ExtensionContext) {
  const disposable = vscode.commands.registerCommand("extension.expandMacro", async () => {
    const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");
    const editor = vscode.window.activeTextEditor;
    if (!extension || !editor) {
      return;
    }

    const uri = editor.document.uri;
    const client = getClient(editor.document);

    if (!client) {
      return;
    }

    if (editor.selection.isEmpty) {
      return;
    }

    const command = client.initializeResult!.capabilities.executeCommandProvider!.commands
      .find(c => c.startsWith("expandMacro:"))!;

    const params: ExecuteCommandParams = {
      command: command,
      arguments: [uri.toString(), editor.document.getText(editor.selection), editor.selection.start.line]
    };

    const res: Record<string, string> = await client.sendRequest("workspace/executeCommand", params);

    const panel = vscode.window.createWebviewPanel(
      'expandMacro',
      ExpandMacroTitle,
      vscode.ViewColumn.One,
      {}
    );
    panel.webview.html = getExpandMacroWebviewContent(res);
  });

  context.subscriptions.push(disposable);
}

function configureRestart(context: ExtensionContext) {
  const disposable = vscode.commands.registerCommand("extension.restart", async () => {
    const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");

    if (!extension) {
      return;
    }

    await Promise.all(allClients().map(async (client: LanguageClient) => {
      const command = client.initializeResult!.capabilities.executeCommandProvider!.commands
        .find(c => c.startsWith("restart:"))!;

      const params: ExecuteCommandParams = {
        command: command,
        arguments: []
      };

      try {
        await client.sendRequest("workspace/executeCommand", params);
      } catch {
        // this command will throw Connection got disposed
        // client reference remains valid as VS will restart server process and the connection
      }
      }));
  });

  context.subscriptions.push(disposable);
}

function configureMixClean(context: ExtensionContext, cleanDeps: boolean) {
  const commandName = "extension." + (cleanDeps ?  "mixCleanIncludeDeps" : "mixClean");
  const disposable = vscode.commands.registerCommand(commandName, async () => {
    const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");

    if (!extension) {
      return;
    }

    await Promise.all(allClients().map(async (client: LanguageClient) => {
      const command = client.initializeResult!.capabilities.executeCommandProvider!.commands
        .find(c => c.startsWith("mixClean:"))!;

      const params: ExecuteCommandParams = {
        command: command,
        arguments: [cleanDeps]
      };

      await client.sendRequest("workspace/executeCommand", params);
    }));
  });

  context.subscriptions.push(disposable);
}

function configureManipulatePipes(context: ExtensionContext, operation: "toPipe" | "fromPipe") {
  const commandName = `extension.${operation}`;

  const disposable = vscode.commands.registerCommand(commandName, async () => {
    const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");
    const editor = vscode.window.activeTextEditor;
    if (!extension || !editor) {
      return;
    }

    const client = getClient(editor.document);
    const uri = editor.document.uri

    if (!client) {
      return
    }


    const command = client.initializeResult!.capabilities.executeCommandProvider!.commands
      .find((c: string) => c.startsWith('manipulatePipes:'))!;

    const uriStr = uri.toString();
    const args = [
      operation,
      uriStr,
      editor.selection.start.line,
      editor.selection.start.character,
    ];

    const params: ExecuteCommandParams = { command, arguments: args };

    client.sendRequest("workspace/executeCommand", params);
  });

  context.subscriptions.push(disposable);
}

class DebugAdapterExecutableFactory implements vscode.DebugAdapterDescriptorFactory {
  createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    if (session.workspaceFolder) {
      const cwd: string = session.workspaceFolder.uri.fsPath;

      let options;
      if (executable.options) {
        options = { ...executable.options, cwd };
      } else {
        options = { cwd };
      }

      return new vscode.DebugAdapterExecutable(executable.command, executable.args, options);
    }

    return executable;
  }
}

function configureDebugger(context: ExtensionContext) {
  // Use custom DebugAdaptureExecutableFactory that launches the debugger with
  // the current working directory set to the workspace root so asdf can load
  // the correct environment properly.
  const factory = new DebugAdapterExecutableFactory();
  const disposable = vscode.debug.registerDebugAdapterDescriptorFactory("mix_task", factory);
  context.subscriptions.push(disposable);
}

function configureTerminalLinkProvider(context: ExtensionContext) {
  function openUri(uri: Uri, line: number) {
    vscode.workspace.openTextDocument(uri).then(document => {
      vscode.window.showTextDocument(document).then(editor => {
        const position = new vscode.Position(line - 1, 0);
        const selection = new vscode.Selection(position, position);
        editor.revealRange(selection);
        editor.selection = selection;
      });
    });
  }

  const disposable = vscode.window.registerTerminalLinkProvider({
    provideTerminalLinks: (context: vscode.TerminalLinkContext, _token: vscode.CancellationToken): vscode.ProviderResult<TerminalLinkWithData[]> => {
      const regex = /(?:\((?<app>[_a-z]+) \d+.\d+.\d+\) )(?<file>[_a-z/]*[_a-z]+.ex):(?<line>\d+)/;
      const matches = context.line.match(regex);
      if (matches === null) {
        return [];
      }

      return [
        {
          startIndex: matches.index!,
          length: matches[0].length,
          data: {
            app: matches.groups!.app,
            file: matches.groups!.file,
            line: parseInt(matches.groups!.line),
          },
        },
      ];
    },
    handleTerminalLink: ({ data: { app, file, line } }: TerminalLinkWithData): vscode.ProviderResult<void> => {
      const umbrellaFile = path.join("apps", app, file);
      vscode.workspace.findFiles(`{${umbrellaFile},${file}}`).then(uris => {
        if (uris.length === 1) {
          openUri(uris[0], line);
        } else if (uris.length > 1) {
          const items = uris.map(uri => ({ label: uri.toString(), uri }));
          vscode.window.showQuickPick(items).then(selection => {
            if (!selection) {
              return;
            }

            openUri(selection.uri, line);
          });
        }
      });
    }
  });

  context.subscriptions.push(disposable);
}

function configureRunTestFromCodeLens() {
  vscode.commands.registerCommand(Commands.RUN_TEST_FROM_CODELENS, runFromCodeLens);
}

function startClient(context: ExtensionContext, clientOptions: LanguageClientOptions): LanguageClient {
  const command =
    os.platform() == "win32" ? "language_server.bat" : "language_server.sh";

  const lsOverridePath: string = vscode.workspace.getConfiguration('elixirLS').get('languageServerOverridePath')!;

  const serverOpts = {
    command: lsOverridePath ? path.join(lsOverridePath, command) : context.asAbsolutePath("./elixir-ls-release/" + command),
  };

  // If the extension is launched in debug mode then the `debug` server options are used instead of `run`
  // currently we pass the same options regardless of the mode
  const serverOptions: ServerOptions = {
    run: serverOpts,
    debug: serverOpts,
  };

  let displayName;
  if (clientOptions.workspaceFolder) {
    console.log(`ElixirLS: starting client for ${clientOptions.workspaceFolder!.uri.toString()} with server options`, serverOptions, "client options", clientOptions)
    displayName = `ElixirLS - ${clientOptions.workspaceFolder!.name}`;
  } else {
    console.log(`ElixirLS: starting default client with server options`, serverOptions, "client options", clientOptions)
    displayName = "ElixirLS - (default)"
  }

  const client = new LanguageClient(
    "elixirLS", // langId
    displayName, // display name
    serverOptions,
    clientOptions
  );
  client.start().then(() => {
    if (clientOptions.workspaceFolder) {
      console.log(`ElixirLS: started client for ${clientOptions.workspaceFolder!.uri.toString()}`)
    } else {
      console.log(`ElixirLS: started default client`)
    }
  });

  return client;
}

export function activate(context: ExtensionContext): void {
  console.log(`ElixirLS: activating extension`)
  testElixir();
  detectConflictingExtension("mjmcloug.vscode-elixir");
  // https://github.com/elixir-lsp/vscode-elixir-ls/issues/34
  detectConflictingExtension("sammkj.vscode-elixir-formatter");

  configureRunTestFromCodeLens()
  configureCopyDebugInfo(context);
  configureExpandMacro(context);
  configureRestart(context);
  configureMixClean(context, false);
  configureMixClean(context, true);
  configureManipulatePipes(context, "fromPipe");
  configureManipulatePipes(context, "toPipe");
  configureDebugger(context);
  configureTerminalLinkProvider(context);
  configureTestController(context);

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for Elixir documents
    // the client will iterate through this list and chose the first matching element
    documentSelector: [
      { language: "elixir", scheme: "file" },
      { language: "elixir", scheme: "untitled" },
      { language: "eex", scheme: "file" },
      { language: "eex", scheme: "untitled" },
      { language: "html-eex", scheme: "file" },
      { language: "html-eex", scheme: "untitled" },
      { language: "phoenix-heex", scheme: "file" },
      { language: "phoenix-heex", scheme: "untitled" },
      { language: "surface", scheme: "file" },
      { language: "surface", scheme: "untitled" }
    ],
    // Don't focus the Output pane on errors because request handler errors are no big deal
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    synchronize: {
      // Synchronize the setting section 'elixirLS' to the server
      configurationSection: "elixirLS"
    },
  };

  function didOpenTextDocument(document: vscode.TextDocument) {
    // We are only interested in elixir related files
    if (["elixir", "eex", "html-eex", "phoenix-heex", "surface"].indexOf(document.languageId) < 0) {
      return;
    }

    const uri = document.uri;
    let folder = workspace.getWorkspaceFolder(uri);

    console.log("uri", uri, "folder", folder?.uri)

    // Files outside of workspace go to default client when no directory is open
    // otherwise they go to first workspace
    // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
    if (!folder) {
      if (workspace.workspaceFolders && workspace.workspaceFolders.length !== 0) {
        // untitled file assigned to first workspace
        folder = workspace.getWorkspaceFolder(workspace.workspaceFolders[0].uri)!;
      } else {
        // no workspace folders - use default client
        if (!defaultClient) {
          // Create the language client and start the client.
          defaultClient = startClient(context, clientOptions);
        }
        return;
      }
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = getOuterMostWorkspaceFolder(folder);

    if (!clients.has(folder.uri.toString())) {
      const pattern = `${folder.uri.fsPath}/**/*`
      // open untitled files go to the first workspace
      const untitled = folder.index === 0 ? [
        { language: "elixir", scheme: "untitled" },
        { language: "eex", scheme: "untitled" },
        { language: "html-eex", scheme: "untitled"},
        { language: "phoenix-heex", scheme: "untitled"},
        { language: "surface", scheme: "untitled"}
      ] : [];
      const workspaceClientOptions: LanguageClientOptions = {
        ...clientOptions,
        // the client will iterate through this list and chose the first matching element
        documentSelector: [
          { language: "elixir", scheme: "file", pattern: pattern },
          { language: "eex", scheme: "file", pattern: pattern },
          { language: "html-eex", scheme: "file", pattern: pattern },
          { language: "phoenix-heex", scheme: "file", pattern: pattern },
          { language: "surface", scheme: "file", pattern: pattern },
          ...untitled
        ],
        workspaceFolder: folder,
      };

      clients.set(folder.uri.toString(), startClient(context, workspaceClientOptions));
    }
  }

  context.subscriptions.push(workspace.onDidOpenTextDocument(didOpenTextDocument));
  workspace.textDocuments.forEach(didOpenTextDocument);
  context.subscriptions.push(workspace.onDidChangeWorkspaceFolders((event) => {
    for (const folder of event.removed) {
      const client = clients.get(folder.uri.toString());
      if (client) {
        const uri = folder.uri.toString();
        clients.delete(uri);
        client.stop();
      }
    }
  }));
}

export async function deactivate() {
  workspaceSubscription!.dispose();
  workspaceSubscription = undefined;
  const promises: Promise<void>[] = [];
  if (defaultClient) {
    promises.push(defaultClient.stop());
    defaultClient = null;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [uri, client] of clients.entries()) {
    promises.push(client.stop());
  }
  clients.clear();
  await Promise.all(promises);
}

function getClientByUri(uri: Uri): LanguageClient {
  // Files outside of workspace go to default client when no directory is open
  // otherwise they go to first workspace
  // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
  let folder = workspace.getWorkspaceFolder(uri);
  if (!folder) {
    if (workspace.workspaceFolders && workspace.workspaceFolders.length !== 0) {
      // untitled file assigned to first workspace
      folder = workspace.getWorkspaceFolder(workspace.workspaceFolders[0].uri)!;
    } else {
      // no workspace folders - use default client
      return defaultClient!;
    }
  }

  // If we have nested workspace folders we only start a server on the outer most workspace folder.
  folder = getOuterMostWorkspaceFolder(folder);

  return clients.get(folder.uri.toString())!;
}

function getClient(document: vscode.TextDocument): LanguageClient | null {
  // We are only interested in elixir files
  if (document.languageId !== "elixir") {
    return null;
  }

  return getClientByUri(document.uri);
}

function configureTestController(context: ExtensionContext) {
  console.log("creating test controller")
  const controller = vscode.tests.createTestController(
    'elixirLSExUnitTests',
    'ExUnit Tests'
  );

  context.subscriptions.push(controller);

  // First, create the `resolveHandler`. This may initially be called with
  // "undefined" to ask for all tests in the workspace to be discovered, usually
  // when the user opens the Test Explorer for the first time.
  controller.resolveHandler = async test => {
    if (!test) {
      await discoverAllFilesInWorkspace();
    } else {
      await parseTestsInFileContents(test);
    }
  };

  context.subscriptions.push(
    // When text documents are open, parse tests in them.
    vscode.workspace.onDidOpenTextDocument(parseTestsInDocument),
    // We could also listen to document changes to re-parse unsaved changes:
    vscode.workspace.onDidChangeTextDocument(e => parseTestsInDocument(e.document))
  );

  enum ItemType {
    File,
    Module,
    Describe,
    TestCase
  }
  
  const testData = new WeakMap<vscode.TestItem, ItemType>();
  
  const getType = (testItem: vscode.TestItem) => testData.get(testItem) ?? ItemType.TestCase;
  
  // In this function, we'll get the file TestItem if we've already found it,
  // otherwise we'll create it with `canResolveChildren = true` to indicate it
  // can be passed to the `controller.resolveHandler` to gets its children.
  function getOrCreateFile(uri: vscode.Uri) {
    const existing = controller.items.get(uri.toString());
    if (existing) {
      return existing;
    }

    let folder = workspace.getWorkspaceFolder(uri);
    folder = getOuterMostWorkspaceFolder(folder!);
    const relativePath = uri.fsPath.slice(folder.uri.fsPath.length)
    const fileTestItem = controller.createTestItem(uri.toString(), relativePath, uri);
    fileTestItem.canResolveChildren = true;
    fileTestItem.range = new vscode.Range(0, 0, 0, 0)
    controller.items.add(fileTestItem);
    testData.set(fileTestItem, ItemType.File);
    return fileTestItem;
  }

  function filterTestFile(uri: Uri) {
    if (uri.scheme !== 'file') {
      // filter out untitled and other non file
      return false;
    }

    if (!uri.path.endsWith('_test.exs')) {
      // filter out non test
      return false;
    }

    let folder = workspace.getWorkspaceFolder(uri);
    if (!folder) {
      // filter out files outside any of workspace folders
      return false;
    }

    folder = getOuterMostWorkspaceFolder(folder);
    const relativePath = uri.fsPath.slice(folder.uri.fsPath.length);
    const pathSegments = relativePath.split("/");
    const firstSegment = pathSegments[1];
    if (firstSegment == "_build" || firstSegment == "deps" || firstSegment == ".elixir_ls") {
      // filter out test files in deps and _build dirs
      return false;
    }

    if (pathSegments.includes("node_modules")) {
      // exclude phoenix tests in node_module
      return false;
    }

    return true;
  }

  function parseTestsInDocument(e: vscode.TextDocument) {
    if (filterTestFile(e.uri)) {
      parseTestsInFileContents(getOrCreateFile(e.uri));
    }
  }

  async function parseTestsInFileContents(file: vscode.TestItem) {
    // If a document is open, VS Code already knows its contents. If this is being
    // called from the resolveHandler when a document isn't open, we'll need to
    // read them from disk ourselves.
    const client = getClientByUri(file.uri!);

    const command = client.initializeResult!.capabilities.executeCommandProvider!.commands
        .find(c => c.startsWith("getExUnitTestsInFile:"))!;

      const params: ExecuteCommandParams = {
        command: command,
        arguments: [file.uri!.toString()]
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any[] = await client.sendRequest("workspace/executeCommand", params);

      for (const moduleEntry of res) {
        const moduleTestItem = controller.createTestItem(moduleEntry.module, moduleEntry.module, file.uri!)
        moduleTestItem.range = new vscode.Range(moduleEntry.line, 0, moduleEntry.line, 0)
        testData.set(moduleTestItem, ItemType.Module);
        file.children.add(moduleTestItem);
        for (const describeEntry of moduleEntry.describes) {
          let describeCollection: vscode.TestItemCollection;
          if (describeEntry.describe) {
            const describeTestItem = controller.createTestItem(describeEntry.describe, describeEntry.describe, file.uri!);
            describeTestItem.range = new vscode.Range(describeEntry.line, 0, describeEntry.line, 0)
            describeTestItem.description = "describe";
            testData.set(describeTestItem, ItemType.Describe);
            moduleTestItem.children.add(describeTestItem);
            describeCollection = describeTestItem.children;
          } else {
            describeCollection = moduleTestItem.children;
          }
          for (const testEntry of describeEntry.tests) {
            let name = testEntry.name;
            const prefix = testEntry.type + " "
            if (name.startsWith(prefix)) {
              name = name.slice(prefix.length);
            }
            const testItem = controller.createTestItem(testEntry.name, name, file.uri);
            testItem.range = new vscode.Range(testEntry.line, 0, testEntry.line, 0)
            testItem.description = testEntry.type;
            describeCollection.add(testItem);
          }
        }
        
      }

      
  }

  async function discoverAllFilesInWorkspace() {
    if (!vscode.workspace.workspaceFolders) {
      return []; // handle the case of no open folders
    }

    console.log('calling discoverAllFilesInWorkspace')

    const outerMostWorkspaceFolders = [...new Set(vscode.workspace.workspaceFolders.map(workspaceFolder => getOuterMostWorkspaceFolder(workspaceFolder)))];
    
    return Promise.all(
      outerMostWorkspaceFolders.map(async workspaceFolder => {
        console.log('registering watcher in', workspaceFolder.name)
        const pattern = new vscode.RelativePattern(workspaceFolder, '**/*_test.exs');
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);

        context.subscriptions.push(watcher);

        // When files are created, make sure there's a corresponding "file" node in the tree
        watcher.onDidCreate(uri => getOrCreateFile(uri));
        // When files change, re-parse them. Note that you could optimize this so
        // that you only re-parse children that have been resolved in the past.
        watcher.onDidChange(uri => parseTestsInFileContents(getOrCreateFile(uri)));
        // And, finally, delete TestItems for removed files. This is simple, since
        // we use the URI as the TestItem's ID.
        watcher.onDidDelete(uri => controller.items.delete(uri.toString()));

        const files = await vscode.workspace.findFiles(pattern);

        for (const file of files) {
          if (filterTestFile(file)) {
            getOrCreateFile(file);
          }
        }

        return watcher;
      })
    );
  }

  function writeOutput(run: vscode.TestRun, output: string, test: vscode.TestItem) {
    // output is a raw terminal, we need to wrap lines with CRLF
    // note replace("\n", "\r\n") is not working correctly
    for (const line of output.split("\n")) {
      run.appendOutput(line, undefined, test)
      run.appendOutput("\r\n", undefined, test)
    }
  }

  async function runHandler(
    shouldDebug: boolean,
    request: vscode.TestRunRequest,
    token: vscode.CancellationToken
  ) {
    const run = controller.createTestRun(request);
    const queue: vscode.TestItem[] = [];

    // Loop through all included tests, or all known tests, and add them to our queue
    if (request.include) {
      request.include.forEach(test => {
        queue.push(test);
        run.enqueued(test);
      });
    } else {
      controller.items.forEach(test => {
        queue.push(test);
        run.enqueued(test);
      });
    }

    // For every test that was queued, try to run it. Call run.passed() or run.failed().
    // The `TestMessage` can contain extra information, like a failing location or
    // a diff output. But here we'll just give it a textual message.
    while (queue.length > 0 && !token.isCancellationRequested) {
      const test = queue.pop()!;

      // Skip tests the user asked to exclude
      if (request.exclude?.includes(test)) {
        continue;
      }

      switch (getType(test)) {
        case ItemType.File:
          // If we're running a file and don't know what it contains yet, parse it now
          if (test.children.size === 0) {
            await parseTestsInFileContents(test);
          }
          break;
        case ItemType.TestCase:
          // Otherwise, just run the test case. Note that we don't need to manually
          // set the state of parent tests; they'll be set automatically.
          // eslint-disable-next-line no-case-declarations
          const start = Date.now();
          run.started(test);
          try {
            let folder = workspace.getWorkspaceFolder(test.uri!)!;
            folder = getOuterMostWorkspaceFolder(folder);
            const folderPath = folder.uri.fsPath;
            const relativePath = test.uri!.fsPath.slice(folderPath.length + 1);
            const output = await runTest({cwd: folderPath, filePath: relativePath, line: test.range!.start.line + 1})
            writeOutput(run, output, test);
            run.passed(test, Date.now() - start);
          } catch (e) {
            writeOutput(run, (e as string), test);
            run.failed(test, new vscode.TestMessage((e as string)), Date.now() - start);
          }
          break;
        default:
          break;
      }

      test.children.forEach(test => {
        queue.push(test);
        run.enqueued(test);
      });
    }

    // Make sure to end the run after all tests have been executed:
    run.end();
  }
  
  const runProfile = controller.createRunProfile(
    'Run',
    vscode.TestRunProfileKind.Run,
    (request, token) => {
      runHandler(false, request, token);
    }
  );

  context.subscriptions.push(runProfile);
}
