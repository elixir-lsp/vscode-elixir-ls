import * as vscode from "vscode";
import {
  ExecuteCommandParams,
  ExecuteCommandRequest,
  LanguageClient,
} from "vscode-languageclient/node";

interface IParameters {
  symbol: string;
}

interface IDefinitionResult {
  definition?: string;
  error?: string;
}

export class DefinitionTool implements vscode.LanguageModelTool<IParameters> {
  constructor(private client: LanguageClient) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.PreparedToolInvocation> {
    return {
      invocationMessage: `Looking up definition for: ${options.input.symbol}`,
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IParameters>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const { symbol } = options.input;

    try {
      // Find the llmDefinition command from server capabilities
      const command = this.client.initializeResult?.capabilities
        .executeCommandProvider?.commands.find((c) =>
          c.startsWith("llmDefinition:")
        );

      if (!command) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "ElixirLS language server is not ready or does not support the llmDefinition command"
          ),
        ]);
      }

      const params: ExecuteCommandParams = {
        command: command,
        arguments: [symbol],
      };

      const result = await this.client.sendRequest<IDefinitionResult>(
        ExecuteCommandRequest.method,
        params,
        token
      );

      if (result?.error) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Error finding definition: ${result.error}`
          ),
        ]);
      }

      if (result?.definition) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(result.definition),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `No definition found for symbol: ${symbol}`
        ),
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to look up definition: ${errorMessage}`
        ),
      ]);
    }
  }
}