import * as vscode from 'vscode';

export const configuration: vscode.LanguageConfiguration = {
  indentationRules: {
    increaseIndentPattern: new RegExp('(after|else|catch|rescue|fn|^.*(do|<\\-|\\->|\\{|\\[))\\s*$'),
    decreaseIndentPattern: new RegExp('^\\s*((\\}|\\])\\s*$|(after|else|catch|rescue|end)\\b)')
  }
};
