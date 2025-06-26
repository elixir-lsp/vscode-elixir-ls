# Language Tool Ideas for ElixirLS

## Overview
These are language tool ideas that would be particularly useful for LLMs working with Elixir codebases. The focus is on information that is difficult to obtain via command-line tools but readily available through the language server's compiled beam files and AST analysis.

## High-Priority Tools

### 1. **Module Dependency Graph Tool**
**Problem**: LLMs struggle to understand complex module relationships, especially with aliases, imports, and use statements.
**Solution**: Return a graph of module dependencies showing:
- Which modules a given module depends on
- Which modules depend on a given module
- Transitive dependencies
- Alias mappings in context

### 2. **Behaviour Implementation Finder**
**Problem**: Finding all modules that implement a specific behaviour requires searching through entire codebases.
**Solution**: Given a behaviour module (e.g., `GenServer`), return all modules that implement it with:
- Module name and location
- Which callbacks are implemented
- Which callbacks are missing/using defaults

### 3. **Function Call Hierarchy Tool**
**Problem**: Understanding which functions call a given function is nearly impossible via CLI.
**Solution**: Provide bidirectional call information:
- All callers of a function
- All functions called by a function
- Call sites with line numbers
- Distinguishes between local and remote calls

### 4. **Type Information Extractor**
**Problem**: Getting complete type information including specs, types, and Dialyzer inferences.
**Solution**: For a given function/module, return:
- @spec definitions
- @type definitions
- Dialyzer's inferred types
- Parameter names with their types
- Return type information

### 5. **OTP Supervision Tree Analyzer**
**Problem**: Understanding GenServer/Supervisor relationships in running systems.
**Solution**: Extract and visualize:
- Supervisor hierarchy
- Child specifications
- Restart strategies
- Process registration names
- GenServer state structure

## Medium-Priority Tools

### 6. **Protocol Implementation Finder**
**Problem**: Finding all implementations of a protocol across the codebase.
**Solution**: Given a protocol, return:
- All implementing modules
- Implementation details
- Consolidated status

### 7. **Compile-Time Dependency Analyzer**
**Problem**: Understanding what will trigger recompilation.
**Solution**: Show:
- Compile-time dependencies between modules
- Runtime-only dependencies
- Modules that will recompile if a given module changes

### 8. **Mix Task Inspector**
**Problem**: Discovering and understanding project-specific Mix tasks.
**Solution**: List all available Mix tasks with:
- Task name and module
- Documentation
- Required arguments
- Task dependencies

### 9. **Module Documentation Aggregator**
**Problem**: Getting comprehensive documentation beyond just function docs.
**Solution**: Extract:
- @moduledoc
- All @doc entries
- @typedoc entries
- Examples from docs
- Related modules mentioned in docs

### 10. **Function Arity Explorer**
**Problem**: Understanding all versions of overloaded functions.
**Solution**: Given a function name, return:
- All arities with their specs
- Default arguments expansion
- Clause patterns
- Guard conditions

## Lower-Priority Tools

### 11. **Test Coverage Mapper**
**Problem**: Understanding which tests cover specific functions.
**Solution**: Map between:
- Functions and their test files
- Test names that exercise specific code
- Uncovered functions

### 12. **Message Flow Tracer**
**Problem**: Understanding inter-process communication.
**Solution**: Analyze:
- send/receive patterns
- GenServer call/cast usage
- Message types between processes

### 13. **Configuration Explorer**
**Problem**: Understanding application configuration.
**Solution**: Extract:
- Config values for all environments
- Config dependencies
- Runtime vs compile-time config

### 14. **Macro Usage Analyzer**
**Problem**: Understanding where and how macros are used.
**Solution**: For a given macro:
- All usage sites
- Expanded forms at each site
- Import/require chains

## Implementation Considerations

### Advantages of Language Server Implementation:
1. **Already compiled code**: Access to beam files with debug info
2. **AST availability**: Parsed and analyzed code ready for querying
3. **Incremental updates**: Changes tracked in real-time
4. **Cross-reference data**: Xref information already maintained
5. **Type information**: Dialyzer PLTs already built

### Why These Are Hard via CLI:
1. Would require repeated compilation/parsing
2. No persistent state between queries
3. Complex grep patterns miss context
4. No semantic understanding
5. Can't follow compile-time transformations

### Priority Rationale:
- **High**: Fundamental to understanding code structure
- **Medium**: Useful for specific tasks but not always needed
- **Lower**: Nice to have but can be worked around

## Next Steps
1. Start with Module Dependency Graph as it provides the most value
2. Implement Type Information Extractor to help with code generation
3. Add Function Call Hierarchy for refactoring support
4. Build on existing ElixirLS infrastructure (e.g., Xref, Dialyzer integration)