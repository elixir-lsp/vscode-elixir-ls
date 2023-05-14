import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { ElixirLS } from "../../extension";
import { ELIXIR_LS_EXTENSION_NAME } from "../../constants";
import { WorkspaceMode } from "../../project";
import { sleep } from "../utils";

let extension: vscode.Extension<ElixirLS>;

suite("No workspace non elixir file opened tests", () => {
  vscode.window.showInformationMessage("Start no workspace tests.");

  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension(ELIXIR_LS_EXTENSION_NAME);
    assert(ext);
    extension = ext!;
  });

  test("extension is not active", async () => {
    assert.ok(!extension.isActive);
  });

  test("activates and starts default client when untitled: .exs opened", async () => {
    const sampleFileUri = vscode.Uri.parse("untitled:sample.exs");
    const document = await vscode.workspace.openTextDocument(sampleFileUri);
    await vscode.window.showTextDocument(document);

    await sleep(3000);

    assert.ok(extension.isActive);
    assert.equal(
      extension.exports.workspaceTracker.mode,
      WorkspaceMode.NO_WORKSPACE
    );
    assert.ok(extension.exports.languageClientManager.defaultClientPromise);
    assert.equal(extension.exports.languageClientManager.clients.size, 0);
  }).timeout(30000);
});
