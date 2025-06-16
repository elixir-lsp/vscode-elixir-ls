import * as vscode from "vscode";
import { getProjectDir } from "./project";

export class TaskProvider implements vscode.TaskProvider {
  // Referenced in package.json::taskDefinitions
  static TaskType = "mix";

  public provideTasks(): vscode.Task[] {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      vscode.window.showErrorMessage("no workspace open...");
      return [];
    }

    // TODO make sure that problem matchers are working
    // TODO better handle multi root workspaces

    const tasks = [];

    const taskSpecs = [
      {
        name: "Run tests",
        command: "mix test",
        group: vscode.TaskGroup.Test,
        matchers: ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"],
      },
      {
        name: "Run tests with coverage",
        command: "mix test.coverage",
        group: vscode.TaskGroup.Test,
        matchers: ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"],
      },
      {
        name: "Run test at cursor",
        command: "mix test ${relativeFile}:${lineNumber}",
        group: vscode.TaskGroup.Test,
        matchers: ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"],
      },
      {
        name: "Run tests in current file",
        command: "mix test ${relativeFile}",
        group: vscode.TaskGroup.Test,
        matchers: ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"],
      },
      {
        name: "Build",
        command: "mix compile",
        group: vscode.TaskGroup.Build,
        matchers: ["$mixCompileError", "$mixCompileWarning"],
      },
      {
        name: "Build dependencies",
        command: "mix deps.compile",
        group: vscode.TaskGroup.Build,
        matchers: ["$mixCompileError", "$mixCompileWarning"],
      },
      {
        name: "Clean project",
        command: "mix clean",
        group: vscode.TaskGroup.Clean,
      },
      {
        name: "Clean project and deps",
        command: "mix clean --deps",
        group: vscode.TaskGroup.Clean,
      },
      {
        name: "Print app tree",
        command: "mix app.tree",
      },
      {
        name: "List deps",
        command: "mix deps",
      },
      {
        name: "Clean all deps",
        command: "mix deps.clean --all",
        group: vscode.TaskGroup.Clean,
      },
      {
        name: "Clean all unused deps",
        command: "mix deps.clean --unlock --unused",
        group: vscode.TaskGroup.Clean,
      },
      {
        name: "Get deps",
        command: "mix deps.get",
      },
      {
        name: "Update all deps",
        command: "mix deps.update --all",
      },
      {
        name: "Format",
        command: "mix format",
      },
      {
        name: "Run",
        command: "mix run",
      },
      {
        name: "Run no halt",
        command: "mix run --no-halt",
      },
      {
        name: "Generates sample files for releases",
        command: "mix release.init",
      },
      {
        name: "Trace file dependencies",
        command: "mix xref trace ${relativeFile}",
      },
      {
        name: "Print file dependency graph",
        command: "mix xref graph",
      },
    ];

    for (const folder of wsFolders) {
      const projectDir = getProjectDir(folder);

      for (const spec of taskSpecs) {
        const task = new vscode.Task(
          { type: TaskProvider.TaskType, task: spec.name },
          folder,
          spec.name,
          TaskProvider.TaskType,
          new vscode.ShellExecution(spec.command, { cwd: projectDir }),
          spec.matchers,
        );

        if (spec.group) {
          task.group = spec.group;
        }

        tasks.push(task);
      }
    }

    return tasks;
  }

  public resolveTask(_task: vscode.Task): vscode.Task | undefined {
    // This method can be implemented to improve performance.
    // See: https://code.visualstudio.com/api/extension-guides/task-provider
    return undefined;
  }
}
