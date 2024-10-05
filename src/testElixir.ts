import { execSync } from "node:child_process";
import * as vscode from "vscode";

function testElixirCommand(command: string): false | Buffer {
  try {
    return execSync(`${command} -e " "`);
  } catch {
    return false;
  }
}

export function testElixir(): boolean {
  const testResult = testElixirCommand("elixir");

  if (!testResult) {
    vscode.window.showErrorMessage(
      "Failed to run 'elixir' command. ElixirLS will probably fail to launch. Logged PATH to Development Console.",
    );
    console.warn(
      `Failed to run 'elixir' command. Current process's PATH: ${process.env.PATH}`,
    );
    return false;
  }
  if (testResult.length > 0) {
    vscode.window.showErrorMessage(
      "Running 'elixir' command caused extraneous print to stdout. See VS Code's developer console for details.",
    );
    console.warn(
      `Running 'elixir -e \"\"' printed to stdout:\n${testResult.toString()}`,
    );
    return false;
  }
  return true;
}
