import * as assert from "node:assert";

import * as path from "node:path";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

import { getActiveExtensionAsync } from "../utils";

const fixturesPath = path.resolve(__dirname, "../../../src/test-fixtures");

suite("Single folder no mix tests", () => {
  vscode.window.showInformationMessage("Start single folder no mix tests.");

  test("extension activates on file open", async () => {
    const fileUri = vscode.Uri.file(
      path.join(fixturesPath, "single_folder_no_mix", "elixir_file.ex"),
    );
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);

    const extension = await getActiveExtensionAsync();

    assert.ok(extension.isActive);

    assert.ok(!extension.exports.languageClientManager.defaultClient);
    assert.equal(extension.exports.languageClientManager.clients.size, 1);
  }).timeout(30000);

  test("requests from untitled: docs go to first workspace client", async () => {
    const sampleFileUri = vscode.Uri.parse("untitled:sample.exs");
    const extension = await getActiveExtensionAsync();
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(sampleFileUri),
      extension.exports.languageClientManager.clients.get(
        vscode.workspace.workspaceFolders?.[0].uri.toString() ?? "",
      ),
    );
  });

  test("requests from workspace file: docs go to first workspace client", async () => {
    const fileUri = vscode.Uri.file(
      path.join(fixturesPath, "single_folder_no_mix", "elixir_file.ex"),
    );
    const extension = await getActiveExtensionAsync();
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(fileUri),
      extension.exports.languageClientManager.clients.get(
        vscode.workspace.workspaceFolders?.[0].uri.toString() ?? "",
      ),
    );
  });

  test("requests from non workspace file: docs go to first workspace client", async () => {
    const fileUri = vscode.Uri.file(path.join(fixturesPath, "elixir_file.ex"));
    const extension = await getActiveExtensionAsync();
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(fileUri),
      extension.exports.languageClientManager.clients.get(
        vscode.workspace.workspaceFolders?.[0].uri.toString() ?? "",
      ),
    );
  });
});
