import * as vscode from "vscode";
import {
  type ExecuteCommandParams,
  ExecuteCommandRequest,
  type LanguageClient,
} from "vscode-languageclient/node";

interface IParameters {
  modules: string[];
}

export class DocsAggregatorTool
  implements vscode.LanguageModelTool<IParameters>
{
  constructor(private client: LanguageClient) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IParameters>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.PreparedToolInvocation> {
    return {
      invocationMessage: `Getting documentation for: ${options.input.modules.join(", ")}`,
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IParameters>,
    token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const { modules } = options.input;

    try {
      // Find the llmDocsAggregator command from server capabilities
      const command =
        this.client.initializeResult?.capabilities.executeCommandProvider?.commands.find(
          (c) => c.startsWith("llmDocsAggregator:"),
        );

      if (!command) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "ElixirLS language server is not ready or does not support the llmDocsAggregator command",
          ),
        ]);
      }

      const params: ExecuteCommandParams = {
        command: command,
        arguments: [modules],
      };

      const result = await this.client.sendRequest<{
        results?: Array<{
          // Module documentation fields
          module?: string;
          moduledoc?: string;
          functions?: string[];
          macros?: string[];
          types?: string[];
          callbacks?: string[];
          macrocallbacks?: string[];
          behaviours?: string[];

          // Function/callback/type documentation fields
          function?: string;
          callback?: string;
          type?: string;
          arity?: number;
          documentation?: string;

          // Attribute documentation fields
          attribute?: string;

          // Error field
          error?: string;
        }>;
        error?: string;
      }>(ExecuteCommandRequest.method, params, token);

      if (result?.error) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Error getting documentation: ${result.error}`,
          ),
        ]);
      }

      if (result?.results) {
        const parts: vscode.LanguageModelTextPart[] = [];

        for (const item of result.results) {
          if (item.error) {
            const name =
              item.module ||
              item.function ||
              item.callback ||
              item.type ||
              item.attribute ||
              "Unknown";
            parts.push(
              new vscode.LanguageModelTextPart(
                `## ${name}\nError: ${item.error}\n\n`,
              ),
            );
          } else if (item.module && item.moduledoc !== undefined) {
            // Module documentation
            parts.push(
              new vscode.LanguageModelTextPart(`# Module: ${item.module}\n\n`),
            );

            if (item.moduledoc) {
              parts.push(
                new vscode.LanguageModelTextPart(`${item.moduledoc}\n\n`),
              );
            }

            if (item.functions && item.functions.length > 0) {
              parts.push(
                new vscode.LanguageModelTextPart(
                  `## Functions\n${item.functions.join(", ")}\n\n`,
                ),
              );
            }

            if (item.macros && item.macros.length > 0) {
              parts.push(
                new vscode.LanguageModelTextPart(
                  `## Macros\n${item.macros.join(", ")}\n\n`,
                ),
              );
            }

            if (item.types && item.types.length > 0) {
              parts.push(
                new vscode.LanguageModelTextPart(
                  `## Types\n${item.types.join(", ")}\n\n`,
                ),
              );
            }

            if (item.callbacks && item.callbacks.length > 0) {
              parts.push(
                new vscode.LanguageModelTextPart(
                  `## Callbacks\n${item.callbacks.join(", ")}\n\n`,
                ),
              );
            }

            if (item.macrocallbacks && item.macrocallbacks.length > 0) {
              parts.push(
                new vscode.LanguageModelTextPart(
                  `## Macro Callbacks\n${item.macrocallbacks.join(", ")}\n\n`,
                ),
              );
            }

            if (item.behaviours && item.behaviours.length > 0) {
              parts.push(
                new vscode.LanguageModelTextPart(
                  `## Behaviours\n${item.behaviours.join(", ")}\n\n`,
                ),
              );
            }
          } else if (item.function) {
            // Function documentation
            const title =
              item.arity !== undefined
                ? `${item.function}/${item.arity}`
                : item.function;
            parts.push(
              new vscode.LanguageModelTextPart(
                `# Function: ${item.module}.${title}\n\n${item.documentation || "No documentation available"}\n\n`,
              ),
            );
          } else if (item.callback) {
            // Callback documentation
            const title =
              item.arity !== undefined
                ? `${item.callback}/${item.arity}`
                : item.callback;
            parts.push(
              new vscode.LanguageModelTextPart(
                `# Callback: ${item.module}.${title}\n\n${item.documentation || "No documentation available"}\n\n`,
              ),
            );
          } else if (item.type) {
            // Type documentation
            const title =
              item.arity !== undefined
                ? `${item.type}/${item.arity}`
                : item.type;
            parts.push(
              new vscode.LanguageModelTextPart(
                `# Type: ${item.module}.${title}\n\n${item.documentation || "No documentation available"}\n\n`,
              ),
            );
          } else if (item.attribute) {
            // Attribute documentation
            parts.push(
              new vscode.LanguageModelTextPart(
                `# Attribute: ${item.attribute}\n\n${item.documentation || "No documentation available"}\n\n`,
              ),
            );
          }
        }

        return new vscode.LanguageModelToolResult(parts);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `No documentation found for: ${modules.join(", ")}`,
        ),
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to get documentation: ${errorMessage}`,
        ),
      ]);
    }
  }
}
