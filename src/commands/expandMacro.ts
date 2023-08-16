"use strict";

import * as vscode from "vscode";
import { ExecuteCommandParams, State } from "vscode-languageclient";
import { LanguageClientManager } from "../languageClientManager";
import { ELIXIR_LS_EXTENSION_NAME } from "../constants";

const ExpandMacroTitle = "Expand macro result";

function getExpandMacroWebviewContent(content: Record<string, string>) {
  let body = "";
  for (const [key, value] of Object.entries(content)) {
    body += `<div>
      <h4>${key}</h4>
      <code><pre>${value}</pre></code>
    </div>`;
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

export function configureExpandMacro(
  context: vscode.ExtensionContext,
  languageClientManager: LanguageClientManager
) {
  const disposable = vscode.commands.registerCommand(
    "extension.expandMacro",
    async () => {
      const extension = vscode.extensions.getExtension(
        ELIXIR_LS_EXTENSION_NAME
      );
      const editor = vscode.window.activeTextEditor;
      if (!extension || !editor) {
        return;
      }

      if (editor.selection.isEmpty) {
        console.error(`ElixirLS: selection is empty`);
        return;
      }

      const uri = editor.document.uri;
      const client = languageClientManager.getClientByDocument(editor.document);

      if (!client) {
        console.error(
          `ElixirLS: no language client for document ${uri.fsPath}`
        );
        return;
      }

      if (!client.initializeResult) {
        console.error(
          `ElixirLS: unable to execute command on server ${
            client.name
          } in state ${State[client.state]}`
        );
        return;
      }

      const command =
        client.initializeResult.capabilities.executeCommandProvider!.commands.find(
          (c) => c.startsWith("expandMacro:")
        )!;

      const params: ExecuteCommandParams = {
        command: command,
        arguments: [
          uri.toString(),
          editor.document.getText(editor.selection),
          editor.selection.start.line,
        ],
      };

      const res: Record<string, string> = await client.sendRequest(
        "workspace/executeCommand",
        params
      );

      const panel = vscode.window.createWebviewPanel(
        "expandMacro",
        ExpandMacroTitle,
        vscode.ViewColumn.One,
        {}
      );
      panel.webview.html = getExpandMacroWebviewContent(res);
    }
  );

  context.subscriptions.push(disposable);
}
