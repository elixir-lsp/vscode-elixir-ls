import { window } from "vscode";

type RunArgs = {
  projectDir: string;
  filePath: string;
  describe: string | null;
  testName?: string;
  module?: string;
};

export default async function runFromCodeLens(args: RunArgs): Promise<void> {
  const { activeTextEditor, terminals, createTerminal } = window;

  if (!activeTextEditor) {
    return;
  }

  if (activeTextEditor.document.isDirty) {
    const saved = await activeTextEditor.document.save();

    if (!saved) {
      return;
    }
  }

  const elixirLsTerminal =
    terminals.find((terminal) => terminal.name == "ElixirLS") ||
    createTerminal("ElixirLS");

  elixirLsTerminal.show();
  elixirLsTerminal.sendText("clear");
  elixirLsTerminal.sendText(`cd ${args.projectDir}`);
  elixirLsTerminal.sendText(buildTestCommand(args));
}

function escapeSingleQuotes(s: string): string {
  return isWindows() ? s : s.replace(/'/g, "'\\''");
}

function quote(s: string): string {
  const q = isWindows() ? '"' : `'`;
  return [q, s, q].join("");
}

function isWindows(): boolean {
  return process.platform.includes("win32");
}

function buildTestCommand(args: RunArgs): string {
  const testFilter = buildTestInclude(
    args.describe,
    args.testName,
    args.module
  );

  return `mix test --exclude test --include ${quote(
    escapeSingleQuotes(testFilter)
  )} ${args.filePath}`;
}

function buildTestInclude(
  describe: string | null,
  testName?: string,
  module?: string
) {
  if (module) {
    return `module:${module}`;
  }

  if (!testName) {
    return `describe:${describe}`;
  }

  if (describe) {
    return `test:test ${describe} ${testName}`;
  }

  return `test:test ${testName}`;
}
