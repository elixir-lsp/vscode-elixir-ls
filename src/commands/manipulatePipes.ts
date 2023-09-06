"use strict";

import * as vscode from "vscode";
import {
  ExecuteCommandParams,
  ExecuteCommandRequest,
  State,
} from "vscode-languageclient";
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

    const uri = editor.document.uri;
    const clientPromise = languageClientManager.getClientPromiseByDocument(
      editor.document
    );

    if (!clientPromise) {
      console.error(`ElixirLS: no language client for document ${uri.fsPath}`);
      return;
    }

    const client = await clientPromise;

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

    await client.sendRequest(ExecuteCommandRequest.type, params);
  });

  context.subscriptions.push(disposable);
}
