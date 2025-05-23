import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

const platformCommand = (command: Kind) =>
  command + (os.platform() === "win32" ? ".bat" : ".sh");

export type Kind = "language_server" | "debug_adapter" | "elixir_check";
export function buildCommand(
  context: vscode.ExtensionContext,
  kind: Kind,
  workspaceFolder: vscode.WorkspaceFolder | undefined,
) {
  // get workspaceFolder scoped configuration or default
  const lsOverridePath = vscode.workspace
    .getConfiguration("elixirLS", workspaceFolder)
    .get<string>("languageServerOverridePath");

  const command = platformCommand(kind);

  const dir =
    process.env.ELS_LOCAL === "1"
      ? "./elixir-ls/scripts/"
      : "./elixir-ls-release/";

  return lsOverridePath
    ? path.join(lsOverridePath, command)
    : context.asAbsolutePath(dir + command);
}
