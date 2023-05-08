"use strict";

import * as path from "path";
import * as vscode from "vscode";

export function getProjectDir(workspaceFolder: vscode.WorkspaceFolder): string {
  // check if projectDir is not overridden in workspace
  const projectDir = vscode.workspace
    .getConfiguration("elixirLS", workspaceFolder)
    .get<string>("projectDir");

  return projectDir
    ? path.join(workspaceFolder.uri.fsPath, projectDir)
    : workspaceFolder.uri.fsPath;
}

let _sortedWorkspaceFolders: string[] | undefined;

function sortedWorkspaceFolders(): string[] {
  if (_sortedWorkspaceFolders === void 0) {
    _sortedWorkspaceFolders = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders
          .map((folder) => {
            let result = folder.uri.toString();
            if (result.charAt(result.length - 1) !== "/") {
              result = result + "/";
            }
            return result;
          })
          .sort((a, b) => {
            return a.length - b.length;
          })
      : [];
  }
  return _sortedWorkspaceFolders;
}

export function getOuterMostWorkspaceFolder(
  folder: vscode.WorkspaceFolder
): vscode.WorkspaceFolder {
  let uri = folder.uri.toString();
  if (uri.charAt(uri.length - 1) !== "/") {
    uri = uri + "/";
  }

  for (const element of sortedWorkspaceFolders()) {
    if (uri.startsWith(element)) {
      return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(element))!;
    }
  }
  throw "this should not happen";
}

export function handleDidChangeWorkspaceFolders() {
  _sortedWorkspaceFolders = undefined;
}
