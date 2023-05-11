"use strict";

import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { configureDebugger } from "./debugAdapter";
import { configureTerminalLinkProvider } from "./terminalLinkProvider";
import { configureTestController } from "./testController";
import { LanguageClientManager } from "./languageClientManager";
import { detectConflictingExtensions } from "./conflictingExtensions";
import { configureCommands } from "./commands";
import { WorkspaceTracker } from "./project";
import { testElixir } from "./testElixir";

console.log("ElixirLS: Loading extension");

export const workspaceTracker = new WorkspaceTracker();
export const languageClientManager = new LanguageClientManager(
  workspaceTracker
);

const startClientsForOpenDocumnts = (context: vscode.ExtensionContext) => {
  vscode.workspace.textDocuments.forEach((value) => {
    languageClientManager.handleDidOpenTextDocument(value, context);
  });
};

export function activate(context: vscode.ExtensionContext): void {
  console.log(`ElixirLS: activating extension in mode`, workspaceTracker.mode);
  console.log(
    "ElixirLS: Workspace folders are",
    vscode.workspace.workspaceFolders
  );
  console.log(
    "ElixirLS: Workspace is",
    vscode.workspace.workspaceFile?.toString()
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      console.info(
        "ElixirLS: Workspace folders changed",
        vscode.workspace.workspaceFolders
      );
      workspaceTracker.handleDidChangeWorkspaceFolders();
    })
  );

  testElixir();

  detectConflictingExtensions();

  configureCommands(context, languageClientManager);
  configureDebugger(context);
  configureTerminalLinkProvider(context);
  configureTestController(context, languageClientManager, workspaceTracker);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((value) => {
      languageClientManager.handleDidOpenTextDocument(value, context);
    })
  );

  startClientsForOpenDocumnts(context);

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
      for (const folder of event.removed) {
        await languageClientManager.handleWorkspaceFolderRemoved(folder);
      }
      // we might have closed client for some nested workspace folder child
      // reopen all needed
      startClientsForOpenDocumnts(context);
    })
  );

  context.subscriptions.push(
    vscode.tasks.registerTaskProvider(TaskProvider.TaskType, new TaskProvider())
  );

  console.log(`ElixirLS: extension activated`);
}

export async function deactivate() {
  console.log(`ElixirLS: deactivating extension`);
  workspaceTracker.handleDidChangeWorkspaceFolders();
  await languageClientManager.deactivate();
  console.log(`ElixirLS: extension deactivated`);
}
