"use strict";

import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import {
  Executable,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ServerOptions,
} from "vscode-languageclient/node";
import { getOuterMostWorkspaceFolder } from "./project";

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
    { language: "surface", scheme: "untitled" },
  ],
  // Don't focus the Output pane on errors because request handler errors are no big deal
  revealOutputChannelOn: RevealOutputChannelOn.Never,
  synchronize: {
    // Synchronize the setting section 'elixirLS' to the server
    configurationSection: "elixirLS",
  },
};

function startClient(
  context: vscode.ExtensionContext,
  clientOptions: LanguageClientOptions
): LanguageClient {
  const command =
    os.platform() == "win32" ? "language_server.bat" : "language_server.sh";

  // get workspaceFolder scoped configuration or default
  const lsOverridePath: string = vscode.workspace
    .getConfiguration("elixirLS", clientOptions.workspaceFolder)
    .get("languageServerOverridePath")!;

  const serverOpts: Executable = {
    command: lsOverridePath
      ? path.join(lsOverridePath, command)
      : context.asAbsolutePath("./elixir-ls-release/" + command),
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
      `ElixirLS: starting client for ${clientOptions.workspaceFolder!.uri.toString()} with server options`,
      serverOptions,
      "client options",
      clientOptions
    );
    displayName = `ElixirLS - ${clientOptions.workspaceFolder!.name}`;
  } else {
    console.log(
      `ElixirLS: starting default client with server options`,
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
  client.start().then(() => {
    if (clientOptions.workspaceFolder) {
      console.log(
        `ElixirLS: started client for ${clientOptions.workspaceFolder!.uri.toString()}`
      );
    } else {
      console.log(`ElixirLS: started default client`);
    }
  });

  return client;
}

export class LanguageClientManager {
  defaultClient: LanguageClient | null = null;
  clients: Map<string, LanguageClient> = new Map();

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
        // untitled file assigned to first workspace
        folder = vscode.workspace.getWorkspaceFolder(
          vscode.workspace.workspaceFolders[0].uri
        )!;
      } else {
        // no workspace folders - use default client
        return this.defaultClient!;
      }
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = getOuterMostWorkspaceFolder(folder);

    return this.clients.get(folder.uri.toString())!;
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

  public async deactivate() {
    const promises: Promise<void>[] = [];
    if (this.defaultClient) {
      promises.push(this.defaultClient.stop());
      this.defaultClient = null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [uri, client] of this.clients.entries()) {
      promises.push(client.stop());
    }
    this.clients.clear();
    await Promise.all(promises);
  }

  public handleDidOpenTextDocument(
    document: vscode.TextDocument,
    context: vscode.ExtensionContext
  ) {
    // We are only interested in elixir related files
    if (
      ["elixir", "eex", "html-eex", "phoenix-heex", "surface"].includes(
        document.languageId
      )
    ) {
      return;
    }

    const uri = document.uri;
    let folder = vscode.workspace.getWorkspaceFolder(uri);

    console.log("uri", uri, "folder", folder?.uri);

    // Files outside of workspace go to default client when no directory is open
    // otherwise they go to first workspace
    // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
    if (!folder) {
      if (
        vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length !== 0
      ) {
        // untitled file assigned to first workspace
        folder = vscode.workspace.getWorkspaceFolder(
          vscode.workspace.workspaceFolders[0].uri
        )!;
      } else {
        // no workspace folders - use default client
        if (!this.defaultClient) {
          // Create the language client and start the client.
          this.defaultClient = startClient(context, clientOptions);
        }
        return;
      }
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = getOuterMostWorkspaceFolder(folder);

    if (!this.clients.has(folder.uri.toString())) {
      const pattern = `${folder.uri.fsPath}/**/*`;
      // open untitled files go to the first workspace
      const untitled =
        folder.index === 0
          ? [
              { language: "elixir", scheme: "untitled" },
              { language: "eex", scheme: "untitled" },
              { language: "html-eex", scheme: "untitled" },
              { language: "phoenix-heex", scheme: "untitled" },
              { language: "surface", scheme: "untitled" },
            ]
          : [];
      const workspaceClientOptions: LanguageClientOptions = {
        ...clientOptions,
        // the client will iterate through this list and chose the first matching element
        documentSelector: [
          { language: "elixir", scheme: "file", pattern: pattern },
          { language: "eex", scheme: "file", pattern: pattern },
          { language: "html-eex", scheme: "file", pattern: pattern },
          { language: "phoenix-heex", scheme: "file", pattern: pattern },
          { language: "surface", scheme: "file", pattern: pattern },
          ...untitled,
        ],
        workspaceFolder: folder,
      };

      this.clients.set(
        folder.uri.toString(),
        startClient(context, workspaceClientOptions)
      );
    }
  }

  public handleWorkspaceFolderRemoved(folder: vscode.WorkspaceFolder) {
    const client = this.clients.get(folder.uri.toString());
    if (client) {
      const uri = folder.uri.toString();
      this.clients.delete(uri);
      client.stop();
    }
  }
}
