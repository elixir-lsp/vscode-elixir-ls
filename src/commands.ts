"use strict";

import * as vscode from "vscode";
import { configureCopyDebugInfo } from "./commands/copyDebugInfo";
import { configureExpandMacro } from "./commands/expandMacro";
import { configureRestart } from "./commands/restart";
import { configureMixClean } from "./commands/mixClean";
import { configureManipulatePipes } from "./commands/manipulatePipes";
import { LanguageClientManager } from "./languageClientManager";

export function configureCommands(
  context: vscode.ExtensionContext,
  languageClientManager: LanguageClientManager
) {
  configureCopyDebugInfo(context);
  configureExpandMacro(context, languageClientManager);
  configureRestart(context, languageClientManager);
  configureMixClean(context, languageClientManager, false);
  configureMixClean(context, languageClientManager, true);
  configureManipulatePipes(context, languageClientManager, "fromPipe");
  configureManipulatePipes(context, languageClientManager, "toPipe");
}
