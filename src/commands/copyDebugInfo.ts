import { execSync } from "node:child_process";
import * as os from "node:os";
import * as vscode from "vscode";
import { ELIXIR_LS_EXTENSION_NAME } from "../constants";

export function configureCopyDebugInfo(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.copyDebugInfo",
    () => {
      const elixirVersion = execSync("elixir --version");
      const extension = vscode.extensions.getExtension(
        ELIXIR_LS_EXTENSION_NAME,
      );
      if (!extension) {
        return;
      }

      const message = `
* Elixir & Erlang versions (elixir --version): ${elixirVersion}
* VSCode ElixirLS version: ${extension.packageJSON.version}
* Operating System Version: ${os.platform()} ${os.release()}
`;

      vscode.window.showInformationMessage(`Copied to clipboard: ${message}`);
      vscode.env.clipboard.writeText(message);
    },
  );
  context.subscriptions.push(disposable);
}
