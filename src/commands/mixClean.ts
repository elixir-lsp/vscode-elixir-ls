"use strict";

import * as vscode from "vscode";
import {
  ExecuteCommandParams,
  LanguageClient,
  State,
} from "vscode-languageclient/node";
import { LanguageClientManager } from "../languageClientManager";
import { ELIXIR_LS_EXTENSION_NAME } from "../constants";

export function configureMixClean(
  context: vscode.ExtensionContext,
  languageClientManager: LanguageClientManager,
  cleanDeps: boolean
) {
  const commandName =
    "extension." + (cleanDeps ? "mixCleanIncludeDeps" : "mixClean");
  const disposable = vscode.commands.registerCommand(commandName, async () => {
    const extension = vscode.extensions.getExtension(ELIXIR_LS_EXTENSION_NAME);

    if (!extension) {
      return;
    }

    await Promise.all(
      languageClientManager
        .allClientsPromises()
        .map(async (clientPromise: Promise<LanguageClient>) => {
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
              (c) => c.startsWith("mixClean:")
            )!;

          const params: ExecuteCommandParams = {
            command: command,
            arguments: [cleanDeps],
          };

          await client.sendRequest("workspace/executeCommand", params);
        })
    );
  });

  context.subscriptions.push(disposable);
}
