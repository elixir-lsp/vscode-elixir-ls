import * as assert from "node:assert";

import * as path from "node:path";
import * as vscode from "vscode";
import type { ElixirLS } from "../../extension";
import { getActiveExtensionAsync, waitFor } from "../utils";

let extension: vscode.Extension<ElixirLS>;

function workspaceFolder(): vscode.WorkspaceFolder {
  const folder = vscode.workspace.workspaceFolders?.[0];
  assert.ok(folder, "expected a workspace folder");
  return folder;
}

suite("Test controller: deletion", () => {
  vscode.window.showInformationMessage("Start test controller deletion tests.");

  suiteSetup(async () => {
    extension = await getActiveExtensionAsync();
  });

  test("removes a file item when its test file is deleted", async () => {
    const controller = extension.exports.testController;
    // ensure the file-system watcher is registered
    await controller.resolveHandler?.(undefined);

    const folderItem = controller.items.get(workspaceFolder().uri.toString());
    assert.ok(folderItem);

    const addedUri = vscode.Uri.file(
      path.join(workspaceFolder().uri.fsPath, "test", "delete_me_test.exs"),
    );

    try {
      await vscode.workspace.fs.writeFile(
        addedUri,
        Buffer.from("defmodule DeleteMeTest do\n  use ExUnit.Case\nend\n"),
      );

      assert.ok(
        await waitFor(
          () => folderItem.children.get(addedUri.toString()) !== undefined,
        ),
        "test file should appear under the workspace folder before deletion",
      );

      await vscode.workspace.fs.delete(addedUri);

      assert.ok(
        await waitFor(
          () => folderItem.children.get(addedUri.toString()) === undefined,
        ),
        "deleted test file item should be removed from the tree",
      );
    } finally {
      try {
        await vscode.workspace.fs.delete(addedUri);
      } catch {
        // already deleted
      }
    }
  }).timeout(60000);
});
