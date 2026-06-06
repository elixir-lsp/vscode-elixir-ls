import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

const platformCommand = (command: Kind) =>
  command + (os.platform() === "win32" ? ".bat" : ".sh");

export type Kind = "language_server" | "debug_adapter" | "elixir_check";

// Resolves a path to a script bundled with the ElixirLS release. In local
// development (ELS_LOCAL=1) scripts are read straight from the submodule;
// otherwise from the packaged release (the release task copies ./scripts there).
export function buildScriptPath(
  context: vscode.ExtensionContext,
  scriptName: string,
) {
  const dir =
    process.env.ELS_LOCAL === "1"
      ? "./elixir-ls/scripts/"
      : "./elixir-ls-release/";

  return context.asAbsolutePath(dir + scriptName);
}

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

  return lsOverridePath
    ? path.join(lsOverridePath, command)
    : buildScriptPath(context, command);
}
