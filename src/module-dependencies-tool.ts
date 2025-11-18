import * as vscode from "vscode";
import {
  type ExecuteCommandParams,
  ExecuteCommandRequest,
  type LanguageClient,
} from "vscode-languageclient/node";
import type { LanguageClientManager } from "./languageClientManager";

interface IParameters {
  module: string;
  file?: string;
}

interface IModuleDependenciesResult {
  module?: string;
  location?: {
    uri: string;
  };
  direct_dependencies?: {
    imports?: string[];
    aliases?: string[];
    requires?: string[];
    struct_expansions?: string[];
    function_calls?: string[];
    compile_dependencies?: string[];
    runtime_dependencies?: string[];
    exports_dependencies?: string[];
  };
  reverse_dependencies?: {
    imports?: string[];
    aliases?: string[];
    requires?: string[];
    struct_expansions?: string[];
    function_calls?: string[];
    compile_dependencies?: string[];
    runtime_dependencies?: string[];
    exports_dependencies?: string[];
  };
  transitive_dependencies?: string[];
  reverse_transitive_dependencies?: string[];
  error?: string;
}

export class ModuleDependenciesTool
  implements vscode.LanguageModelTool<IParameters>
{
  constructor(private clientManager: LanguageClientManager) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IParameters>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.PreparedToolInvocation> {
    return {
      invocationMessage: `Getting module dependencies for: ${options.input.module}`,
    };
  }

  private getClient(file?: string): LanguageClient | null {
    if (file) {
      try {
        const uri = vscode.Uri.file(file);
        return this.clientManager.getClientByUri(uri);
      } catch (error) {
        console.warn(`ElixirLS: Failed to get client for file ${file}:`, error);
      }
    }

    // Fall back to active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      try {
        return this.clientManager.getClientByUri(activeEditor.document.uri);
      } catch (error) {
        console.warn(
          "ElixirLS: Failed to get client for active editor:",
          error,
        );
      }
    }

    // Fall back to default client
    if (this.clientManager.defaultClient) {
      return this.clientManager.defaultClient;
    }

    // Fall back to first available client
    const clients = this.clientManager.allClients();
    return clients.length > 0 ? clients[0] : null;
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IParameters>,
    token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const { module, file } = options.input;

    const client = this.getClient(file);
    if (!client) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          "ElixirLS language server is not available. Please open an Elixir file or workspace.",
        ),
      ]);
    }

    try {
      // Find the llmModuleDependencies command from server capabilities
      const command =
        client.initializeResult?.capabilities.executeCommandProvider?.commands.find(
          (c) => c.startsWith("llmModuleDependencies:"),
        );

      if (!command) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "ElixirLS language server is not ready or does not support the llmModuleDependencies command",
          ),
        ]);
      }

      const params: ExecuteCommandParams = {
        command: command,
        arguments: [module],
      };

      const result = await client.sendRequest<IModuleDependenciesResult>(
        ExecuteCommandRequest.method,
        params,
        token,
      );

      if (result?.error) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Error getting module dependencies: ${result.error}`,
          ),
        ]);
      }

      if (result) {
        // Format the dependency information for the language model
        const parts: vscode.LanguageModelTextPart[] = [];

        parts.push(
          new vscode.LanguageModelTextPart(
            `# Module Dependencies for ${result.module}\n\n`,
          ),
        );

        if (result.location?.uri) {
          parts.push(
            new vscode.LanguageModelTextPart(
              `**Location**: ${result.location.uri}\n\n`,
            ),
          );
        }

        // Direct dependencies
        if (result.direct_dependencies) {
          parts.push(
            new vscode.LanguageModelTextPart("## Direct Dependencies\n"),
          );

          if (
            result.direct_dependencies.compile_dependencies &&
            result.direct_dependencies.compile_dependencies.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart(
                "### Compile-time Dependencies\n",
              ),
            );
            for (const mod of result.direct_dependencies.compile_dependencies) {
              parts.push(new vscode.LanguageModelTextPart(`- ${mod}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.direct_dependencies.runtime_dependencies &&
            result.direct_dependencies.runtime_dependencies.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart("### Runtime Dependencies\n"),
            );
            for (const mod of result.direct_dependencies.runtime_dependencies) {
              parts.push(new vscode.LanguageModelTextPart(`- ${mod}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.direct_dependencies.exports_dependencies &&
            result.direct_dependencies.exports_dependencies.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart("### Export Dependencies\n"),
            );
            for (const mod of result.direct_dependencies.exports_dependencies) {
              parts.push(new vscode.LanguageModelTextPart(`- ${mod}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.direct_dependencies.imports &&
            result.direct_dependencies.imports.length > 0
          ) {
            parts.push(new vscode.LanguageModelTextPart("### Imports\n"));
            for (const imp of result.direct_dependencies.imports) {
              parts.push(new vscode.LanguageModelTextPart(`- ${imp}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.direct_dependencies.function_calls &&
            result.direct_dependencies.function_calls.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart("### Function Calls\n"),
            );
            for (const call of result.direct_dependencies.function_calls) {
              parts.push(new vscode.LanguageModelTextPart(`- ${call}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.direct_dependencies.aliases &&
            result.direct_dependencies.aliases.length > 0
          ) {
            parts.push(new vscode.LanguageModelTextPart("### Aliases\n"));
            for (const alias of result.direct_dependencies.aliases) {
              parts.push(new vscode.LanguageModelTextPart(`- ${alias}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.direct_dependencies.requires &&
            result.direct_dependencies.requires.length > 0
          ) {
            parts.push(new vscode.LanguageModelTextPart("### Requires\n"));
            for (const req of result.direct_dependencies.requires) {
              parts.push(new vscode.LanguageModelTextPart(`- ${req}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.direct_dependencies.struct_expansions &&
            result.direct_dependencies.struct_expansions.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart("### Struct Expansions\n"),
            );
            for (const struct of result.direct_dependencies.struct_expansions) {
              parts.push(new vscode.LanguageModelTextPart(`- ${struct}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }
        }

        // Reverse dependencies
        if (result.reverse_dependencies) {
          parts.push(
            new vscode.LanguageModelTextPart(
              "## Reverse Dependencies (modules that use this module)\n",
            ),
          );

          if (
            result.reverse_dependencies.compile_dependencies &&
            result.reverse_dependencies.compile_dependencies.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart(
                "### Compile-time Dependencies\n",
              ),
            );
            for (const mod of result.reverse_dependencies
              .compile_dependencies) {
              parts.push(new vscode.LanguageModelTextPart(`- ${mod}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.reverse_dependencies.runtime_dependencies &&
            result.reverse_dependencies.runtime_dependencies.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart("### Runtime Dependencies\n"),
            );
            for (const mod of result.reverse_dependencies
              .runtime_dependencies) {
              parts.push(new vscode.LanguageModelTextPart(`- ${mod}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.reverse_dependencies.exports_dependencies &&
            result.reverse_dependencies.exports_dependencies.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart("### Export Dependencies\n"),
            );
            for (const mod of result.reverse_dependencies
              .exports_dependencies) {
              parts.push(new vscode.LanguageModelTextPart(`- ${mod}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.reverse_dependencies.imports &&
            result.reverse_dependencies.imports.length > 0
          ) {
            parts.push(new vscode.LanguageModelTextPart("### Imports\n"));
            for (const imp of result.reverse_dependencies.imports) {
              parts.push(new vscode.LanguageModelTextPart(`- ${imp}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.reverse_dependencies.function_calls &&
            result.reverse_dependencies.function_calls.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart("### Function Calls\n"),
            );
            for (const call of result.reverse_dependencies.function_calls) {
              parts.push(new vscode.LanguageModelTextPart(`- ${call}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.reverse_dependencies.aliases &&
            result.reverse_dependencies.aliases.length > 0
          ) {
            parts.push(new vscode.LanguageModelTextPart("### Aliases\n"));
            for (const alias of result.reverse_dependencies.aliases) {
              parts.push(new vscode.LanguageModelTextPart(`- ${alias}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.reverse_dependencies.requires &&
            result.reverse_dependencies.requires.length > 0
          ) {
            parts.push(new vscode.LanguageModelTextPart("### Requires\n"));
            for (const req of result.reverse_dependencies.requires) {
              parts.push(new vscode.LanguageModelTextPart(`- ${req}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }

          if (
            result.reverse_dependencies.struct_expansions &&
            result.reverse_dependencies.struct_expansions.length > 0
          ) {
            parts.push(
              new vscode.LanguageModelTextPart("### Struct Expansions\n"),
            );
            for (const struct of result.reverse_dependencies
              .struct_expansions) {
              parts.push(new vscode.LanguageModelTextPart(`- ${struct}\n`));
            }
            parts.push(new vscode.LanguageModelTextPart("\n"));
          }
        }

        // Transitive dependencies
        if (
          result.transitive_dependencies &&
          result.transitive_dependencies.length > 0
        ) {
          parts.push(
            new vscode.LanguageModelTextPart("## Transitive Dependencies\n"),
          );
          const transitiveCount = result.transitive_dependencies.length;
          parts.push(
            new vscode.LanguageModelTextPart(
              `Total: ${transitiveCount} modules\n`,
            ),
          );

          // Show first 20 transitive dependencies
          const toShow = result.transitive_dependencies.slice(0, 20);
          for (const dep of toShow) {
            parts.push(new vscode.LanguageModelTextPart(`- ${dep}\n`));
          }

          if (transitiveCount > 20) {
            parts.push(
              new vscode.LanguageModelTextPart(
                `... and ${transitiveCount - 20} more\n`,
              ),
            );
          }
          parts.push(new vscode.LanguageModelTextPart("\n"));
        }

        // Reverse transitive dependencies
        if (
          result.reverse_transitive_dependencies &&
          result.reverse_transitive_dependencies.length > 0
        ) {
          parts.push(
            new vscode.LanguageModelTextPart(
              "## Reverse Transitive Dependencies (modules that indirectly depend on this module)\n",
            ),
          );
          const reverseTransitiveCount =
            result.reverse_transitive_dependencies.length;
          parts.push(
            new vscode.LanguageModelTextPart(
              `Total: ${reverseTransitiveCount} modules\n`,
            ),
          );

          // Show first 20 reverse transitive dependencies
          const toShow = result.reverse_transitive_dependencies.slice(0, 20);
          for (const dep of toShow) {
            parts.push(new vscode.LanguageModelTextPart(`- ${dep}\n`));
          }

          if (reverseTransitiveCount > 20) {
            parts.push(
              new vscode.LanguageModelTextPart(
                `... and ${reverseTransitiveCount - 20} more\n`,
              ),
            );
          }
        }

        return new vscode.LanguageModelToolResult(parts);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `No dependency information found for module: ${module}`,
        ),
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to get module dependencies: ${errorMessage}`,
        ),
      ]);
    }
  }
}
