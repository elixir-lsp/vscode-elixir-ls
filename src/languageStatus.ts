import * as vscode from "vscode";
import { type LanguageClient, State } from "vscode-languageclient/node";
import type { LanguageClientManager } from "./languageClientManager";

// Languages for which the ElixirLS language status item should be shown.
const statusSelector: vscode.DocumentSelector = [
  "elixir",
  "eex",
  "html-eex",
  "phoenix-heex",
];

type StatusEntry = {
  item: vscode.LanguageStatusItem;
  stateSubscription: vscode.Disposable;
};

function folderLabel(client: LanguageClient): string {
  // client.name is "ElixirLS - <folder>" or "ElixirLS - (default)"
  return client.name.replace(/^ElixirLS - /, "");
}

function updateItem(item: vscode.LanguageStatusItem, client: LanguageClient) {
  const label = folderLabel(client);

  switch (client.state) {
    case State.Starting:
      item.busy = true;
      item.severity = vscode.LanguageStatusSeverity.Information;
      item.text = "ElixirLS";
      item.detail = `Starting language server for ${label}…`;
      break;
    case State.Running: {
      item.busy = false;
      item.severity = vscode.LanguageStatusSeverity.Information;
      const serverInfo = client.initializeResult?.serverInfo;
      const version = serverInfo?.version ? ` v${serverInfo.version}` : "";
      item.text = `ElixirLS${version}`;
      item.detail = `Language server running for ${label}`;
      break;
    }
    default:
      // State.Stopped
      item.busy = false;
      item.severity = vscode.LanguageStatusSeverity.Warning;
      item.text = "ElixirLS";
      item.detail = `Language server stopped for ${label}`;
      break;
  }
}

/**
 * Surfaces ElixirLS language server state in the VS Code Language Status popup
 * (the `{}` control to the right of the status bar). One item is shown per
 * running client (per workspace folder, plus the default client), reflecting
 * its lifecycle state, server version, and a Restart action.
 */
export function configureLanguageStatus(
  context: vscode.ExtensionContext,
  languageClientManager: LanguageClientManager,
): void {
  const entries = new Map<string, StatusEntry>();

  const removeEntry = (key: string, entry: StatusEntry) => {
    entry.stateSubscription.dispose();
    entry.item.dispose();
    entries.delete(key);
  };

  const refresh = () => {
    const clients = languageClientManager.allClients();
    const seen = new Set<string>();

    for (const client of clients) {
      const key = client.name;
      seen.add(key);

      let entry = entries.get(key);
      if (!entry) {
        const item = vscode.languages.createLanguageStatusItem(
          `elixirLS.status.${key}`,
          statusSelector,
        );
        item.name = "ElixirLS";
        item.command = {
          command: "extension.restart",
          title: "Restart",
        };
        const stateSubscription = client.onDidChangeState(() =>
          updateItem(item, client),
        );
        entry = { item, stateSubscription };
        entries.set(key, entry);
      }

      updateItem(entry.item, client);
    }

    // Dispose items for clients that no longer exist (e.g. removed folders).
    for (const [key, entry] of entries) {
      if (!seen.has(key)) {
        removeEntry(key, entry);
      }
    }
  };

  context.subscriptions.push(languageClientManager.onDidChange(refresh));
  context.subscriptions.push({
    dispose() {
      for (const [key, entry] of entries) {
        removeEntry(key, entry);
      }
    },
  });

  refresh();
}
