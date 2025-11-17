import * as path from "node:path";
import * as vscode from "vscode";

interface TerminalLinkWithData extends vscode.TerminalLink {
  data: {
    app: string;
    file: string;
    line: number;
  };
}

export function configureTerminalLinkProvider(
  context: vscode.ExtensionContext,
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
      _token: vscode.CancellationToken,
    ): vscode.ProviderResult<TerminalLinkWithData[]> => {
      const regex =
        /(?:\((?<app>[_a-z0-9]+) \d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\) )(?<file>[_a-z0-9/]*[_a-z0-9]+\.ex):(?<line>\d+)/;
      const matches = context.line.match(regex);
      if (matches === null) {
        return [];
      }

      return [
        {
          // biome-ignore lint/style/noNonNullAssertion: matches is defined because we return early when the regex does not match
          startIndex: matches.index!,
          length: matches[0].length,
          data: {
            app: matches.groups?.app ?? "",
            file: matches.groups?.file ?? "",
            line: Number.parseInt(matches.groups?.line ?? "1", 10),
          },
        },
      ];
    },
    handleTerminalLink: async ({
      data: { app, file, line },
    }: TerminalLinkWithData) => {
      if (path.isAbsolute(file)) {
        const absUri = vscode.Uri.file(file);
        const meta = await vscode.workspace.fs.stat(absUri);
        if (
          meta?.type &
          (vscode.FileType.File | vscode.FileType.SymbolicLink)
        ) {
          openUri(absUri, line);
        }
      } else {
        const umbrellaFile = path.join("apps", app, file);
        const depsFile = path.join("deps", app, file);
        const uris = await vscode.workspace.findFiles(
          `{${umbrellaFile},${file},${depsFile}}`,
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
      }
    },
  });

  context.subscriptions.push(disposable);
}
