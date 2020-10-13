import { window } from "vscode";

export default function runFromCodeLens(test_filter: string): void {
  const elixirLsTerminal =
    window.terminals.find(terminal => terminal.name == "ElixirLS") || window.createTerminal("ElixirLS");

  elixirLsTerminal.show()
  elixirLsTerminal.sendText(`mix test ${test_filter}`);
}