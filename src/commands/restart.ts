import * as vscode from "vscode";
import { ELIXIR_LS_EXTENSION_NAME } from "../constants";
import type { LanguageClientManager } from "../languageClientManager";
import { reporter } from "../telemetry";

export function configureRestart(
  context: vscode.ExtensionContext,
  languageClientManager: LanguageClientManager,
) {
  const disposable = vscode.commands.registerCommand(
    "extension.restart",
    async () => {
      const extension = vscode.extensions.getExtension(
        ELIXIR_LS_EXTENSION_NAME,
      );

      if (!extension) {
        return;
      }

      reporter.sendTelemetryEvent("restart_command");

      languageClientManager.restart();
    },
  );

  context.subscriptions.push(disposable);
}
