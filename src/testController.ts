import * as vscode from "vscode";
import {
  type ExecuteCommandParams,
  ExecuteCommandRequest,
  State,
} from "vscode-languageclient";
import { type RunTestArgs, runTest } from "./commands/runTest";
import { RUN_TEST_FROM_CODELENS } from "./constants";
import type { LanguageClientManager } from "./languageClientManager";
import { type WorkspaceTracker, getProjectDir } from "./project";
import { reporter } from "./telemetry";

export function configureTestController(
  context: vscode.ExtensionContext,
  languageClientManager: LanguageClientManager,
  workspaceTracker: WorkspaceTracker,
) {
  console.log("ElixirLS: creating test controller");
  const controller = vscode.tests.createTestController(
    "elixirLSExUnitTests",
    "ExUnit Tests",
  );

  context.subscriptions.push(controller);

  // First, create the `resolveHandler`. This may initially be called with
  // "undefined" to ask for all tests in the workspace to be discovered, usually
  // when the user opens the Test Explorer for the first time.
  controller.resolveHandler = async (test) => {
    if (!test) {
      try {
        await discoverAllFilesInWorkspace();
      } catch (e) {
        console.error("ElixirLS: unable to resolve tests in workspace", e);
        reporter.sendTelemetryErrorEvent("test_controller_resolve_error", {
          "elixir_ls.test_controller_resolve_error": String(e),
          "elixir_ls.test_controller_resolve_error_stack":
            // biome-ignore lint/suspicious/noExplicitAny: error may be of an unknown type
            (<any>e)?.stack ?? "",
        });
      }
    } else {
      try {
        await parseTestsInFileContents(test);
      } catch (e) {
        console.error(
          "ElixirLS: unable to resolve tests in ",
          test.uri?.fsPath,
          e,
        );
        reporter.sendTelemetryErrorEvent("test_controller_resolve_error", {
          "elixir_ls.test_controller_resolve_error": String(e),
          "elixir_ls.test_controller_resolve_error_stack":
            // biome-ignore lint/suspicious/noExplicitAny: error may be of an unknown type
            (<any>e)?.stack ?? "",
        });
      }
    }
  };

  context.subscriptions.push(
    // When text documents are open, parse tests in them.
    vscode.workspace.onDidOpenTextDocument(parseTestsInDocument),
    // We could also listen to document changes to re-parse unsaved changes:
    vscode.workspace.onDidChangeTextDocument((e) =>
      parseTestsInDocument(e.document),
    ),
  );

  enum ItemType {
    WorkspaceFolder = 0,
    File = 1,
    Module = 2,
    Describe = 3,
    TestCase = 4,
    Doctest = 5,
  }

  const testData = new WeakMap<vscode.TestItem, ItemType>();

  const getType = (testItem: vscode.TestItem) =>
    testData.get(testItem) ?? ItemType.TestCase;

  const testFileUris = new WeakMap<vscode.TestItem, vscode.Uri>();

  function getOrCreateWorkspaceFolderTestItem(uri: vscode.Uri) {
    let workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
      return undefined;
    }
    workspaceFolder =
      workspaceTracker.getOuterMostWorkspaceFolder(workspaceFolder);

    const existing = controller.items.get(workspaceFolder.uri.toString());
    if (existing) {
      return existing;
    }

    const workspaceFolderTestItem = controller.createTestItem(
      workspaceFolder.uri.toString(),
      workspaceFolder.name,
      workspaceFolder.uri,
    );
    workspaceFolderTestItem.canResolveChildren = true;
    workspaceFolderTestItem.range = new vscode.Range(0, 0, 0, 0);
    controller.items.add(workspaceFolderTestItem);
    testData.set(workspaceFolderTestItem, ItemType.WorkspaceFolder);
    return workspaceFolderTestItem;
  }

  // In this function, we'll get the file TestItem if we've already found it,
  // otherwise we'll create it with `canResolveChildren = true` to indicate it
  // can be passed to the `controller.resolveHandler` to gets its children.
  function getOrCreateFile(uri: vscode.Uri, projectDir: string) {
    const existing = controller.items.get(uri.toString());
    if (existing) {
      return existing;
    }

    const relativePath = uri.fsPath.slice(projectDir.length);
    const fileTestItem = controller.createTestItem(
      uri.toString(),
      relativePath,
      uri,
    );
    fileTestItem.canResolveChildren = true;
    fileTestItem.range = new vscode.Range(0, 0, 0, 0);

    const workspaceFolderTestItem = getOrCreateWorkspaceFolderTestItem(uri);
    if (!workspaceFolderTestItem) {
      return undefined;
    }
    workspaceFolderTestItem.children.add(fileTestItem);

    testData.set(fileTestItem, ItemType.File);
    return fileTestItem;
  }

  function filterTestFile(uri: vscode.Uri, projectDir: string) {
    if (uri.scheme !== "file") {
      // filter out untitled and other non file
      return false;
    }

    if (!uri.path.endsWith("_test.exs")) {
      // filter out non test
      return false;
    }

    const relativePath = uri.fsPath.slice(projectDir.length);
    const pathSegments = relativePath.split("/");
    const firstSegment = pathSegments[1];
    if (firstSegment === "_build" || firstSegment === "deps") {
      // filter out test files in deps and _build dirs
      return false;
    }

    if (
      pathSegments.find(
        (segment) => segment === "node_modules" || segment.startsWith("."),
      )
    ) {
      // exclude phoenix tests in node_modules
      return false;
    }

    return true;
  }

  function parseTestsInDocument(e: vscode.TextDocument) {
    const projectDir = workspaceTracker.getProjectDirForUri(e.uri);
    if (projectDir && filterTestFile(e.uri, projectDir)) {
      void parseTestsInFileContents(getOrCreateFile(e.uri, projectDir));
    }
  }

  async function parseTestsInFileContents(
    file: vscode.TestItem | undefined,
  ): Promise<void> {
    if (!file) {
      return;
    }
    if (!file.uri?.toString().endsWith(".exs")) {
      return;
    }
    // If a document is open, VS Code already knows its contents. If this is being
    // called from the resolveHandler when a document isn't open, we'll need to
    // read them from disk ourselves.
    const clientPromise = languageClientManager.getClientPromiseByUri(file.uri);

    if (!clientPromise) {
      console.error(
        `ElixirLS: no language client for document ${file.uri?.fsPath}`,
      );
      return;
    }

    const client = await clientPromise;

    if (!client.initializeResult) {
      console.error(
        `ElixirLS: unable to execute command on server ${
          client.name
        } in state ${State[client.state]}`,
      );
      return;
    }

    const command =
      // biome-ignore lint/style/noNonNullAssertion: the command is guaranteed by the language server
      client.initializeResult.capabilities.executeCommandProvider?.commands.find(
        (c) => c.startsWith("getExUnitTestsInFile:"),
      )!;

    console.log("ElixirLS: Finding tests in ", file.uri?.toString());

    const params: ExecuteCommandParams = {
      command: command,
      arguments: [file.uri?.toString()],
    };

    // biome-ignore lint/suspicious/noExplicitAny: response structure is defined by the server
    let res: any[] = [];
    try {
      res = await client.sendRequest(ExecuteCommandRequest.type, params);
    } catch (e) {
      console.error(
        `ElixirLS: unable to get tests in file ${file.uri?.fsPath}: ${e}`,
      );
    }

    for (const moduleEntry of res) {
      const moduleTestItem = controller.createTestItem(
        moduleEntry.module,
        moduleEntry.module,
        file.uri,
      );
      moduleTestItem.range = new vscode.Range(
        moduleEntry.line,
        0,
        moduleEntry.line + 1,
        0,
      );
      testData.set(moduleTestItem, ItemType.Module);
      file.children.add(moduleTestItem);
      for (const describeEntry of moduleEntry.describes) {
        let describeCollection: vscode.TestItemCollection;
        if (describeEntry.describe) {
          const describeTestItem = controller.createTestItem(
            describeEntry.describe,
            describeEntry.describe,
            file.uri,
          );
          describeTestItem.range = new vscode.Range(
            describeEntry.line,
            0,
            describeEntry.line + 1,
            0,
          );
          describeTestItem.description = "describe";
          testData.set(describeTestItem, ItemType.Describe);
          moduleTestItem.children.add(describeTestItem);
          describeCollection = describeTestItem.children;
        } else {
          describeCollection = moduleTestItem.children;
        }
        for (const testEntry of describeEntry.tests.filter(
          (testEntry: { type: string }) => testEntry.type !== "doctest",
        )) {
          const testItem = controller.createTestItem(
            testEntry.name,
            testEntry.name,
            file.uri,
          );
          testItem.range = new vscode.Range(
            testEntry.line,
            0,
            testEntry.line + 1,
            0,
          );
          testItem.description = testEntry.type;
          testItem.tags = testEntry.tags.map(
            (tag: string) => new vscode.TestTag(tag),
          );
          describeCollection.add(testItem);
        }
        const doctests = describeEntry.tests.filter(
          (testEntry: { type: string }) => testEntry.type === "doctest",
        );
        const groupedDoctests = new Map<string, vscode.TestItem>();
        for (const testEntry of doctests) {
          const doctestModule = testEntry.tags
            .find((t: string) => t.startsWith("doctest:"))
            ?.replace("doctest:", "");
          const doctestLine = Number(
            testEntry.tags
              .find((t: string) => t.startsWith("doctest_line:"))
              ?.replace("doctest_line:", ""),
          );
          let doctestGroupItem = groupedDoctests.get(doctestModule);
          if (!doctestGroupItem) {
            doctestGroupItem = controller.createTestItem(
              doctestModule,
              doctestModule,
              file.uri,
            );
            doctestGroupItem.range = new vscode.Range(
              testEntry.line,
              0,
              testEntry.line + 1,
              0,
            );
            doctestGroupItem.description = testEntry.type;
            testData.set(doctestGroupItem, ItemType.Doctest);

            describeCollection.add(doctestGroupItem);
            groupedDoctests.set(doctestModule, doctestGroupItem);
          }

          const testItem = controller.createTestItem(
            testEntry.name,
            testEntry.name,
            vscode.Uri.file(testEntry.doctest_module_path),
          );
          testItem.range = new vscode.Range(doctestLine, 0, doctestLine + 1, 0);
          testItem.description = testEntry.type;
          testItem.tags = testEntry.tags.map(
            (tag: string) => new vscode.TestTag(tag),
          );
          testFileUris.set(testItem, file.uri);

          doctestGroupItem.children.add(testItem);
        }
      }
    }
  }

  async function discoverAllFilesInWorkspace(): Promise<void> {
    if (!vscode.workspace.workspaceFolders) {
      return; // handle the case of no open folders
    }

    const outerMostWorkspaceFolders = [
      ...new Set(
        vscode.workspace.workspaceFolders.map((workspaceFolder) =>
          workspaceTracker.getOuterMostWorkspaceFolder(workspaceFolder),
        ),
      ),
    ];

    await Promise.all(
      outerMostWorkspaceFolders.map(async (workspaceFolder) => {
        const projectDir = getProjectDir(workspaceFolder);
        console.log(
          "ElixirLS: registering watcher in",
          workspaceFolder.name,
          "projectDir",
          projectDir,
        );

        const pattern = new vscode.RelativePattern(projectDir, "**/*_test.exs");
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);

        context.subscriptions.push(watcher);

        // When files are created, make sure there's a corresponding "file" node in the tree
        watcher.onDidCreate((uri) => getOrCreateFile(uri, projectDir));
        // When files change, re-parse them. Note that you could optimize this so
        // that you only re-parse children that have been resolved in the past.
        watcher.onDidChange((uri) =>
          parseTestsInFileContents(getOrCreateFile(uri, projectDir)),
        );
        // And, finally, delete TestItems for removed files. This is simple, since
        // we use the URI as the TestItem's ID.
        watcher.onDidDelete((uri) => controller.items.delete(uri.toString()));

        const files = await vscode.workspace.findFiles(pattern);

        for (const file of files) {
          if (filterTestFile(file, projectDir)) {
            getOrCreateFile(file, projectDir);
          }
        }

        return watcher;
      }),
    );
  }

  function writeOutput(
    run: vscode.TestRun,
    output: string,
    test: vscode.TestItem,
  ) {
    // output is a raw terminal, we need to wrap lines with CRLF
    // note replace("\n", "\r\n") is not working correctly
    for (const line of output.split("\n")) {
      run.appendOutput(line, undefined, test);
      run.appendOutput("\r\n", undefined, test);
    }
  }

  function getTestFromDescribe(
    describeTest: vscode.TestItem,
    name: string,
    type: string,
  ): vscode.TestItem | undefined {
    if (type === "doctest") {
      let foundDoctest: vscode.TestItem | undefined;
      // biome-ignore lint/complexity/noForEach: using forEach allows iterating over the children collection directly
      describeTest.children.forEach((doctestGroupItem) => {
        if (getType(doctestGroupItem) === ItemType.Doctest) {
          const candidate = doctestGroupItem.children.get(name);
          if (candidate) {
            foundDoctest = candidate;
          }
        }
      });
      return foundDoctest;
    }
    return describeTest.children.get(name);
  }

  function getTestFromModule(
    moduleTest: vscode.TestItem,
    describe: string | null,
    name: string,
    type: string,
  ): vscode.TestItem | undefined {
    if (describe) {
      const describeTest = moduleTest.children.get(describe);
      if (describeTest) {
        return getTestFromDescribe(describeTest, name, type);
      }
    } else {
      return getTestFromDescribe(moduleTest, name, type);
    }
  }

  function getTestFromFile(
    fileTest: vscode.TestItem,
    module: string,
    describe: string | null,
    name: string,
    type: string,
  ): vscode.TestItem | undefined {
    const moduleTest = fileTest.children.get(module);
    if (moduleTest) {
      return getTestFromModule(moduleTest, describe, name, type);
    }
  }

  function getTestFromWorkspaceFolder(
    test: vscode.TestItem,
    file: string,
    module: string,
    describe: string | null,
    name: string,
    type: string,
  ): vscode.TestItem | undefined {
    const fileTest = test.children.get(vscode.Uri.file(file).toString());
    if (fileTest) {
      return getTestFromFile(fileTest, module, describe, name, type);
    }
  }

  async function runHandler(
    shouldDebug: boolean,
    request: vscode.TestRunRequest,
    token: vscode.CancellationToken,
  ) {
    const run = controller.createTestRun(request);
    const queue: vscode.TestItem[] = [];

    // Loop through all included tests, or all known tests, and add them to our queue
    if (request.include) {
      // biome-ignore lint/complexity/noForEach: using forEach simplifies queuing requested tests
      request.include.forEach((test) => {
        queue.push(test);
        run.enqueued(test);
      });
    } else {
      // biome-ignore lint/complexity/noForEach: using forEach simplifies queuing all known tests
      controller.items.forEach((test) => {
        queue.push(test);
        run.enqueued(test);
      });
    }

    // For every test that was queued, try to run it. Call run.passed() or run.failed().
    // The `TestMessage` can contain extra information, like a failing location or
    // a diff output. But here we'll just give it a textual message.
    while (queue.length > 0 && !token.isCancellationRequested) {
      const test = queue.pop();

      if (!test || !test.uri) {
        continue;
      }

      // Skip tests the user asked to exclude
      if (request.exclude?.includes(test)) {
        continue;
      }

      const includeChildren = false;
      let runArgs: RunTestArgs;

      const projectDir = workspaceTracker.getProjectDirForUri(test.uri);
      if (!projectDir) {
        continue;
      }
      const relativePath = test.uri?.fsPath.slice(projectDir.length + 1);
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(test.uri);
      if (!workspaceFolder) {
        continue;
      }

      // Note that we don't need to manually
      // set the state of parent tests; they'll be set automatically.
      switch (getType(test)) {
        case ItemType.WorkspaceFolder:
          // If we're running a workspace and any of the files is not parsed yet, parse them now
          {
            const childrenToCheck: Array<Promise<void>> = [];
            // biome-ignore lint/complexity/noForEach: using forEach is convenient for iterating over the children set
            test.children.forEach((fileTest) => {
              if (fileTest.children.size === 0) {
                childrenToCheck.push(parseTestsInFileContents(fileTest));
              }
            });

            await Promise.allSettled(childrenToCheck);
          }

          runArgs = {
            cwd: projectDir,
            workspaceFolder,
            getTest: (
              file: string,
              module: string,
              describe: string | null,
              name: string,
              type: string,
            ) =>
              getTestFromWorkspaceFolder(
                test,
                file,
                module,
                describe,
                name,
                type,
              ),
          };

          break;

        case ItemType.File:
          // If we're running a file and don't know what it contains yet, parse it now
          if (test.children.size === 0) {
            await parseTestsInFileContents(test);
          }

          runArgs = {
            cwd: projectDir,
            filePath: relativePath,
            workspaceFolder,
            getTest: (
              _file: string,
              module: string,
              describe: string | null,
              name: string,
              type: string,
            ) => getTestFromFile(test, module, describe, name, type),
          };

          break;

        case ItemType.Module:
          runArgs = {
            cwd: projectDir,
            filePath: relativePath,
            module: test.id,
            workspaceFolder,
            getTest: (
              _file: string,
              _module: string,
              describe: string | null,
              name: string,
              type: string,
            ) => getTestFromModule(test, describe, name, type),
          };

          break;

        case ItemType.Describe:
          runArgs = {
            cwd: projectDir,
            filePath: relativePath,
            line: (test.range?.start.line ?? 0) + 1,
            workspaceFolder,
            getTest: (
              _file: string,
              _module: string,
              _describe: string | null,
              name: string,
              type: string,
            ) => getTestFromDescribe(test, name, type),
          };

          break;

        case ItemType.Doctest:
          runArgs = {
            cwd: projectDir,
            filePath: relativePath,
            line: (test.range?.start.line ?? 0) + 1,
            workspaceFolder,
            getTest: (
              _file: string,
              _module: string,
              _describe: string | null,
              name: string,
            ) => test.children.get(name),
          };

          break;

        case ItemType.TestCase:
          if (test.description === "doctest") {
            const testFileUri = testFileUris.get(test);
            if (!testFileUri) {
              continue;
            }
            const projectDir =
              workspaceTracker.getProjectDirForUri(testFileUri);
            if (!projectDir) {
              continue;
            }
            const relativePath = testFileUri.fsPath.slice(
              projectDir.length + 1,
            );
            const workspaceFolder =
              vscode.workspace.getWorkspaceFolder(testFileUri);

            if (!workspaceFolder) {
              continue;
            }

            runArgs = {
              cwd: projectDir,
              filePath: relativePath,
              doctestLine:
                Number(
                  test.tags
                    .find((t) => t.id.startsWith("doctest_line:"))
                    ?.id.replace("doctest_line:", ""),
                ) + 1,
              workspaceFolder,
              getTest: (
                _file: string,
                _module: string,
                _describe: string | null,
                name: string,
              ) => {
                if (name === test.id) {
                  return test;
                }
              },
            };
          } else {
            runArgs = {
              cwd: projectDir,
              filePath: relativePath,
              line: (test.range?.start.line ?? 0) + 1,
              workspaceFolder,
              getTest: (
                _file: string,
                _module: string,
                _describe: string | null,
                name: string,
              ) => {
                if (name === test.id) {
                  return test;
                }
              },
            };
          }

          break;
        default:
          throw `unexpected ItemType ${getType(test)}`;
      }

      const start = performance.now();
      try {
        const output = await runTest(run, runArgs, shouldDebug);
        writeOutput(run, output, test);
      } catch (e) {
        writeOutput(run, e as string, test);
        run.errored(
          test,
          new vscode.TestMessage(e as string),
          performance.now() - start,
        );
      }

      if (includeChildren) {
        // biome-ignore lint/complexity/noForEach: forEach makes enqueueing child tests straightforward
        test.children.forEach((test) => {
          queue.push(test);
          run.enqueued(test);
        });
      }
    }

    // Make sure to end the run after all tests have been executed:
    run.end();
  }

  const runProfile = controller.createRunProfile(
    "Run",
    vscode.TestRunProfileKind.Run,
    (request, token) => {
      runHandler(false, request, token);
    },
  );

  context.subscriptions.push(runProfile);

  const debugProfile = controller.createRunProfile(
    "Debug",
    vscode.TestRunProfileKind.Debug,
    (request, token) => {
      runHandler(true, request, token);
    },
  );

  context.subscriptions.push(debugProfile);

  type RunArgs = {
    projectDir: string;
    filePath: string;
    describe?: string;
    testName?: string;
    module: string;
  };

  const testCommand = vscode.commands.registerCommand(
    RUN_TEST_FROM_CODELENS,
    async (args: RunArgs) => {
      const fileTestItemUri = vscode.Uri.file(args.filePath);
      const projectDir = workspaceTracker.getProjectDirForUri(fileTestItemUri);
      if (!projectDir) {
        throw `Unable to find project dir for ${fileTestItemUri}`;
      }
      await parseTestsInFileContents(
        getOrCreateFile(fileTestItemUri, projectDir),
      );
      function getTestItem(
        item: vscode.TestItem,
        ids: (string | undefined)[],
      ): vscode.TestItem {
        if (ids.length === 0) {
          return item;
        }
        const [id, ...rest] = ids;
        if (!id) {
          return getTestItem(item, rest);
        }
        const childItem = item.children.get(id);

        if (childItem) {
          return getTestItem(childItem, rest);
        }
        return item;
      }
      function getFileTestItemRecursive(
        items: vscode.TestItemCollection,
        id: string,
      ): vscode.TestItem | undefined {
        let item = items.get(id);
        if (item) {
          return item;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [childId, child] of items) {
          item = getFileTestItemRecursive(child.children, id);
          if (item) {
            return item;
          }
        }
      }

      const fileTestItem = getFileTestItemRecursive(
        controller.items,
        fileTestItemUri.toString(),
      );
      if (!fileTestItem) {
        console.warn(
          `ElixirLS: Test item ${fileTestItemUri.toString()} not found`,
        );
        return;
      }
      const testItem = getTestItem(fileTestItem, [
        args.module,
        args.describe,
        args.testName,
      ]);
      runHandler(
        false,
        new vscode.TestRunRequest([testItem]),
        new vscode.CancellationTokenSource().token,
      );
      vscode.commands.executeCommand("vscode.revealTestInExplorer", testItem);
    },
  );

  context.subscriptions.push(testCommand);
}
