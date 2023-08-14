"use strict";

import * as vscode from "vscode";
import {
  Executable,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ServerOptions,
} from "vscode-languageclient/node";
import { WorkspaceMode, WorkspaceTracker } from "./project";
import { buildCommand } from "./executable";

const languageIds = ["elixir", "eex", "html-eex", "phoenix-heex", "surface"];
const defaultDocumentSelector = languageIds.flatMap((language) => [
  { language, scheme: "file" },
  { language, scheme: "untitled" },
]);

const untitledDocumentSelector = languageIds.map((language) => ({
  language,
  scheme: "untitled",
}));

const patternDocumentSelector = (pattern: string) =>
  languageIds.map((language) => ({ language, scheme: "file", pattern }));

// Options to control the language client
const clientOptions: LanguageClientOptions = {
  // Register the server for Elixir documents
  // the client will iterate through this list and chose the first matching element
  documentSelector: defaultDocumentSelector,
  // Don't focus the Output pane on errors because request handler errors are no big deal
  revealOutputChannelOn: RevealOutputChannelOn.Never,
};

function startClient(
  context: vscode.ExtensionContext,
  clientOptions: LanguageClientOptions
): [LanguageClient, Promise<LanguageClient>] {
  const serverOpts: Executable = {
    command: buildCommand(
      context,
      "language_server",
      clientOptions.workspaceFolder
    ),
  };

  // If the extension is launched in debug mode then the `debug` server options are used instead of `run`
  // currently we pass the same options regardless of the mode
  const serverOptions: ServerOptions = {
    run: serverOpts,
    debug: serverOpts,
  };

  let displayName;
  if (clientOptions.workspaceFolder) {
    console.log(
      `ElixirLS: starting LSP client for ${clientOptions.workspaceFolder.uri.fsPath} with server options`,
      serverOptions,
      "client options",
      clientOptions
    );
    displayName = `ElixirLS - ${clientOptions.workspaceFolder!.name}`;
  } else {
    console.log(
      `ElixirLS: starting default LSP client with server options`,
      serverOptions,
      "client options",
      clientOptions
    );
    displayName = "ElixirLS - (default)";
  }

  const client = new LanguageClient(
    "elixirLS", // langId
    displayName, // display name
    serverOptions,
    clientOptions
  );
  const clientPromise = new Promise<LanguageClient>((resolve) => {
    client.start().then(() => {
      if (clientOptions.workspaceFolder) {
        console.log(
          `ElixirLS: started LSP client for ${clientOptions.workspaceFolder.uri.toString()}`
        );
      } else {
        console.log(`ElixirLS: started default LSP client`);
      }
      resolve(client);
    });
  });

  return [client, clientPromise];
}

export class LanguageClientManager {
  defaultClient: LanguageClient | null = null;
  defaultClientPromise: Promise<LanguageClient> | null = null;
  clients: Map<string, LanguageClient> = new Map();
  clientsPromises: Map<string, Promise<LanguageClient>> = new Map();
  private _onDidChange = new vscode.EventEmitter<void>();
  get onDidChange(): vscode.Event<void> {
    return this._onDidChange.event;
  }
  private _workspaceTracker: WorkspaceTracker;

  constructor(workspaceTracker: WorkspaceTracker) {
    this._workspaceTracker = workspaceTracker;
  }

  public getDefaultClient() {
    return this.defaultClient;
  }

  public allClients(): LanguageClient[] {
    const result = [...this.clients.values()];

    if (this.defaultClient) {
      result.push(this.defaultClient);
    }

    return result;
  }

