"use strict";

import * as vscode from "vscode";
import {
  ExecuteCommandParams,
  LanguageClient,
  State,
} from "vscode-languageclient/node";
import { LanguageClientManager } from "../languageClientManager";
import { ELIXIR_LS_EXTENSION_NAME } from "../constants";

export function configureRestart(
  context: vscode.ExtensionContext,
  languageClientManager: LanguageClientManager
) {
  const disposable = vscode.commands.registerCommand(
    "extension.restart",
    async () => {
      const extension = vscode.extensions.getExtension(
        ELIXIR_LS_EXTENSION_NAME
      );

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
                (c) => c.startsWith("restart:")
              )!;

            const params: ExecuteCommandParams = {
              command: command,
              arguments: [],
            };

            try {
              await client.sendRequest("workspace/executeCommand", params);
            } catch {
              // this command will throw Connection got disposed
              // client reference remains valid as VS will restart server process and the connection
            }
          })
      );
    }
  );

  context.subscriptions.push(disposable);
}
