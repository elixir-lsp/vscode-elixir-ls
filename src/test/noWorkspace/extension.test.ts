import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { WorkspaceMode } from "../../project";
import { getActiveExtensionAsync } from "../utils";

suite("No workspace non elixir file opened tests", () => {
  vscode.window.showInformationMessage("Start no workspace tests.");

  test("activates and starts default client when untitled: .exs opened", async () => {
    const sampleFileUri = vscode.Uri.parse("untitled:sample.exs");
    const document = await vscode.workspace.openTextDocument(sampleFileUri);
    await vscode.window.showTextDocument(document);

    const extension = await getActiveExtensionAsync();

    assert.equal(
      extension.exports.workspaceTracker.mode,
      WorkspaceMode.NO_WORKSPACE
    );
    assert.ok(extension.exports.languageClientManager.defaultClientPromise);
    assert.equal(extension.exports.languageClientManager.clients.size, 0);
  }).timeout(30000);
});
