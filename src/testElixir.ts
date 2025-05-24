import { execSync } from "node:child_process";
import * as vscode from "vscode";
import { buildCommand } from "./executable";

function testElixirCommand(command: string): false | Buffer {
  try {
    return execSync(`${command} -e " "`);
  } catch {
    return false;
  }
}

export function testElixir(context: vscode.ExtensionContext): boolean {
  // Use the same script infrastructure as the language server to ensure
  // consistent environment setup (version managers, etc.)
  const checkCommand = buildCommand(context, "elixir_check", undefined);
  const testResult = testElixirCommand(`"${checkCommand}"`);

  if (!testResult) {
    vscode.window.showErrorMessage(
      "Failed to run elixir check command. ElixirLS will probably fail to launch. Logged PATH to Development Console.",
    );
    console.warn(
      `Failed to run elixir check command. Current process's PATH: ${process.env.PATH}`,
    );
    return false;
  }
  if (testResult.length > 0) {
    vscode.window.showErrorMessage(
      "Running elixir check command caused extraneous print to stdout. See VS Code's developer console for details.",
    );
    console.warn(
      `Running elixir check command printed to stdout:\n${testResult.toString()}`,
    );
    return false;
  }
  return true;
}
