import * as vscode from "vscode";
import {
  type ExecuteCommandParams,
  ExecuteCommandRequest,
  type LanguageClient,
  State,
} from "vscode-languageclient/node";
import { ELIXIR_LS_EXTENSION_NAME } from "../constants";
import type { LanguageClientManager } from "../languageClientManager";

export function configureMixClean(
  context: vscode.ExtensionContext,
  languageClientManager: LanguageClientManager,
  cleanDeps: boolean,
) {
  const commandName = `extension.${cleanDeps ? "mixCleanIncludeDeps" : "mixClean"}`;
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
              } in state ${State[client.state]}`,
            );
            return;
          }
          const command =
            // biome-ignore lint/style/noNonNullAssertion: server capabilities guarantee this command exists
            client.initializeResult.capabilities.executeCommandProvider?.commands.find(
              (c) => c.startsWith("mixClean:"),
            )!;

          const params: ExecuteCommandParams = {
            command: command,
            arguments: [cleanDeps],
          };

          await client.sendRequest(ExecuteCommandRequest.type, params);
        }),
    );
  });

  context.subscriptions.push(disposable);
}
