import * as vscode from "vscode";
import type { LanguageClient } from "vscode-languageclient/node";
import type { LanguageClientManager } from "./languageClientManager";

interface IParameters {
  module: string;
  file?: string;
}

interface ITypeInfo {
  name: string;
  kind: string;
  signature: string;
  spec: string;
  doc?: string;
}

interface ISpecInfo {
  name: string;
  specs: string;
  doc?: string;
}

interface ICallbackInfo {
  name: string;
  specs: string;
  doc?: string;
}

interface IDialyzerContract {
  name: string;
  line: number;
  contract: string;
}

interface ITypeInfoResult {
  module?: string;
  types?: ITypeInfo[];
  specs?: ISpecInfo[];
  callbacks?: ICallbackInfo[];
  dialyzer_contracts?: IDialyzerContract[];
  error?: string;
}

export class TypeInfoTool implements vscode.LanguageModelTool<IParameters> {
  constructor(private clientManager: LanguageClientManager) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IParameters>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.PreparedToolInvocation> {
    return {
      invocationMessage: `Getting type information for: ${options.input.module}`,
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
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const args = options.input;

    if (!args.module) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Error: module parameter is required"),
      ]);
    }

    const client = this.getClient(args.file);
    if (!client) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          "ElixirLS language server is not available. Please open an Elixir file or workspace.",
        ),
      ]);
    }

    try {
      // Find the llmTypeInfo command from server capabilities
      const command =
        client.initializeResult?.capabilities.executeCommandProvider?.commands.find(
          (c) => c.startsWith("llmTypeInfo:"),
        );

      if (!command) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "Error: llmTypeInfo command not found in server capabilities",
          ),
        ]);
      }

      const result = await client.sendRequest<ITypeInfoResult>(
        "workspace/executeCommand",
        {
          command: command,
          arguments: [args.module],
        },
      );

      if (result.error) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(`Error: ${result.error}`),
        ]);
      }

      // Format the type information in a readable way
      const parts: vscode.LanguageModelTextPart[] = [];

      parts.push(
        new vscode.LanguageModelTextPart(
          `# Type Information for ${result.module}\n\n`,
        ),
      );

      if (result.types && result.types.length > 0) {
        parts.push(new vscode.LanguageModelTextPart("## Types\n\n"));
        for (const type of result.types) {
          parts.push(
            new vscode.LanguageModelTextPart(
              `### ${type.name}\nKind: ${type.kind}\nSignature: ${type.signature}\n\`\`\`elixir\n${type.spec}\n\`\`\`\n${type.doc ? `${type.doc}\n` : ""}\n`,
            ),
          );
        }
      }

      if (result.specs && result.specs.length > 0) {
        parts.push(new vscode.LanguageModelTextPart("## Function Specs\n\n"));
        for (const spec of result.specs) {
          parts.push(
            new vscode.LanguageModelTextPart(
              `### ${spec.name}\n\`\`\`elixir\n${spec.specs}\n\`\`\`\n${spec.doc ? `${spec.doc}\n` : ""}\n`,
            ),
          );
        }
      }

      if (result.callbacks && result.callbacks.length > 0) {
        parts.push(new vscode.LanguageModelTextPart("## Callbacks\n\n"));
        for (const callback of result.callbacks) {
          parts.push(
            new vscode.LanguageModelTextPart(
              `### ${callback.name}\n\`\`\`elixir\n${callback.specs}\n\`\`\`\n${callback.doc ? `${callback.doc}\n` : ""}\n`,
            ),
          );
        }
      }

      if (result.dialyzer_contracts && result.dialyzer_contracts.length > 0) {
        parts.push(
          new vscode.LanguageModelTextPart("## Dialyzer Contracts\n\n"),
        );
        for (const contract of result.dialyzer_contracts) {
          parts.push(
            new vscode.LanguageModelTextPart(
              `### ${contract.name} (line ${contract.line})\n` +
                `\`\`\`elixir\n${contract.contract}\n\`\`\`\n\n`,
            ),
          );
        }
      }

      return new vscode.LanguageModelToolResult(parts);
    } catch (error) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Error: ${error}`),
      ]);
    }
  }
}