  public getClientByUri(uri: vscode.Uri): LanguageClient {
    // Files outside of workspace go to default client when no directory is open
    // otherwise they go to first workspace
    // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
    let folder = vscode.workspace.getWorkspaceFolder(uri);
    if (!folder) {
      if (
        vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length !== 0
      ) {
        // untitled: and file: outside workspace folders assigned to first workspace
        folder = vscode.workspace.workspaceFolders[0];
      } else {
        // no workspace folders - use default client
        if (this.defaultClient) {
          return this.defaultClient;
        } else {
          throw "default client LSP not started";
        }
      }
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = this._workspaceTracker.getOuterMostWorkspaceFolder(folder);

    const client = this.clients.get(folder.uri.toString());
    if (client) {
      return client;
    } else {
      throw `LSP client for ${folder.uri.toString()} not started`;
    }
  }

  public getClientPromiseByUri(uri: vscode.Uri): Promise<LanguageClient> {
    // Files outside of workspace go to default client when no directory is open
    // otherwise they go to first workspace
    // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
    let folder = vscode.workspace.getWorkspaceFolder(uri);
    if (!folder) {
      if (
        vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length !== 0
      ) {
        // untitled: and file: outside workspace folders assigned to first workspace
        folder = vscode.workspace.workspaceFolders[0];
      } else {
        // no folders - use default client
        return this.defaultClientPromise!;
      }
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = this._workspaceTracker.getOuterMostWorkspaceFolder(folder);

    return this.clientsPromises.get(folder.uri.toString())!;
  }

  public getClientByDocument(
    document: vscode.TextDocument
  ): LanguageClient | null {
    // We are only interested in elixir files
    if (document.languageId !== "elixir") {
      return null;
    }

    return this.getClientByUri(document.uri);
  }

  public handleDidOpenTextDocument(
    document: vscode.TextDocument,
    context: vscode.ExtensionContext
  ) {
    // We are only interested in elixir related files
    if (!languageIds.includes(document.languageId)) {
      return;
    }

    const uri = document.uri;
    let folder = vscode.workspace.getWorkspaceFolder(uri);

    // Files outside of workspace go to default client when no workspace folder is open
    // otherwise they go to first workspace
    // NOTE
    // even if we pass undefined in clientOptions and try to create a default client
    // vscode will pass first workspace as rootUri/rootPath and we will have 2 servers
    // running in the same directory
    if (!folder) {
      if (
        vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length !== 0
      ) {
        // untitled: or file: outside the workspace folders assigned to first workspace
        folder = vscode.workspace.workspaceFolders[0];
      } else {
        // no workspace - use default client
        if (!this.defaultClient) {
          // Create the language client and start the client
          // the client will get all requests from untitled: file:
          [this.defaultClient, this.defaultClientPromise] = startClient(
            context,
            clientOptions
          );
          this._onDidChange.fire();
        }
        return;
      }
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = this._workspaceTracker.getOuterMostWorkspaceFolder(folder);

    if (!this.clients.has(folder.uri.toString())) {
      let documentSelector;
      if (this._workspaceTracker.mode === WorkspaceMode.MULTI_ROOT) {
        // multi-root workspace
        // create document selector with glob pattern that will match files
        // in that directory
        const pattern = `${folder.uri.fsPath}/**/*`;
        // additionally if this is the first workspace add untitled schema files
        // NOTE that no client will match file: outside any of the workspace folders
        // if we passed a glob allowing any file the first server would get requests form
        // other workspace folders
        const maybeUntitledDocumentSelector =
          folder.index === 0 ? untitledDocumentSelector : [];

        documentSelector = [
          ...patternDocumentSelector(pattern),
          ...maybeUntitledDocumentSelector,
        ];
      } else if (this._workspaceTracker.mode === WorkspaceMode.SINGLE_FOLDER) {
        // single folder workspace
        // no need to filter with glob patterns
        // the client will get all requests even from untitled: and files outside
        // workspace folder
        documentSelector = defaultDocumentSelector;
      } else if (this._workspaceTracker.mode === WorkspaceMode.NO_WORKSPACE) {
        throw "this should not happen";
      }

      const workspaceClientOptions: LanguageClientOptions = {
        ...clientOptions,
        // the client will iterate through this list and chose the first matching element
        documentSelector: documentSelector,
        workspaceFolder: folder,
      };

      const [client, clientPromise] = startClient(
        context,
        workspaceClientOptions
      );
      this.clients.set(folder.uri.toString(), client);
      this.clientsPromises.set(folder.uri.toString(), clientPromise);
      this._onDidChange.fire();
    }
  }

  public async deactivate() {
    const clientStartPromises: Promise<unknown>[] = [];
    const clientsToDispose: LanguageClient[] = [];
    let changed = false;
    if (this.defaultClient) {
      clientStartPromises.push(this.defaultClientPromise!);
      clientsToDispose.push(this.defaultClient);
      this.defaultClient = null;
      this.defaultClientPromise = null;
      changed = true;
    }

    for (const [uri, client] of this.clients.entries()) {
      clientStartPromises.push(this.clientsPromises.get(uri)!);
      clientsToDispose.push(client);
      changed = true;
    }

    this.clients.clear();
    this.clientsPromises.clear();

    if (changed) {
      this._onDidChange.fire();
    }
    // need to await - disposing or stopping a starting client crashes
    // in vscode-languageclient 8.1.0
    // https://github.com/microsoft/vscode-languageserver-node/blob/d859bb14d1bcb3923eecaf0ef587e55c48502ccc/client/src/common/client.ts#L1311
    try {
      await Promise.all(clientStartPromises);
    } catch {
      /* no reason to log here */
    }
    try {
      // dispose can timeout
      await Promise.all(clientsToDispose.map((client) => client.dispose()));
    } catch {
      /* no reason to log here */
    }
  }

  public async handleWorkspaceFolderRemoved(folder: vscode.WorkspaceFolder) {
    const uri = folder.uri.toString();
    const client = this.clients.get(uri);
    if (client) {
      console.log("ElixirLS: Stopping LSP client for", folder.uri.fsPath);
      const clientPromise = this.clientsPromises.get(uri);

      this.clients.delete(uri);
      this.clientsPromises.delete(uri);

      this._onDidChange.fire();

      // need to await - disposing or stopping a starting client crashes
      // in vscode-languageclient 8.1.0
      // https://github.com/microsoft/vscode-languageserver-node/blob/d859bb14d1bcb3923eecaf0ef587e55c48502ccc/client/src/common/client.ts#L1311
      try {
        await clientPromise;
      } catch (e) {
        console.warn(
          "ElixirLS: error during wait for stoppable LSP client state",
          e
        );
      }
      try {
        // dispose can timeout
        await client.dispose();
      } catch (e) {
        console.warn("ElixirLS: error during LSP client dispose", e);
      }
    }
  }
}
