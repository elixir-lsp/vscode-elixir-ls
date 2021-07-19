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
} from "vscode-languageclient";
import * as os from "os";
import Commands from "./constants/commands";
import runFromCodeLens from "./commands/runTestFromCodeLens";

interface TerminalLinkWithData extends vscode.TerminalLink {
  data: {
    app: string,
    file: string,
    line: number
  }
}

const ExpandMacroTitle = 'Expand macro result'

export let defaultClient: LanguageClient | null;
const clients: Map<string, LanguageClient> = new Map();
let _sortedWorkspaceFolders: string[] | undefined;

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
workspace.onDidChangeWorkspaceFolders(
  () => (_sortedWorkspaceFolders = undefined)
);

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
  const sorted = sortedWorkspaceFolders();
  for (const element of sorted) {
    let uri = folder.uri.toString();
    if (uri.charAt(uri.length - 1) !== "/") {
      uri = uri + "/";
    }
    if (uri.startsWith(element)) {
      return workspace.getWorkspaceFolder(Uri.parse(element))!;
    }
  }
  return folder;
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

  const serverOpts = {
    command: context.asAbsolutePath("./elixir-ls-release/" + command),
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
  const disposable = client.start();

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(disposable);
  return client;
}

export function activate(context: ExtensionContext): void {
  console.warn("activate called");
  testElixir();
  detectConflictingExtension("mjmcloug.vscode-elixir");
  // https://github.com/elixir-lsp/vscode-elixir-ls/issues/34
  detectConflictingExtension("sammkj.vscode-elixir-formatter");

  configureRunTestFromCodeLens()
  configureCopyDebugInfo(context);
  configureExpandMacro(context);
  configureDebugger(context);
  configureTerminalLinkProvider(context);

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
    ],
    // Don't focus the Output pane on errors because request handler errors are no big deal
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    synchronize: {
      // Synchronize the setting section 'elixirLS' to the server
      configurationSection: "elixirLS",
      // Notify the server about file changes to Elixir files contained in the workspace
      fileEvents: [
        workspace.createFileSystemWatcher("**/*.{ex,exs,erl,hrl,yrl,xrl,eex,leex}"),
      ],
    },
  };

  function didOpenTextDocument(document: vscode.TextDocument): void {
    // We are only interested in elixir files
    if (document.languageId !== "elixir") {
      return;
    }

    const uri = document.uri;
    let folder = workspace.getWorkspaceFolder(uri);

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
        { language: "html-eex", scheme: "untitled"}
      ] : [];
      const workspaceClientOptions: LanguageClientOptions = Object.assign(
        {},
        clientOptions,
        {
          // the client will iterate through this list and chose the first matching element
          documentSelector: [
            { language: "elixir", scheme: "file", pattern: pattern },
            { language: "eex", scheme: "file", pattern: pattern },
            { language: "html-eex", scheme: "file", pattern: pattern },
            ...untitled
          ],
          workspaceFolder: folder,
        }
      );

      clients.set(folder.uri.toString(), startClient(context, workspaceClientOptions));
    }
  }

  workspace.onDidOpenTextDocument(didOpenTextDocument);
  workspace.textDocuments.forEach(didOpenTextDocument);
  workspace.onDidChangeWorkspaceFolders((event) => {
    for (const folder of event.removed) {
      const client = clients.get(folder.uri.toString());
      if (client) {
        clients.delete(folder.uri.toString());
        client.stop();
      }
    }
  });
}

export function deactivate(): Thenable<void> {
  const promises: Thenable<void>[] = [];
  if (defaultClient) {
    console.log("ElixirLS: stopping default client");
    promises.push(defaultClient.stop());
    defaultClient = null;
  }
  for (const [uri, client] of clients.entries()) {
    console.log(`ElixirLS: stopping client for ${uri}`);
    promises.push(client.stop());
  }
  clients.clear();
  return Promise.all(promises).then(() => undefined);
}

function getClient(document: vscode.TextDocument): LanguageClient | null {
  // We are only interested in elixir files
  if (document.languageId !== "elixir") {
    return null;
  }

  // Files outside of workspace go to default client when no directory is open
  // otherwise they go to first workspace
  // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
  let folder = workspace.getWorkspaceFolder(document.uri);
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
