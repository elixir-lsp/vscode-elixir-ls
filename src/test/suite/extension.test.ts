import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { languageClientManager } from "../../extension";
import { ELIXIR_LS_EXTENSION_NAME } from "../../constants";

let extension: vscode.Extension<void>;

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension(ELIXIR_LS_EXTENSION_NAME);
    assert(ext);
    extension = ext!;
    await extension.activate();
  });

  test("extension is available", async () => {
    assert.ok(extension.isActive);
    const sampleFileUri = vscode.Uri.parse("untitled:sample.ex");
    const document = await vscode.workspace.openTextDocument(sampleFileUri);
    await vscode.window.showTextDocument(document);
    assert.ok(languageClientManager.defaultClient);
  });
});
