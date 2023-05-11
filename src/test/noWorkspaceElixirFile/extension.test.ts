import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as path from "path";
import { languageClientManager, workspaceTracker } from "../../extension";
import { ELIXIR_LS_EXTENSION_NAME } from "../../constants";
import { WorkspaceMode } from "../../project";

let extension: vscode.Extension<void>;
const fixturesPath = path.resolve(__dirname, "../../../src/test-fixtures");

suite("No workspace elixir file opened tests", () => {
  vscode.window.showInformationMessage("Start no workspace tests.");

  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension(ELIXIR_LS_EXTENSION_NAME);
    assert(ext);
    extension = ext!;
  });

  test("extension is active and starts default client", async () => {
    assert.ok(extension.isActive);
    assert.equal(workspaceTracker.mode, WorkspaceMode.NO_WORKSPACE);
    assert.ok(languageClientManager.defaultClient);
    assert.equal(languageClientManager.clients.size, 0);
  }).timeout(30000);

  // test("starts default client when untitled: .exs opened", async () => {
  //   const sampleFileUri = vscode.Uri.parse("untitled:sample.exs");
  //   const document = await vscode.workspace.openTextDocument(sampleFileUri);
  //   await vscode.window.showTextDocument(document);
  //   assert.ok(languageClientManager.defaultClientPromise);
  //   assert.equal(languageClientManager.clients.size, 0);
  // }).timeout(30000);

  test("requests from untitled: docs go to default client", async () => {
    const sampleFileUri = vscode.Uri.parse("untitled:sample.exs");
    assert.equal(
      languageClientManager.getClientByUri(sampleFileUri),
      languageClientManager.defaultClient
    );
  });

  test("requests from file: docs go to default client", async () => {
    const sampleFileUri = vscode.Uri.file(
      path.join(fixturesPath, "elixir_file.ex")
    );
    assert.equal(
      languageClientManager.getClientByUri(sampleFileUri),
      languageClientManager.defaultClient
    );
  });
});
