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

// Polls `predicate` until it returns true or the timeout elapses. Useful for
// asserting on asynchronous file-system watcher events.
export const waitFor = async (
  predicate: () => boolean,
  timeout = 15000,
  interval = 100,
): Promise<boolean> => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (predicate()) {
      return true;
    }
    await sleep(interval);
  }
  return predicate();
};

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

export const waitForNoLanguageClientManagerUpdate = (
  extension: vscode.Extension<ElixirLS>,
  fun: () => void,
  timeout = 3000,
) =>
  new Promise<void>((resolve, reject) => {
    const disposable = extension.exports.languageClientManager.onDidChange(
      () => {
        disposable.dispose();
        reject(new Error("language client manager changed"));
      },
    );
    try {
      fun();
    } catch (e) {
      disposable.dispose();
      reject(e);
      return;
    }
    setTimeout(() => {
      disposable.dispose();
      resolve();
    }, timeout);
  });
