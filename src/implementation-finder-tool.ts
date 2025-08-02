import * as vscode from "vscode";
import {
  type ExecuteCommandParams,
  ExecuteCommandRequest,
  type LanguageClient,
} from "vscode-languageclient/node";

interface IParameters {
  symbol: string;
}

interface IImplementationResult {
  module: string;
  file: string;
  line: number;
  column: number;
  type: string;
  source: string;
}

export class ImplementationFinderTool
  implements vscode.LanguageModelTool<IParameters>
{
  constructor(private client: LanguageClient) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IParameters>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.PreparedToolInvocation> {
    return {
      invocationMessage: `Finding implementations for: ${options.input.symbol}`,
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IParameters>,
    token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const { symbol } = options.input;

    try {
      // Find the llmImplementationFinder command from server capabilities
      const command =
        this.client.initializeResult?.capabilities.executeCommandProvider?.commands.find(
          (c) => c.startsWith("llmImplementationFinder:"),
        );

      if (!command) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "ElixirLS language server is not ready or does not support the llmImplementationFinder command",
          ),
        ]);
      }

      const params: ExecuteCommandParams = {
        command: command,
        arguments: [symbol],
      };

      const result = await this.client.sendRequest<{
        implementations?: IImplementationResult[];
        error?: string;
      }>(ExecuteCommandRequest.method, params, token);

      if (result?.error) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Error finding implementations: ${result.error}`,
          ),
        ]);
      }

      if (result?.implementations && result.implementations.length > 0) {
        const parts: vscode.LanguageModelTextPart[] = [];

        parts.push(
          new vscode.LanguageModelTextPart(
            `# Implementations of ${symbol}\n\n`,
          ),
        );

        parts.push(
          new vscode.LanguageModelTextPart(
            `Found ${result.implementations.length} implementation${result.implementations.length === 1 ? "" : "s"}:\n\n`,
          ),
        );

        result.implementations.forEach((impl, index) => {
          if (index > 0) {
            parts.push(new vscode.LanguageModelTextPart("\n---\n\n"));
          }

          parts.push(new vscode.LanguageModelTextPart(`## ${impl.module}\n\n`));

          parts.push(
            new vscode.LanguageModelTextPart(`**Type**: ${impl.type}\n`),
          );

          parts.push(
            new vscode.LanguageModelTextPart(
              `**Location**: ${impl.file}:${impl.line}:${impl.column}\n\n`,
            ),
          );

          parts.push(
            new vscode.LanguageModelTextPart(
              `\`\`\`elixir\n${impl.source}\n\`\`\`\n`,
            ),
          );
        });

        return new vscode.LanguageModelToolResult(parts);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `No implementations found for: ${symbol}`,
        ),
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to find implementations: ${errorMessage}`,
        ),
      ]);
    }
  }
}
