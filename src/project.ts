"use strict";

import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";

export function getProjectDir(workspaceFolder: vscode.WorkspaceFolder): string {
  // check if projectDir is not overridden in workspace
  const projectDir = vscode.workspace
    .getConfiguration("elixirLS", workspaceFolder)
    .get<string>("projectDir");

  return projectDir
    ? path.join(workspaceFolder.uri.fsPath, projectDir)
    : workspaceFolder.uri.fsPath;
}

export enum WorkspaceMode {
  NO_WORKSPACE = "NO_WORKSPACE",
  SINGLE_FOLDER = "SINGLE_FOLDER",
  MULTI_ROOT = "MULTI_ROOT",
}

export class WorkspaceTracker {
  private _sortedWorkspaceFolders: string[] | undefined;

  private sortedWorkspaceFolders(): string[] {
    if (this._sortedWorkspaceFolders === void 0) {
      this._sortedWorkspaceFolders = vscode.workspace.workspaceFolders
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
    return this._sortedWorkspaceFolders;
  }

  public getOuterMostWorkspaceFolder(
    folder: vscode.WorkspaceFolder
  ): vscode.WorkspaceFolder {
    return this._getOuterMostWorkspaceFolder(folder, false);
  }

  private _getOuterMostWorkspaceFolder(
    folder: vscode.WorkspaceFolder,
    isRetry: boolean
  ): vscode.WorkspaceFolder {
    let uri = folder.uri.toString();
    if (uri.charAt(uri.length - 1) !== "/") {
      uri = uri + "/";
    }

    const useCurrentRootFolderAsProjectDir = vscode.workspace
      .getConfiguration("elixirLS", folder)
      .get<boolean>("useCurrentRootFolderAsProjectDir");

    let outermostFolder: vscode.WorkspaceFolder | null = null;

    const sortedWorkspaceFolders = useCurrentRootFolderAsProjectDir
      ? [uri]
      : this.sortedWorkspaceFolders();

    for (const element of sortedWorkspaceFolders) {
      if (uri.startsWith(element)) {
        const foundFolder = vscode.workspace.getWorkspaceFolder(
          vscode.Uri.parse(element)
        );

        if (foundFolder) {
          if (!outermostFolder) {
            // store outermost no mix.exs candidate
            // it will be discarded if better one with mix.exs is found
            outermostFolder = foundFolder;
          }

          const projectDir = getProjectDir(foundFolder);
          const mixFilePath = path.join(projectDir, "mix.exs");
          if (fs.existsSync(mixFilePath)) {
            // outermost workspace folder with mix.exs found
            return foundFolder;
          }
        }
      }
    }

    if (outermostFolder) {
      // no folder containing mix.exs was found, return the outermost folder
      return outermostFolder;
    }

    // most likely handleDidChangeWorkspaceFolders callback hs not yet run
    // clear cache and try again
    if (!isRetry) {
      this.handleDidChangeWorkspaceFolders();
      return this._getOuterMostWorkspaceFolder(folder, true);
    } else {
      throw `not able to find outermost workspace folder for ${folder.uri.fsPath}`;
    }
  }

  public handleDidChangeWorkspaceFolders() {
    this._sortedWorkspaceFolders = undefined;
  }

  public getProjectDirForUri(uri: vscode.Uri) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
      const outermostWorkspaceFolder =
        this.getOuterMostWorkspaceFolder(workspaceFolder);
      return getProjectDir(outermostWorkspaceFolder);
    }
  }

  public get mode(): WorkspaceMode {
    if (vscode.workspace.workspaceFile) {
      return WorkspaceMode.MULTI_ROOT;
    } else if (
      vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length !== 0
    ) {
      return WorkspaceMode.SINGLE_FOLDER;
    } else {
      return WorkspaceMode.NO_WORKSPACE;
    }
  }
}
