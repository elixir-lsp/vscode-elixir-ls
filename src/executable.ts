"use strict";

import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";

const platformCommand = (command: Kind) =>
  command + (os.platform() == "win32" ? ".bat" : ".sh");

export type Kind = "language_server" | "debugger";
export function buildCommand(
  context: vscode.ExtensionContext,
  kind: Kind,
  workspaceFolder: vscode.WorkspaceFolder | undefined
) {
  // get workspaceFolder scoped configuration or default
  const lsOverridePath = vscode.workspace
    .getConfiguration("elixirLS", workspaceFolder)
    .get<string>("languageServerOverridePath");

  const command = platformCommand(kind);

  return lsOverridePath
    ? path.join(lsOverridePath, command)
    : context.asAbsolutePath("./elixir-ls-release/" + command);
}
