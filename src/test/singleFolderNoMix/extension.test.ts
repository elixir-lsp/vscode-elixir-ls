import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as path from "path";
import { languageClientManager, workspaceTracker } from "../../extension";
import { ELIXIR_LS_EXTENSION_NAME } from "../../constants";
import { WorkspaceMode } from "../../project";
import { sleep } from "../utils";

let extension: vscode.Extension<void>;
const fixturesPath = path.resolve(__dirname, "../../../src/test-fixtures");

suite("Single folder no mix tests", () => {
  vscode.window.showInformationMessage("Start single folder no mix tests.");

  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension(ELIXIR_LS_EXTENSION_NAME);
    assert(ext);
    extension = ext!;
  });

  test("Extension is not active", async () => {
    assert.ok(!extension.isActive);
    assert.equal(workspaceTracker.mode, WorkspaceMode.SINGLE_FOLDER);
    assert.ok(!languageClientManager.defaultClient);
    assert.equal(languageClientManager.clients.size, 0);
  }).timeout(30000);

  test("extension activates on file open", async () => {
    const fileUri = vscode.Uri.file(
      path.join(fixturesPath, "single_folder_no_mix", "elixir_file.ex")
    );
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);

    await sleep(3000);

    assert.ok(extension.isActive);

    assert.ok(!languageClientManager.defaultClient);
    assert.equal(languageClientManager.clients.size, 1);
  }).timeout(30000);

  test("requests from untitled: docs go to first workspace client", async () => {
    const sampleFileUri = vscode.Uri.parse("untitled:sample.exs");
    assert.equal(
      languageClientManager.getClientByUri(sampleFileUri),
      languageClientManager.clients.get(
        vscode.workspace.workspaceFolders![0].uri.toString()
      )
    );
  });

  test("requests from workspace file: docs go to first workspace client", async () => {
    const fileUri = vscode.Uri.file(
      path.join(fixturesPath, "single_folder_no_mix", "elixir_file.ex")
    );
    assert.equal(
      languageClientManager.getClientByUri(fileUri),
      languageClientManager.clients.get(
        vscode.workspace.workspaceFolders![0].uri.toString()
      )
    );
  });

  test("requests from non workspace file: docs go to first workspace client", async () => {
    const fileUri = vscode.Uri.file(path.join(fixturesPath, "elixir_file.ex"));
    assert.equal(
      languageClientManager.getClientByUri(fileUri),
      languageClientManager.clients.get(
        vscode.workspace.workspaceFolders![0].uri.toString()
      )
    );
  });
});
