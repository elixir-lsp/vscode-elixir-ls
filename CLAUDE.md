# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Visual Studio Code extension for ElixirLS (Elixir Language Server). It consists of two main parts:
1. **VS Code Extension** (TypeScript/Node.js) - manages VS Code integration and spawns ElixirLS processes
2. **ElixirLS** (Elixir) - implements Language Server Protocol (LSP) and Debug Adapter Protocol (DAP)

## Essential Commands

### Building the Project

```bash
# Install VS Code extension dependencies
npm install

# Compile TypeScript
npm run compile

# Build ElixirLS
cd elixir-ls
mix deps.get
MIX_ENV=prod mix compile

# Full build for release
npm run vscode:prepublish
```

### Running Tests

```bash
# VS Code extension tests
npm test

# ElixirLS tests
cd elixir-ls
mix test

# Run specific test file
mix test test/diagnostics_test.exs

# Run specific test line
mix test test/diagnostics_test.exs:42

# Test specific app
cd apps/language_server && mix test
```

### Code Quality

```bash
# TypeScript linting/formatting (uses Biome)
npm run lint
npm run fix-formatting

# Elixir formatting
cd elixir-ls
mix format
mix format --check  # Check without changing

# Type checking
mix dialyzer
```

### Development

```bash
# Launch extension development host (press F5 in VS Code)
# Or manually:
code --extensionDevelopmentPath=.

# Watch TypeScript changes
npm run watch
```

## Architecture

### Directory Structure
- `/src/` - VS Code extension TypeScript source
- `/elixir-ls/` - Git submodule containing ElixirLS
  - `/apps/language_server/` - Language server implementation
  - `/apps/debug_adapter/` - Debug adapter implementation
  - `/apps/elixir_ls_utils/` - Shared utilities
- `/syntaxes/` - TextMate grammars for syntax highlighting

### Communication Flow
1. VS Code extension spawns ElixirLS processes via launch scripts
2. Communication happens over stdio using JSON-RPC
3. Language server handles LSP requests (completion, diagnostics, etc.)
4. Debug adapter handles DAP requests (breakpoints, stepping, etc.)

### Key Extension Components
- `src/extension.ts` - Extension entry point
- `src/vscode-elixir-ls-client.ts` - Language client implementation
- `src/commands.ts` - VS Code command implementations
- `src/task-provider.ts` - Mix task integration
- `src/test-controller.ts` - Test Explorer integration

### Key ElixirLS Components
- `apps/language_server/lib/language_server.ex` - LSP server entry
- `apps/language_server/lib/language_server/server.ex` - Request handling
- `apps/language_server/lib/language_server/providers/` - Feature providers
- `apps/debug_adapter/lib/debug_adapter.ex` - DAP server entry

## Important Notes

- ElixirLS is a git submodule - remember to initialize/update it
- Tests on Linux require xvfb: `xvfb-run -a npm test`
- The extension spawns Erlang/Elixir processes - ensure proper cleanup
- Launch scripts in `elixir-ls/scripts/` handle environment setup
- Both LSP and DAP use stdio for communication, not TCP/IP