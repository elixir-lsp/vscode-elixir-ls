import * as vscode from "vscode";

export const configuration: vscode.LanguageConfiguration = {
  indentationRules: {
    decreaseIndentPattern: new RegExp(
      "^\\s*((\\}|\\])\\s*$|(after|else|catch|rescue|end)\\b)",
    ),
    increaseIndentPattern: new RegExp(
      "(after|else|catch|rescue|fn|^.*(do|<\\-|\\->|\\{|\\[|\\=))\\s*$",
    ),
  },
};
