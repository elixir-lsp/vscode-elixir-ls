"use strict";

import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { configureDebugger } from "./debugAdapter";
import { configureTerminalLinkProvider } from "./terminalLinkProvider";
import { configureTestController } from "./testController";
import { LanguageClientManager } from "./languageClientManager";
import { detectConflictingExtensions } from "./conflictingExtensions";
import { configureCommands } from "./commands";
import { handleDidChangeWorkspaceFolders } from "./project";
import { testElixir } from "./testElixir";

const languageClientManager = new LanguageClientManager();

const workspaceSubscription: vscode.Disposable =
  vscode.workspace.onDidChangeWorkspaceFolders(() =>
    handleDidChangeWorkspaceFolders()
  );

export function activate(context: vscode.ExtensionContext): void {
  console.log(`ElixirLS: activating extension`);
  testElixir();

  detectConflictingExtensions();

  configureCommands(context, languageClientManager);
  configureDebugger(context);
  configureTerminalLinkProvider(context);
  configureTestController(context, languageClientManager);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((value) =>
      languageClientManager.handleDidOpenTextDocument(value, context)
    )
  );

  vscode.workspace.textDocuments.forEach((value) =>
    languageClientManager.handleDidOpenTextDocument(value, context)
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
      for (const folder of event.removed) {
        languageClientManager.handleWorkspaceFolderRemoved(folder);
      }
    })
  );

  context.subscriptions.push(
    vscode.tasks.registerTaskProvider(TaskProvider.TaskType, new TaskProvider())
  );
}

export async function deactivate() {
  workspaceSubscription.dispose();
  await languageClientManager.deactivate();
}
