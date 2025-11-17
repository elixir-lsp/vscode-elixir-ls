import * as vscode from "vscode";
import {
  type Disposable,
  type DocumentSelector,
  type Executable,
  LanguageClient,
  type LanguageClientOptions,
  RevealOutputChannelOn,
  type ServerOptions,
} from "vscode-languageclient/node";
import { buildCommand } from "./executable";
import { WorkspaceMode, type WorkspaceTracker } from "./project";
import {
  preprocessStacktraceInProperties,
  reporter,
  type TelemetryEvent,
} from "./telemetry";

// Languages fully handled by this extension
const languageIds = ["elixir", "eex", "html-eex", "phoenix-heex"];

// Template languages handled by their own extensions but require activation of this
// one for compiler diagnostics. Template languages that compile down to Elixir AST
// and embed other languages (e.g. HTML, CSS, JS and Elixir itself), should be moved
// here for proper language service forwarding via "embedded-content".
const templateLanguageIds = ["surface"];

const activationLanguageIds = languageIds.concat(templateLanguageIds);

const defaultDocumentSelector = languageIds.flatMap((language) => [
  { language, scheme: "file" },
  { language, scheme: "untitled" },
  { language, scheme: "embedded-content" },
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
  clientOptions: LanguageClientOptions,
): [LanguageClient, Promise<LanguageClient>, Disposable[]] {
  const serverOpts: Executable = {
    command: `"${buildCommand(
      context,
      "language_server",
      clientOptions.workspaceFolder,
    )}"`,
    options: { shell: true },
  };

  // If the extension is launched in debug mode then the `debug` server options are used instead of `run`
  // currently we pass the same options regardless of the mode
  const serverOptions: ServerOptions = {
    run: serverOpts,
    debug: serverOpts,
  };

  let displayName: string;
  if (clientOptions.workspaceFolder) {
    console.log(
      `ElixirLS: starting LSP client for ${clientOptions.workspaceFolder.uri.fsPath} with server options`,
      serverOptions,
      "client options",
      clientOptions,
    );
    displayName = `ElixirLS - ${clientOptions.workspaceFolder?.name}`;
    reporter.sendTelemetryEvent("language_client_starting", {
      "elixir_ls.language_client_mode": "workspaceFolder",
    });
  } else {
    console.log(
      "ElixirLS: starting default LSP client with server options",
      serverOptions,
      "client options",
      clientOptions,
    );
    displayName = "ElixirLS - (default)";
    reporter.sendTelemetryEvent("language_client_starting", {
      "elixir_ls.language_client_mode": "default",
    });
  }

  const client = new LanguageClient(
    "elixirLS", // langId
    displayName, // display name
    serverOptions,
    clientOptions,
  );

  const clientDisposables: Disposable[] = [];

  clientDisposables.push(
    client.onTelemetry((event: TelemetryEvent) => {
      if (event.name.endsWith("_error")) {
        reporter.sendTelemetryErrorEvent(
          event.name,
          preprocessStacktraceInProperties(event.properties),
          event.measurements,
        );
      } else {
        reporter.sendTelemetryEvent(
          event.name,
          event.properties,
          event.measurements,
        );
      }
    }),
  );

  const clientPromise = new Promise<LanguageClient>((resolve, reject) => {
    const startTime = performance.now();
    client
      .start()
      .then(() => {
        const elapsed = performance.now() - startTime;
        if (clientOptions.workspaceFolder) {
          console.log(
            `ElixirLS: started LSP client for ${clientOptions.workspaceFolder.uri.toString()}`,
          );
        } else {
          console.log("ElixirLS: started default LSP client");
        }
        reporter.sendTelemetryEvent(
          "language_client_started",
          {
            "elixir_ls.language_client_mode": clientOptions.workspaceFolder
              ? "workspaceFolder"
              : "default",
          },
          { "elixir_ls.language_client_activation_time": elapsed },
        );
        resolve(client);
      })
      .catch((reason) => {
        reporter.sendTelemetryErrorEvent("language_client_start_error", {
          "elixir_ls.language_client_mode": clientOptions.workspaceFolder
            ? "workspaceFolder"
            : "default",
          "elixir_ls.language_client_start_error": String(reason),
          "elixir_ls.language_client_start_error_stack": reason?.stack ?? "",
        });
        if (clientOptions.workspaceFolder) {
          console.error(
            `ElixirLS: failed to start LSP client for ${clientOptions.workspaceFolder.uri.toString()}: ${reason}`,
          );
        } else {
          console.error(
            `ElixirLS: failed to start default LSP client: ${reason}`,
          );
        }
        reject(reason);
      });
  });

  return [client, clientPromise, clientDisposables];
}

export class LanguageClientManager {
  defaultClient: LanguageClient | null = null;
  defaultClientPromise: Promise<LanguageClient> | null = null;
  private defaultClientDisposables: Disposable[] | null = null;
  clients: Map<string, LanguageClient> = new Map();
  clientsPromises: Map<string, Promise<LanguageClient>> = new Map();
  private clientsDisposables: Map<string, Disposable[]> = new Map();
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

  public allClientsPromises(): Promise<LanguageClient>[] {
    const result = [...this.clientsPromises.values()];

    if (this.defaultClientPromise) {
      result.push(this.defaultClientPromise);
    }

    return result;
  }

  public restart() {
    const restartPromise = async (
      client: LanguageClient,
      isDefault: boolean,
      key?: string | undefined,
    ) =>
      new Promise<LanguageClient>((resolve, reject) => {
        reporter.sendTelemetryEvent("language_client_restarting", {
          "elixir_ls.language_client_mode": !isDefault
            ? "workspaceFolder"
            : "default",
        });
        const startTime = performance.now();
        client
          .restart()
          .then(() => {
            const elapsed = performance.now() - startTime;
            reporter.sendTelemetryEvent(
              "language_client_started",
              {
                "elixir_ls.language_client_mode": !isDefault
                  ? "workspaceFolder"
                  : "default",
              },
              { "elixir_ls.language_client_activation_time": elapsed },
            );
            if (!isDefault) {
              console.log(`ElixirLS: started LSP client for ${key}`);
            } else {
              console.log("ElixirLS: started default LSP client");
            }
            resolve(client);
          })
          .catch((e) => {
            reporter.sendTelemetryErrorEvent("language_client_restart_error", {
              "elixir_ls.language_client_mode": !isDefault
                ? "workspaceFolder"
                : "default",
              "elixir_ls.language_client_start_error": String(e),
              "elixir_ls.language_client_start_error_stack": e?.stack ?? "",
            });
            if (!isDefault) {
              console.error(
                `ElixirLS: failed to start LSP client for ${key}: ${e}`,
              );
            } else {
              console.error(
                `ElixirLS: failed to start default LSP client: ${e}`,
              );
            }
            reject(e);
          });
      });

    for (const [key, client] of this.clients) {
      console.log(`ElixirLS: restarting LSP client for ${key}`);
      this.clientsPromises.set(key, restartPromise(client, false, key));
    }
    if (this.defaultClient) {
      console.log("ElixirLS: restarting default LSP client");
      this.defaultClientPromise = restartPromise(this.defaultClient, true);
    }
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
        }
        throw "default client LSP not started";
      }
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = this._workspaceTracker.getOuterMostWorkspaceFolder(folder);

    const client = this.clients.get(folder.uri.toString());
    if (client) {
      return client;
    }
    throw `LSP client for ${folder.uri.toString()} not started`;
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
        // biome-ignore lint/style/noNonNullAssertion: a default client is always started when no workspace folders exist
        return this.defaultClientPromise!;
      }
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = this._workspaceTracker.getOuterMostWorkspaceFolder(folder);

    // biome-ignore lint/style/noNonNullAssertion: the client promise is set when the workspace folder's client is started
    return this.clientsPromises.get(folder.uri.toString())!;
  }

  public getClientByDocument(
    document: vscode.TextDocument,
  ): LanguageClient | null {
    // We are only interested in elixir files
    if (document.languageId !== "elixir") {
      return null;
    }

    return this.getClientByUri(document.uri);
  }

  public getClientPromiseByDocument(
    document: vscode.TextDocument,
  ): Promise<LanguageClient> | null {
    // We are only interested in elixir files
    if (document.languageId !== "elixir") {
      return null;
    }

    return this.getClientPromiseByUri(document.uri);
  }

  public handleDidOpenTextDocument(
    document: vscode.TextDocument,
    context: vscode.ExtensionContext,
  ) {
    // We are only interested in elixir related files
    if (!activationLanguageIds.includes(document.languageId)) {
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
          [
            this.defaultClient,
            this.defaultClientPromise,
            this.defaultClientDisposables,
          ] = startClient(context, clientOptions);
          this._onDidChange.fire();
        }
        return;
      }
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = this._workspaceTracker.getOuterMostWorkspaceFolder(folder);

    if (!this.clients.has(folder.uri.toString())) {
      // The document selector will be assigned based on workspace mode
      let documentSelector: DocumentSelector = defaultDocumentSelector;
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

      const [client, clientPromise, clientDisposables] = startClient(
        context,
        workspaceClientOptions,
      );
      this.clients.set(folder.uri.toString(), client);
      this.clientsPromises.set(folder.uri.toString(), clientPromise);
      this.clientsDisposables.set(folder.uri.toString(), clientDisposables);
      this._onDidChange.fire();
    }
  }

  public async deactivate() {
    const clientStartPromises: Promise<unknown>[] = [];
    const clientsToDispose: LanguageClient[] = [];
    let changed = false;
    if (this.defaultClient) {
      this.defaultClientDisposables?.forEach((d) => d.dispose());
      // biome-ignore lint/style/noNonNullAssertion: defaultClientPromise is defined whenever defaultClient is
      clientStartPromises.push(this.defaultClientPromise!);
      clientsToDispose.push(this.defaultClient);
      this.defaultClient = null;
      this.defaultClientPromise = null;
      this.defaultClientDisposables = null;
      changed = true;
    }

    for (const [uri, client] of this.clients.entries()) {
      this.clientsDisposables.get(uri)?.forEach((d) => d.dispose());
      // biome-ignore lint/style/noNonNullAssertion: a promise exists for every started client
      clientStartPromises.push(this.clientsPromises.get(uri)!);
      clientsToDispose.push(client);
      changed = true;
    }

    this.clients.clear();
    this.clientsPromises.clear();
    this.clientsDisposables.clear();

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
      this.clientsDisposables.get(uri)?.forEach((d) => d.dispose());
      // biome-ignore lint/style/noNonNullAssertion: a promise exists for every started client
      const clientPromise = this.clientsPromises.get(uri)!;

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
          e,
        );
        reporter.sendTelemetryErrorEvent("language_client_stop_error", {
          "elixir_ls.language_client_stop_error": String(e),
          // biome-ignore lint/suspicious/noExplicitAny: error may not be typed, cast to access stack trace
          "elixir_ls.language_client_stop_error_stack": (<any>e)?.stack ?? "",
        });
      }
      try {
        // dispose can timeout
        await client.dispose();
      } catch (e) {
        console.warn("ElixirLS: error during LSP client dispose", e);
        reporter.sendTelemetryErrorEvent("language_client_stop_error", {
          "elixir_ls.language_client_stop_error": String(e),
          // biome-ignore lint/suspicious/noExplicitAny: error may not be typed, cast to access stack trace
          "elixir_ls.language_client_stop_error_stack": (<any>e)?.stack ?? "",
        });
      }
    }
  }
}
