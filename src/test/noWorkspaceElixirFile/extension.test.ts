import * as assert from "node:assert";

import * as path from "node:path";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import type { ElixirLS } from "../../extension";
import { WorkspaceMode } from "../../project";
import { getExtension } from "../utils";

let extension: vscode.Extension<ElixirLS>;
const fixturesPath = path.resolve(__dirname, "../../../src/test-fixtures");

suite("No workspace elixir file opened tests", () => {
  vscode.window.showInformationMessage("Start no workspace tests.");

  suiteSetup(async () => {
    extension = getExtension();
  });

  test("extension is active and starts default client", async () => {
    assert.ok(extension.isActive);
    assert.equal(
      extension.exports.workspaceTracker.mode,
      WorkspaceMode.NO_WORKSPACE,
    );
    assert.ok(extension.exports.languageClientManager.defaultClient);
    assert.equal(extension.exports.languageClientManager.clients.size, 0);
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
      extension.exports.languageClientManager.getClientByUri(sampleFileUri),
      extension.exports.languageClientManager.defaultClient,
    );
  });

  test("requests from file: docs go to default client", async () => {
    const sampleFileUri = vscode.Uri.file(
      path.join(fixturesPath, "elixir_file.ex"),
    );
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(sampleFileUri),
      extension.exports.languageClientManager.defaultClient,
    );
  });
});
