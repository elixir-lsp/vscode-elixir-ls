"use strict";

import * as path from "path";
import * as vscode from "vscode";

interface TerminalLinkWithData extends vscode.TerminalLink {
  data: {
    app: string;
    file: string;
    line: number;
  };
}

export function configureTerminalLinkProvider(
  context: vscode.ExtensionContext
) {
  function openUri(uri: vscode.Uri, line: number) {
    vscode.workspace.openTextDocument(uri).then((document) => {
      vscode.window.showTextDocument(document).then((editor) => {
        const position = new vscode.Position(line - 1, 0);
        const selection = new vscode.Selection(position, position);
        editor.revealRange(selection);
        editor.selection = selection;
      });
    });
  }

  const disposable = vscode.window.registerTerminalLinkProvider({
    provideTerminalLinks: (
      context: vscode.TerminalLinkContext,
      _token: vscode.CancellationToken
    ): vscode.ProviderResult<TerminalLinkWithData[]> => {
      const regex =
        /(?:\((?<app>[_a-z]+) \d+.\d+.\d+\) )(?<file>[_a-z/]*[_a-z]+.ex):(?<line>\d+)/;
      const matches = context.line.match(regex);
      if (matches === null) {
        return [];
      }

      return [
        {
          startIndex: matches.index!,
          length: matches[0].length,
          data: {
            app: matches.groups!.app,
            file: matches.groups!.file,
            line: parseInt(matches.groups!.line),
          },
        },
      ];
    },
    handleTerminalLink: ({
      data: { app, file, line },
    }: TerminalLinkWithData): vscode.ProviderResult<void> => {
      const umbrellaFile = path.join("apps", app, file);
      vscode.workspace.findFiles(`{${umbrellaFile},${file}}`).then((uris) => {
        if (uris.length === 1) {
          openUri(uris[0], line);
        } else if (uris.length > 1) {
          const items = uris.map((uri) => ({ label: uri.toString(), uri }));
          vscode.window.showQuickPick(items).then((selection) => {
            if (!selection) {
              return;
            }

            openUri(selection.uri, line);
          });
        }
      });
    },
  });

  context.subscriptions.push(disposable);
}
