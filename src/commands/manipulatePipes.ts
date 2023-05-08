"use strict";

import * as vscode from "vscode";
import { ExecuteCommandParams } from "vscode-languageclient";
import { LanguageClientManager } from "../languageClientManager";
import { ELIXIR_LS_EXTENSION_NAME } from "../constants";

export function configureManipulatePipes(
  context: vscode.ExtensionContext,
  languageClientManager: LanguageClientManager,
  operation: "toPipe" | "fromPipe"
) {
  const commandName = `extension.${operation}`;

  const disposable = vscode.commands.registerCommand(commandName, async () => {
    const extension = vscode.extensions.getExtension(ELIXIR_LS_EXTENSION_NAME);
    const editor = vscode.window.activeTextEditor;
    if (!extension || !editor) {
      return;
    }

    const client = languageClientManager.getClientByDocument(editor.document);
    const uri = editor.document.uri;

    if (!client) {
      return;
    }

    const command =
      client.initializeResult!.capabilities.executeCommandProvider!.commands.find(
        (c: string) => c.startsWith("manipulatePipes:")
      )!;

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
