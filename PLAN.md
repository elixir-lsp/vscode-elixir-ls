# LLM-Friendly LSP Definition Tool Implementation Plan

## Overview
Create a VS Code extension language tool that provides LLM-friendly symbol definitions by leveraging ElixirLS's existing definition locator functionality. The tool will accept a symbol name and return the actual code definition as a string.

## Architecture

### 1. VS Code Extension Layer (TypeScript)
- **Language Tool Registration**: Register a new tool "elixir-definition" in package.json
- **Tool Implementation**: Create a `DefinitionTool` class implementing `vscode.LanguageModelTool`
- **LSP Command Bridge**: Use the language client to execute a custom command on the language server

### 2. ElixirLS Language Server Layer (Elixir)
- **Custom Command**: Register "elixirls.llmDefinition" command
- **Handler Module**: Create `LlmDefinition` handler that uses a simplified version of `Definition.Locator`
- **File Reading**: Read the located definition from the source file

## Implementation Steps

### Phase 1: VS Code Extension Tool

#### 1.1 Update package.json
```json
{
  "contributes": {
    "languageModelTools": [
      {
        "name": "elixir-definition",
        "displayName": "Elixir Definition Lookup",
        "description": "Find the definition of an Elixir symbol",
        "canBeReferencedInPrompt": true,
        "inputSchema": {
          "type": "object",
          "required": ["symbol"],
          "properties": {
            "symbol": {
              "type": "string",
              "description": "The name of the symbol to find (e.g., 'MyModule.my_function')"
            }
          }
        }
      }
    ]
  }
}
```

#### 1.2 Create DefinitionTool class (src/definition-tool.ts)
```typescript
class DefinitionTool implements vscode.LanguageModelTool<IParameters> {
  async invoke(options: vscode.LanguageModelToolInvocationOptions<IParameters>, 
               token: vscode.CancellationToken) {
    const { symbol } = options.input;
    
    // Execute custom LSP command
    const result = await client.sendRequest(
      'workspace/executeCommand',
      {
        command: 'elixirls.llmDefinition',
        arguments: [symbol]
      }
    );
    
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(result.definition)
    ]);
  }
}
```

#### 1.3 Register tool in extension.ts
```typescript
const tool = new DefinitionTool(client);
context.subscriptions.push(
  vscode.lm.registerTool('elixir-definition', tool)
);
```

### Phase 2: ElixirLS Command Implementation

#### 2.1 Register command in ExecuteCommand module
Add to `@handlers` map:
```elixir
"llmDefinition" => {LlmDefinition, :execute}
```

Add to `@supported_commands`:
```elixir
"llmDefinition"
```

#### 2.2 Create LlmDefinition handler (apps/language_server/lib/language_server/providers/execute_command/llm_definition.ex)
```elixir
defmodule ElixirLS.LanguageServer.Providers.ExecuteCommand.LlmDefinition do
  alias ElixirLS.LanguageServer.Providers.Definition

  def execute([symbol], state) do
    # Simulate a text document with just the symbol
    fake_text = symbol
    line = 0
    character = String.length(symbol)
    
    # Create a temporary URI
    uri = "inmemory://llm/#{symbol}.ex"
    
    # Use simplified locator logic
    case locate_definition(symbol, fake_text, line, character, state) do
      {:ok, location} ->
        # Read the file content at the location
        definition_text = read_definition(location)
        {:ok, %{definition: definition_text}}
      
      {:error, reason} ->
        {:error, %{message: "Definition not found: #{reason}"}}
    end
  end
  
  defp locate_definition(symbol, text, line, character, state) do
    # Parse the symbol to extract module/function parts
    # Use Definition.Locator logic but simplified
    # Return location or error
  end
  
  defp read_definition(location) do
    # Read the file at the location
    # Extract the relevant definition code
    # Return as string
  end
end
```

#### 2.3 Simplified Locator Implementation
Key simplifications from the full Definition.Locator:
- No need for full document parsing
- Assume symbol is fully qualified (e.g., "MyModule.my_function")
- Skip variable and attribute lookups
- Focus on module and function definitions
- Use existing metadata and introspection capabilities

## Data Flow

1. **User/LLM invokes tool** with symbol name
2. **VS Code tool** sends executeCommand to language server
3. **Language server** processes command:
   - Parses symbol name
   - Locates definition using simplified locator
   - Reads source file at definition location
   - Returns definition text
4. **VS Code tool** returns definition to LLM

## Key Considerations

### Symbol Format
- Support formats: `Module`, `Module.function`, `Module.function/arity`
- Handle aliases gracefully
- Consider Erlang modules (`:module` syntax)

### Error Handling
- Symbol not found
- Multiple definitions (overloaded functions)
- Private functions
- Macro-generated code

### Performance
- Cache recent lookups
- Reuse existing parsed AST metadata
- Minimize file I/O

### Definition Extraction
- Include function signature
- Include @doc and @spec if available
- Handle multi-clause functions
- Reasonable line limits (e.g., max 50 lines)

## Testing Strategy

1. **Unit Tests** (ElixirLS side):
   - Test symbol parsing
   - Test definition location
   - Test file reading and extraction

2. **Integration Tests** (VS Code side):
   - Test tool registration
   - Test command execution
   - Test error scenarios

3. **Manual Testing**:
   - Test with various symbol types
   - Test with common Elixir patterns
   - Test error cases

## Future Enhancements

1. **Context-aware lookups**: Use current file context for better module resolution
2. **Multiple definitions**: Return all matching definitions for overloaded functions
3. **Type information**: Include typespec information when available
4. **Documentation**: Include @moduledoc and @doc content
5. **Cross-reference**: Show where the symbol is used