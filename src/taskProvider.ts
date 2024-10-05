import * as vscode from "vscode";

export class TaskProvider implements vscode.TaskProvider {
  // Referenced in package.json::taskDefinitions
  static TaskType = "mix";

  public provideTasks(): vscode.Task[] {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || !wsFolders[0]) {
      vscode.window.showErrorMessage("no workspace open...");
      return [];
    }

    // TODO make sure that problem matchers are working
    // TODO better handle multi root workspaces

    const tasks = [];

    const test = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Run tests" },
      wsFolders[0],
      "Run tests",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix test"),
      ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"],
    );

    test.group = vscode.TaskGroup.Test;

    tasks.push(test);

    const testCoverage = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Run tests with coverage" },
      wsFolders[0],
      "Run tests with coverage",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix test.coverage"),
      ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"],
    );

    testCoverage.group = vscode.TaskGroup.Test;

    tasks.push(testCoverage);

    const testUnderCursorTask = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Run test at cursor" },
      wsFolders[0],
      "Run test at cursor",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix test ${relativeFile}:${lineNumber}"),
      ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"],
    );

    testUnderCursorTask.group = vscode.TaskGroup.Test;

    tasks.push(testUnderCursorTask);

    const testsInFileTask = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Run tests in current file" },
      wsFolders[0],
      "Run tests in current file",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix test ${relativeFile}"),
      ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"],
    );

    testsInFileTask.group = vscode.TaskGroup.Test;

    tasks.push(testsInFileTask);

    const compile = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Build" },
      wsFolders[0],
      "Build",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix compile"),
      ["$mixCompileError", "$mixCompileWarning"],
    );

    compile.group = vscode.TaskGroup.Build;

    tasks.push(compile);

    const depsCompile = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Build dependencies" },
      wsFolders[0],
      "Build dependencies",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix deps.compile"),
      ["$mixCompileError", "$mixCompileWarning"],
    );

    depsCompile.group = vscode.TaskGroup.Build;

    tasks.push(depsCompile);

    const clean = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Clean project" },
      wsFolders[0],
      "Clean project",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix clean"),
    );

    clean.group = vscode.TaskGroup.Clean;

    tasks.push(clean);

    const cleanWithDeps = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Clean project and deps" },
      wsFolders[0],
      "Clean project and deps",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix clean --deps"),
    );

    cleanWithDeps.group = vscode.TaskGroup.Clean;

    tasks.push(cleanWithDeps);

    const appTree = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Print app tree" },
      wsFolders[0],
      "Print app tree",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix app.tree"),
    );

    tasks.push(appTree);

    const deps = new vscode.Task(
      { type: TaskProvider.TaskType, task: "List deps" },
      wsFolders[0],
      "List deps",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix deps"),
    );

    tasks.push(deps);

    const depsCleanAll = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Clean all deps" },
      wsFolders[0],
      "Clean all deps",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix deps.clean --all"),
    );

    depsCleanAll.group = vscode.TaskGroup.Clean;

    tasks.push(depsCleanAll);

    const depsCleanUnused = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Clean all unused deps" },
      wsFolders[0],
      "Clean all unused deps",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix deps.clean --unlock --unused"),
    );

    depsCleanUnused.group = vscode.TaskGroup.Clean;

    tasks.push(depsCleanUnused);

    const depsGet = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Get deps" },
      wsFolders[0],
      "Get deps",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix deps.get"),
    );

    tasks.push(depsGet);

    const depsUpdateAll = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Update all deps" },
      wsFolders[0],
      "Update all deps",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix deps.update --all"),
    );

    tasks.push(depsUpdateAll);

    const format = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Format" },
      wsFolders[0],
      "Format",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix format"),
    );

    tasks.push(format);

    const run = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Run" },
      wsFolders[0],
      "Run",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix run"),
    );

    tasks.push(run);

    const runNoHalt = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Run no halt" },
      wsFolders[0],
      "Run no halt",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix run --no-halt"),
    );

    tasks.push(runNoHalt);

    const releaseInit = new vscode.Task(
      {
        type: TaskProvider.TaskType,
        task: "Generates sample files for releases",
      },
      wsFolders[0],
      "Generates sample files for releases",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix release.init"),
    );

    tasks.push(releaseInit);

    const xrefTraceFile = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Trace file dependencies" },
      wsFolders[0],
      "Trace file dependencies",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix xref trace ${relativeFile}"),
    );

    tasks.push(xrefTraceFile);

    const xrefGraph = new vscode.Task(
      { type: TaskProvider.TaskType, task: "Print file dependency graph" },
      wsFolders[0],
      "Print file dependency graph",
      TaskProvider.TaskType,
      new vscode.ShellExecution("mix xref graph"),
    );

    tasks.push(xrefGraph);

    return tasks;
  }

  public resolveTask(_task: vscode.Task): vscode.Task | undefined {
    // This method can be implemented to improve performance.
    // See: https://code.visualstudio.com/api/extension-guides/task-provider
    return undefined;
  }
}
