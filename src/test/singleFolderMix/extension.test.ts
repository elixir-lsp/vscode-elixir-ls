import * as assert from "node:assert";

import * as path from "node:path";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { type RunTestArgs, runTest } from "../../commands/runTest";
import { trackerFactory } from "../../debugAdapter";
import type { ElixirLS } from "../../extension";
import { WorkspaceMode } from "../../project";
import { getExtension, waitForLanguageClientManagerUpdate } from "../utils";

// biome-ignore lint/suspicious/noExplicitAny: DAP event payloads are untyped
type ExUnitEvent = Record<string, any>;

let extension: vscode.Extension<ElixirLS>;
const fixturesPath = path.resolve(__dirname, "../../../src/test-fixtures");

suite("Single folder mix tests", () => {
  vscode.window.showInformationMessage(
    "Start single folder mix project tests.",
  );

  suiteSetup(async () => {
    extension = getExtension();
  });

  test("extension detects mix.exs and activates", async () => {
    assert.ok(extension.isActive);
    assert.equal(
      extension.exports.workspaceTracker.mode,
      WorkspaceMode.SINGLE_FOLDER,
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
        "single_folder_mix.ex",
      ),
    );

    await waitForLanguageClientManagerUpdate(extension, async () => {
      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document);
    });

    assert.ok(!extension.exports.languageClientManager.defaultClient);
    assert.equal(extension.exports.languageClientManager.clients.size, 1);
  }).timeout(30000);

  test("requests from untitled: docs go to first workspace client", async () => {
    const sampleFileUri = vscode.Uri.parse("untitled:sample.exs");
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(sampleFileUri),
      extension.exports.languageClientManager.clients.get(
        vscode.workspace.workspaceFolders?.[0].uri.toString() ?? "",
      ),
    );
  });

  test("requests from workspace file: docs go to first workspace client", async () => {
    const fileUri = vscode.Uri.file(
      path.join(
        fixturesPath,
        "single_folder_mix",
        "lib",
        "single_folder_mix.ex",
      ),
    );
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(fileUri),
      extension.exports.languageClientManager.clients.get(
        vscode.workspace.workspaceFolders?.[0].uri.toString() ?? "",
      ),
    );
  });

  test("requests from non workspace file: docs go to first workspace client", async () => {
    const fileUri = vscode.Uri.file(path.join(fixturesPath, "elixir_file.ex"));
    assert.equal(
      extension.exports.languageClientManager.getClientByUri(fileUri),
      extension.exports.languageClientManager.clients.get(
        vscode.workspace.workspaceFolders?.[0].uri.toString() ?? "",
      ),
    );
  });

  // Launches the fixture project's ExUnit suite through the debug adapter (the
  // same path the Test Explorer uses) and asserts the test lifecycle events
  // emitted by ElixirLS.DebugAdapter.ExUnitFormatter are received over DAP.
  test("runs ExUnit tests and receives test events", async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, "expected a workspace folder");
    const projectDir = workspaceFolder.uri.fsPath;

    const testFileUri = vscode.Uri.file(
      path.join(projectDir, "test", "single_folder_mix_test.exs"),
    );

    // Collect the ex_unit notifications streamed over DAP.
    const events: ExUnitEvent[] = [];
    const listener = trackerFactory.onOutput((output) => {
      if (output.output.body.category === "ex_unit") {
        events.push(output.output.body.data as ExUnitEvent);
      }
    });

    // A throwaway controller/run for runTest to report results into, plus a test
    // item it can resolve for the fixture's "greets the world" test.
    const controller = vscode.tests.createTestController(
      "elixirLSTestEvents",
      "Test events",
    );
    const run = controller.createTestRun(new vscode.TestRunRequest());
    const greetsItem = controller.createTestItem(
      "greets the world",
      "greets the world",
      testFileUri,
    );

    const args: RunTestArgs = {
      cwd: projectDir,
      filePath: "test/single_folder_mix_test.exs",
      workspaceFolder,
      getTest: (_file, _module, _describe, name) =>
        name === "greets the world" ? greetsItem : undefined,
    };

    try {
      // debug = false → runs `mix test` without interpretation
      await runTest(run, args, false);
    } finally {
      listener.dispose();
      run.end();
      controller.dispose();
    }

    const byEvent = (name: string) =>
      events.filter((e) => e.event === name).map((e) => e.name);

    assert.ok(
      byEvent("test_started").includes("greets the world"),
      `expected a test_started for "greets the world"; got ${JSON.stringify(events)}`,
    );
    assert.ok(
      byEvent("test_passed").includes("greets the world"),
      `expected a test_passed for "greets the world"; got ${JSON.stringify(events)}`,
    );
  }).timeout(180000);
});
