import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as path from "path";
import { ElixirLS } from "../../extension";
import { WorkspaceMode } from "../../project";
import { getExtension, sleep } from "../utils";

let extension: vscode.Extension<ElixirLS>;
const fixturesPath = path.resolve(__dirname, "../../../src/test-fixtures");

suite("Single folder no mix tests", () => {
  vscode.window.showInformationMessage(
    "Start single folder mix project tests."
  );

  suiteSetup(async () => {
    extension = getExtension();
  });

  test("extension detects mix.exs and actives", async () => {
    assert.ok(extension.isActive);
    assert.equal(
      extension.exports.workspaceTracker.mode,
      WorkspaceMode.SINGLE_FOLDER
    );
    assert.ok(!extension.exports.languageClientManager.defaultClient);
    // TODO start client?
    assert.equal(extension.exports.languageClientManager.clients.size, 0);
  }).timeout(30000);

  test("extension starts client on file open", async () => {
    const fileUri = vscode.Uri.file(
      path.join(
        fixturesPath,
        "single_folder_mix",
        "lib",
        "single_folder_mix.ex"
      )
    );
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);

    await sleep(3000);

    assert.ok(!extension.exports.languageClientManager.defaultClient);
    assert.equal(extension.exports.languageClientManager.clients.size, 1);
  }).timeout(30000);

  test("requests from untitled: docs go to first workspace client", async () => {
    const sampleFileUri = vscode.Uri.parse("untitled:sample.exs");
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(sampleFileUri),
      extension.exports.languageClientManager.clients.get(
        vscode.workspace.workspaceFolders![0].uri.toString()
      )
    );
  });

  test("requests from workspace file: docs go to first workspace client", async () => {
    const fileUri = vscode.Uri.file(
      path.join(
        fixturesPath,
        "single_folder_mix",
        "lib",
        "single_folder_mix.ex"
      )
    );
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(fileUri),
      extension.exports.languageClientManager.clients.get(
        vscode.workspace.workspaceFolders![0].uri.toString()
      )
    );
  });

  test("requests from non workspace file: docs go to first workspace client", async () => {
    const fileUri = vscode.Uri.file(path.join(fixturesPath, "elixir_file.ex"));
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(fileUri),
      extension.exports.languageClientManager.clients.get(
        vscode.workspace.workspaceFolders![0].uri.toString()
      )
    );
  });
});
