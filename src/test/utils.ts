import * as vscode from "vscode";

export const sleep = (timeout: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

export const waitForWorkspaceUpdate = (fun: () => void) =>
  new Promise((resolve, reject) => {
    const disposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
      disposable.dispose();
      resolve(undefined);
    });
    try {
      fun();
    } catch (e) {
      reject(e);
    }
  });
