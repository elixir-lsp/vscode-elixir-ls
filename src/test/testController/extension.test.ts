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

suite("Test controller: discovery", () => {
  vscode.window.showInformationMessage(
    "Start test controller discovery tests.",
  );

  suiteSetup(async () => {
    extension = await getActiveExtensionAsync();
  });

  test("groups discovered test files under the workspace folder item", async () => {
    const controller = extension.exports.testController;
    assert.ok(
      controller,
      "expected the extension to expose its test controller",
    );

    await controller.resolveHandler?.(undefined);

    const folderItem = controller.items.get(workspaceFolder().uri.toString());
    assert.ok(folderItem, "expected a test item for the workspace folder");

    const testUri = vscode.Uri.file(
      path.join(
        workspaceFolder().uri.fsPath,
        "test",
        "single_folder_mix_test.exs",
      ),
    );

    assert.ok(
      folderItem.children.get(testUri.toString()),
      "expected the test file item under the workspace folder item",
    );
    // file items must live under the workspace-folder item, not the root
    assert.ok(
      !controller.items.get(testUri.toString()),
      "file items must not be added to the root collection",
    );
  }).timeout(60000);

  test("adds a file item under the workspace folder when a test file is created", async () => {
    const controller = extension.exports.testController;
    // ensure the file-system watcher is registered
    await controller.resolveHandler?.(undefined);

    const folderItem = controller.items.get(workspaceFolder().uri.toString());
    assert.ok(folderItem);

    const addedUri = vscode.Uri.file(
      path.join(
        workspaceFolder().uri.fsPath,
        "test",
        "discovery_added_test.exs",
      ),
    );

    try {
      await vscode.workspace.fs.writeFile(
        addedUri,
        Buffer.from(
          "defmodule DiscoveryAddedTest do\n  use ExUnit.Case\nend\n",
        ),
      );

      assert.ok(
        await waitFor(
          () => folderItem.children.get(addedUri.toString()) !== undefined,
        ),
        "added test file should appear under the workspace folder item",
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
