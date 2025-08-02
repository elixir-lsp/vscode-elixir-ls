import * as vscode from "vscode";
import {
  ExecuteCommandParams,
  ExecuteCommandRequest,
  LanguageClient,
} from "vscode-languageclient/node";

interface IParameters {
  location: string;
}

interface IEnvironmentResult {
  location?: {
    uri: string;
    line: number;
    column: number;
  };
  context?: {
    module: string | null;
    function: string | null;
    context_type: string;
  };
  aliases?: Array<{
    alias: string;
    module: string;
  }>;
  imports?: Array<{
    module: string;
    function: string;
  }>;
  requires?: string[];
  variables?: Array<{
    name: string;
    type: any;
    version: number;
  }>;
  attributes?: Array<{
    name: string;
    type: any;
  }>;
  behaviours_implemented?: string[];
  definitions?: {
    modules_defined: string[];
    types_defined: string[];
    functions_defined: string[];
    callbacks_defined: string[];
  };
  error?: string;
}

export class EnvironmentTool implements vscode.LanguageModelTool<IParameters> {
  constructor(private client: LanguageClient) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.PreparedToolInvocation> {
    return {
      invocationMessage: `Getting environment information at: ${options.input.location}`,
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IParameters>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const { location } = options.input;

    try {
      // Find the llmEnvironment command from server capabilities
      const command = this.client.initializeResult?.capabilities
        .executeCommandProvider?.commands.find((c) =>
          c.startsWith("llmEnvironment:")
        );

      if (!command) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "ElixirLS language server is not ready or does not support the llmEnvironment command"
          ),
        ]);
      }

      const params: ExecuteCommandParams = {
        command: command,
        arguments: [location],
      };

      const result = await this.client.sendRequest<IEnvironmentResult>(
        ExecuteCommandRequest.method,
        params,
        token
      );

      if (result?.error) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Error getting environment: ${result.error}`
          ),
        ]);
      }

      if (result) {
        // Format the environment information for the language model
        const parts: vscode.LanguageModelTextPart[] = [];
        
        if (result.location) {
          parts.push(
            new vscode.LanguageModelTextPart(
              `# Environment at ${result.location.uri}:${result.location.line}:${result.location.column}\n\n`
            )
          );
        }

        if (result.context) {
          parts.push(
            new vscode.LanguageModelTextPart("## Context\n")
          );
          if (result.context.module) {
            parts.push(
              new vscode.LanguageModelTextPart(`- Module: ${result.context.module}\n`)
            );
          }
          if (result.context.function) {
            parts.push(
              new vscode.LanguageModelTextPart(`- Function: ${result.context.function}\n`)
            );
          }
          parts.push(
            new vscode.LanguageModelTextPart(`- Context type: ${result.context.context_type}\n\n`)
          );
        }

        if (result.aliases && result.aliases.length > 0) {
          parts.push(
            new vscode.LanguageModelTextPart("## Aliases\n")
          );
          result.aliases.forEach(alias => {
            parts.push(
              new vscode.LanguageModelTextPart(`- ${alias.alias} → ${alias.module}\n`)
            );
          });
          parts.push(new vscode.LanguageModelTextPart("\n"));
        }

        if (result.imports && result.imports.length > 0) {
          parts.push(
            new vscode.LanguageModelTextPart("## Imports\n")
          );
          result.imports.forEach(imp => {
            parts.push(
              new vscode.LanguageModelTextPart(`- ${imp.module}.${imp.function}\n`)
            );
          });
          parts.push(new vscode.LanguageModelTextPart("\n"));
        }

        if (result.variables && result.variables.length > 0) {
          parts.push(
            new vscode.LanguageModelTextPart("## Variables in scope\n")
          );
          result.variables.forEach(v => {
            parts.push(
              new vscode.LanguageModelTextPart(`- ${v.name}\n`)
            );
          });
          parts.push(new vscode.LanguageModelTextPart("\n"));
        }

        if (result.attributes && result.attributes.length > 0) {
          parts.push(
            new vscode.LanguageModelTextPart("## Module attributes\n")
          );
          result.attributes.forEach(attr => {
            const typeStr = attr.type ? JSON.stringify(attr.type) : "any";
            parts.push(
              new vscode.LanguageModelTextPart(`- @${attr.name}: ${typeStr}\n`)
            );
          });
          parts.push(new vscode.LanguageModelTextPart("\n"));
        }

        if (result.behaviours_implemented && result.behaviours_implemented.length > 0) {
          parts.push(
            new vscode.LanguageModelTextPart("## Behaviours implemented\n")
          );
          result.behaviours_implemented.forEach(b => {
            parts.push(
              new vscode.LanguageModelTextPart(`- ${b}\n`)
            );
          });
        }

        if (result.definitions) {
          parts.push(
            new vscode.LanguageModelTextPart("## Definitions\n")
          );
          if (result.definitions.modules_defined.length > 0) {
            parts.push(
              new vscode.LanguageModelTextPart(`- Modules defined: ${result.definitions.modules_defined.join(", ")}\n`)
            );
          }
          if (result.definitions.types_defined.length > 0) {
            parts.push(
              new vscode.LanguageModelTextPart(`- Types defined: ${result.definitions.types_defined.join(", ")}\n`)
            );
          }
          if (result.definitions.functions_defined.length > 0) {
            parts.push(
              new vscode.LanguageModelTextPart(`- Functions defined: ${result.definitions.functions_defined.join(", ")}\n`)
            );
          }
          if (result.definitions.callbacks_defined.length > 0) {
            parts.push(
              new vscode.LanguageModelTextPart(`- Callbacks defined: ${result.definitions.callbacks_defined.join(", ")}\n`)
            );
          }
        }

        return new vscode.LanguageModelToolResult(parts);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `No environment information found for location: ${location}`
        ),
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to get environment: ${errorMessage}`
        ),
      ]);
    }
  }
}
