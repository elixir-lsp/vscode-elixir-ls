import { commands } from 'vscode';
import Commands from '../constants/commands';
import { ITestItem } from '../protocols';

export async function searchTestCodeLens(uri: string): Promise<ITestItem[]> {
  return await executeElixirLanguageServerCommand<ITestItem[]>(
    Commands.SEARCH_TEST_CODE_LENS, uri) || [];
}

async function executeElixirLanguageServerCommand<T>(...rest: any[]): Promise<T | undefined> {
  try {
    // throw new Error("test")
    return await commands.executeCommand<T>(Commands.EXECUTE_WORKSPACE_COMMAND, ...rest);
  } catch (error) {
    console.error(error.toString());
    throw error;
  }
}