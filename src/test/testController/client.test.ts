import * as assert from "node:assert";

import * as path from "node:path";
import * as vscode from "vscode";
import type { ElixirLS } from "../../extension";
import {
  getActiveExtensionAsync,
  waitForLanguageClientManagerUpdate,
} from "../utils";

let extension: vscode.Extension<ElixirLS>;

function workspaceFolder(): vscode.WorkspaceFolder {
  const folder = vscode.workspace.workspaceFolders?.[0];
  assert.ok(folder, "expected a workspace folder");
  return folder;
}

suite("Test controller: language client startup", () => {
  vscode.window.showInformationMessage(
    "Start test controller client startup tests.",
  );

  suiteSetup(async () => {
    extension = await getActiveExtensionAsync();
  });

  // No document is opened in this suite and discovery/deletion do not parse, so
  // the language client is not running until the test controller needs it.
  test("starts a language client when resolving a test file with no client running", async () => {
    assert.equal(extension.exports.languageClientManager.clients.size, 0);

    const controller = extension.exports.testController;
    await controller.resolveHandler?.(undefined);

    const folderItem = controller.items.get(workspaceFolder().uri.toString());
    assert.ok(folderItem, "expected a workspace folder test item");

    const testUri = vscode.Uri.file(
      path.join(
        workspaceFolder().uri.fsPath,
        "test",
        "single_folder_mix_test.exs",
      ),
    );
    const fileItem = folderItem.children.get(testUri.toString());
    assert.ok(fileItem, "expected the test file item");

    // parsing the file must start the language client on its own
    await waitForLanguageClientManagerUpdate(extension, () => {
      void controller.resolveHandler?.(fileItem);
    });

    assert.equal(extension.exports.languageClientManager.clients.size, 1);
  }).timeout(60000);
});
