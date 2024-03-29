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
  async function openUri(uri: vscode.Uri, line: number) {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);
    const position = new vscode.Position(line - 1, 0);
    const selection = new vscode.Selection(position, position);
    editor.revealRange(selection);
    editor.selection = selection;
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
    handleTerminalLink: async ({
      data: { app, file, line },
    }: TerminalLinkWithData) => {
      const umbrellaFile = path.join("apps", app, file);
      const uris = await vscode.workspace.findFiles(
        `{${umbrellaFile},${file}}`
      );
      if (uris.length === 1) {
        openUri(uris[0], line);
      } else if (uris.length > 1) {
        const items = uris.map((uri) => ({ label: uri.toString(), uri }));
        const selection = await vscode.window.showQuickPick(items);
        if (!selection) {
          return;
        }

        await openUri(selection.uri, line);
      }
    },
  });

  context.subscriptions.push(disposable);
}
