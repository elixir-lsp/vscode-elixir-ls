import * as vscode from 'vscode';

export class TaskProvider implements vscode.TaskProvider {
    // Referenced in package.json::taskDefinitions
    static TaskType = 'ElixirLS';

    public provideTasks(): vscode.Task[] {
        const wsFolders = vscode.workspace.workspaceFolders;
        if (!wsFolders || !wsFolders[0]) {
            vscode.window.showErrorMessage("no workspace open...");
            return [];
        }

        const kind: vscode.TaskDefinition = { type: TaskProvider.TaskType }

        const testUnderCursorTask = new vscode.Task(
            kind,
            wsFolders[0],
            'Run test at cursor',
            TaskProvider.TaskType,
            new vscode.ShellExecution("mix test ${relativeFile}:${lineNumber}"),
            ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"]
        );

        testUnderCursorTask.group = vscode.TaskGroup.Test;

        const testsInFileTask = new vscode.Task(
            kind,
            wsFolders[0],
            'Run tests in current file',
            TaskProvider.TaskType,
            new vscode.ShellExecution("mix test ${relativeFile}"),
            ["$mixCompileError", "$mixCompileWarning", "$mixTestFailure"]
        );

        testsInFileTask.group = vscode.TaskGroup.Test;

        return [testUnderCursorTask, testsInFileTask];
    }

    public resolveTask(_task: vscode.Task): vscode.Task | undefined {
        // This method can be implemented to improve performance.
        // See: https://code.visualstudio.com/api/extension-guides/task-provider
        return undefined;
    }
}