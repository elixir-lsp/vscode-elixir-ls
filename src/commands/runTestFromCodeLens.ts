import { window } from "vscode";

type RunArgs = {
  projectDir: string;
  filePath: string;
  describe: string | null;
  testName?: string;
  module?: string;
};

export default function runFromCodeLens(args: RunArgs): void {
  const elixirLsTerminal =
    window.terminals.find((terminal) => terminal.name == "ElixirLS") ||
    window.createTerminal("ElixirLS");

  elixirLsTerminal.show();
  elixirLsTerminal.sendText("clear");
  elixirLsTerminal.sendText(`cd ${args.projectDir}`);
  elixirLsTerminal.sendText(buildTestCommand(args));
}

function buildTestCommand(args: RunArgs): string {
  const testFilter = buildTestInclude(
    args.describe,
    args.testName,
    args.module
  );

  return `mix test --exclude test --include "${testFilter}" ${args.filePath}`;
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
