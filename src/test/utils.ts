import * as vscode from "vscode";
import { ELIXIR_LS_EXTENSION_NAME } from "../constants";
import type { ElixirLS } from "../extension";

export const getExtension = () =>
  vscode.extensions.getExtension(
    ELIXIR_LS_EXTENSION_NAME,
  ) as vscode.Extension<ElixirLS>;

const exponentialTimeouts = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000,
];

export const getActiveExtensionAsync = async () => {
  const ext = vscode.extensions.getExtension(
    ELIXIR_LS_EXTENSION_NAME,
  ) as vscode.Extension<ElixirLS>;
  if (ext.isActive) {
    return ext;
  }

  for (const timeout of exponentialTimeouts) {
    await sleep(timeout);
    if (ext.isActive) {
      return ext;
    }
  }
  throw "timed out";
};

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

export const waitForLanguageClientManagerUpdate = (
  extension: vscode.Extension<ElixirLS>,
  fun: () => void,
) =>
  new Promise((resolve, reject) => {
    const disposable = extension.exports.languageClientManager.onDidChange(
      () => {
        disposable.dispose();
        resolve(undefined);
      },
    );
    try {
      fun();
    } catch (e) {
      reject(e);
    }
  });
