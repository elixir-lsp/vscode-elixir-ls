# LLM Definition Tool for ElixirLS

This feature adds a VS Code language model tool that allows LLMs to look up Elixir symbol definitions and retrieve their source code.

## Implementation Overview

### VS Code Extension (TypeScript)
- **package.json**: Registers the `elixir-definition` language model tool
- **src/definition-tool.ts**: Implements the `DefinitionTool` class that handles tool invocations
- **src/extension.ts**: Registers the tool when language clients are ready

### ElixirLS Language Server (Elixir)
- **execute_command.ex**: Added `llmDefinition` to the command handlers
- **llm_definition.ex**: Implements the command handler that:
  - Parses symbol strings (e.g., "MyModule", "MyModule.function", "MyModule.function/2")
  - Locates definitions using the existing `Location.find_mod_fun_source/3`
  - Uses the Location's range (start_line, start_column, end_line, end_column) to extract the exact definition text
  - Extracts additional context like @doc and @spec attributes before the definition
  - Returns formatted source with file location information

## Usage

The tool can be invoked by LLMs with symbol names in various formats:
- Module: `"MyModule"` or `"MyModule.SubModule"`
- Function: `"MyModule.my_function"` or `"MyModule.my_function/2"`
- Erlang module: `":erlang"` or `":ets"`

## Example Response

```elixir
# Definition found in /path/to/file.ex:42

@doc """
Documentation for the function
"""
@spec my_function(term()) :: {:ok, term()} | {:error, String.t()}
def my_function(arg) do
  # Implementation
end
```

## Testing

To test the implementation:
1. Build the extension: `npm run compile && npm run vscode:prepublish`
2. Launch VS Code with the extension
3. Open an Elixir project
4. Use GitHub Copilot or another LLM that supports language tools
5. Reference the tool with `@elixir-definition` and provide a symbol name

## Future Enhancements

- Support for more symbol types (macros, structs, protocols)
- Include @doc and @spec in all cases
- Better handling of multi-clause functions
- Support for finding references/usages
- Caching for improved performance