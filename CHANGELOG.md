### Unreleased

### v0.28.0: 24 May 2025

#### Highlights

- Added support for OTP 28 on elixir 1.18.4

#### Improvements

- ElixirLS updated to [v0.28.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0280)
- Added support for OTP 28 dialyzer options

### v0.27.2: 24 March 2025

#### Improvements

- ElixirLS updated to [v0.27.2](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0272)

#### Fixes

- Fixed some crashes in tests controller

### v0.27.1: 27 February 2025

#### Improvements

- ElixirLS updated to [v0.27.1](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0271)

### v0.27.0: 27 February 2025

#### Highlights

- Added Go to declaration provider. It can be used to navigate from implementation to callback definition in behaviour module, from protocol implementation to protocol definition or from overriding def to the `__using__` macro.
- Added support for asdf v0.16

#### Improvements

- ElixirLS updated to [v0.27.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0270)
- Added a new setting `elixir_ls.stdlibSrcDir` to allow users to point to their elixir stdlib directory [cbecker](https://github.com/cbecker)
- Build dependencies updated

#### Breaking changes

- elixir 1.13 reached end of life and is no longer supported. Consider updating to 1.14+

### v0.26.4: 31 January 2025

#### Improvements

- ElixirLS updated to [v0.26.4](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0264)

### v0.26.3: 30 January 2025

#### Improvements

- ElixirLS updated to [v0.26.3](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0263)
- Relaxed VSCode engine requirement to 1.93. ElixirLS should now be compatible with Cursor 0.42+

### v0.26.2: 2 January 2025

#### Improvements

- ElixirLS updated to [v0.26.2](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0262)

### v0.26.1: 30 December 2024

#### Improvements

- ElixirLS updated to [v0.26.1](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0261)

#### Fixes

- Fixed regression in formatter plugin loader

### v0.26.0: 30 December 2024

#### Highlights

- Support for elixir 1.18

#### Improvements

- ElixirLS updated to [v0.26.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0260)
- Build dependencies updated

### v0.25.0: 15 December 2024

#### Improvements

- ElixirLS updated to [v0.25.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0250)
- Added support for `embedded-content` scheme to the list of documentSelector for all languages handled by this extension. This allows any other extension to properly forward any elixir-related command to be handled by ElixirLS only when actually necessary [Marlus Saraiva](https://github.com/msaraiva)

### v0.24.2: 14 October 2024

#### Improvements

- ElixirLS updated to [v0.24.1](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0241)

### v0.24.1: 6 October 2024

#### Fixes

- fixed a crash in telemetry init caused by breaking change in @vscode/extension-telemetry library

### v0.24.0: 6 October 2024

#### Improvements

- ElixirLS updated to [v0.24.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0240)

### v0.23.1: 10 August 2024

#### Fixes

- Addressed regression on Windows affection users with whitespaces in home path - [Alim ul kader T](https://github.com/Aulk98)

### v0.23.0: 3 August 2024

#### Improvements

- ElixirLS updated to [v0.23.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0230)
- Added support for remote debugging launch configs (with `attach` request)
- It is possible to restrict `mix.exs` search (projectDir) to the current root folder only, so in multi-root workspace configurations ElixirLS won't start in the outermost containing the `mix.exs` folder - [Vladimir Drobyshevskiy](https://github.com/vheathen)

#### Fixes

- Addressed breaking change introduced in VSCode 1.92 affecting Windows related to CVE-2024-27980 - [Lars Oehnenamen](https://github.com/wheredoipressnow)

### v0.22.1: 10 July 2024

#### Improvements

- ElixirLS updated to [v0.22.1](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0221)
- Enabled ANSI colors in Debug Adapter

### v0.22.0: 11 June 2024

#### Highlights

- Support for elixir 1.17
- Support for OTP 27

#### Improvements

- ElixirLS updated to [v0.22.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0220)
- Added support for elixir 1.17 sigils with numerals
- Added missing OTP 26+ dialyzer options `overlapping_contract` and `no_unknown`
- Improvements to terminal link provider [Juan Barrios](https://github.com/03juan)

### v0.21.3: 22 May 2024

#### Improvements

- ElixirLS updated to [v0.21.3](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0213)

### v0.21.2: 21 May 2024

#### Improvements

- ElixirLS updated to [v0.21.2](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0212)

### v0.21.1: 8 May 2024

#### Improvements

- ElixirLS updated to [v0.21.1](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0211)

### v0.21.0: 5 May 2024

#### Highlights

- OTP incremental dialyzer is now the default dialyzing engine on OTP 26+. While slower than ElixirLS dialyzer it is much better at tracking module dependencies and should resolve issues with transient dialyzer warning that do not disappear on recompile. ElixirLS dialyzer is still available and incremental dialyzer can be disabled by config setting `elixirLS.incrementalDialyzer`
- Experimental support for Code actions added. Two code actions are available: Replace unknown remote def, replace an unused variable with an underscore [Samuel Heldak](https://github.com/sheldak)

#### Improvements

- ElixirLS updated to [v0.21.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0210)
- Debug test from Test UI now runs tests in trace mode to disable timeouts
- New logo [Kirills Reunovs](https://github.com/Kirlovon)

### v0.20.0: 21 February 2024

#### Highlights

- Selection ranges provider added. This provider handles expand/shrink selection editor commands in a semantic aware way
- Completions, hover and signature help providers now are able to display `@doc` and other attributes data from the currently edited buffer
- Hover provider now returns markdown with working links to hexdocs and erlang documentation. Support for [ExDoc autolinking](https://hexdocs.pm/ex_doc/readme.html#auto-linking) and [erlang see tags](https://www.erlang.org/doc/apps/erl_docgen/inline_tags#%3Csee*%3E---see-tags) has been added

#### Improvements

- ElixirLS updated to [v0.20.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0200)
- Quoted atoms and calls are now treated as unbalanced bracket scopes
- Improved syntax highlighting of underscored typespecs and typespecs without parens. Previously those were matched as `comment.unused.elixir`, `variable.other.readwrite.elixir`, `entity.name.function.call.local.elixir`. A scope `meta.type.definition.elixir` has been introduced

### Breaking changes and deprecations

- Typespecs are now matched as `entity.name.function.typespec.elixir`. Previously those would match as `comment.unused.elixir`, `variable.other.readwrite.elixir` and `entity.name.function.call.local.elixir`

### v0.19.0: 21 January 2024

#### Highlights

- Test UI is now able to run multiple tests at once. This is made possible with running `mix test` command via debug adapter with a custom ExUnit formatter streaming test suite progress via DAP output events. Running multiple tests is supported on workspace folder, file, module, describe blocka and doctest level
- On type parsing and diagnostics for phoenix `.heex` files
- Workspace symbols provider has been reimplemented. Previously the workspace symbols index was build from all available symbols. To make it more focused and helpful now only symbols from the project are considered. This change made it much quicker and improved the quality of returned results. Fuzzy matching engine was also improved and made consistent with how complete provider works.

#### Improvements

- ElixirLS updated to [v0.19.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0190)
- Added highlighting of matching `do|fn` `end` pairs. This was added in v0.15.0 and reverted in v0.15.1. The previous attempt broke on `do:` and other atoms. This problem is now resolved with `constant.language.symbol.elixir` added to unbalanced scopes
- Added highlighting of matching `<<` `>>` pairs. This was added in v0.15.0 and reverted in v0.15.1. The previous attempt broke on bitwise operators. This problem is now resolved with `keyword.operator.bitwise.elixir` and `keyword.operator.other.unbalanced.elixir` added to unbalanced scopes
- Tests are no longer run with with `--raise` flag
- Test UI now renders separate doctests making it possible to run or debug them separately
- Charlists are now classified as `string.quoted.single.elixir` instead of `support.function.variable.quoted.single.elixir`. The previous class was breaking brackets matching algorithm. VSCode treats strings as unbalanced scopes.

#### Fixes

- Test UI is able to correctly run tests with file filter on Windows. This works around https://github.com/elixir-lang/elixir/issues/13225
- Test UI now finds tests of types other that `test` and `doctest`. Previously the filtering was too aggressive

### Breaking changes and deprecations

- Tests are now always run through debug adapter (with or without `noDebug` flag)
- Charlists are now classified as `string.quoted.single.elixir` instead of `support.function.variable.quoted.single.elixir`. The previous class was breaking brackets matching algorithm. VSCode treats strings as unbalanced scopes.
- `~>>` `<<~` operators are now classified as `keyword.operator.other.unbalanced.elixir` instead of `keyword.operator.other.elixir`

### v0.18.1: 28 December 2023

#### Improvements

- ElixirLS updated to [v0.18.1](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0181)
- Syntax highlighting now correctly matches quoted remote calls (`Mymod."4quo\"ted"()` is valid elixir syntax)

### v0.18.0: 22 December 2023

#### Highlights

- Elixir 1.16 support
- Diagnostics provider now returns related info with code positions. This feature works best with elixir 1.16 allowing for navigation to invalid syntax elements like mismatched brackets
- On type parser has been improved and extended. It now keeps a cache of parsed AST and extracted document metadata. Most of the providers has been updated to reuse this metadata eliminating the need for on demand parsing. This should make completions, hover, etc more snappy. The previous implementation was particularly not efficient for completions provider that would parse the file twice for each request
- Phoenix integration improved. Go To Definition can now navigate to controllers when inside a Phoenix scope. Complete suggestions in Phoenix.Router now return controllers and actions[Gustavo Aguiar](https://github.com/gugahoa)

#### Improvements

- ElixirLS updated to [v0.18.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0180)
- Added suggested configuration for `eex` files
- Test UI will no longer look for test files in directories starting with `.`

#### Fixes

- Syntax highlighting correctly matches `!` and `?` at the end of function calls. Preciously those was matched as `source.elixir`

### Breaking changes and deprecations

- Minimum vscode engine version is now 1.80.0
- VSCode language client updated to v9.0.1 updating LSP compatibility to v3.17.5

### v0.17.10: 19 November 2023

#### Improvements

- ElixirLS updated to [v0.17.10](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v01710)

### v0.17.9: 13 November 2023

#### Improvements

- ElixirLS updated to [v0.17.9](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0179)
- Introduced sampling for most common telemetry data

### v0.17.8: 6 November 2023

#### Improvements

- ElixirLS updated to [v0.17.8](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0178)

### v0.17.7: 6 November 2023

#### Improvements

- ElixirLS updated to [v0.17.7](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0177)

### v0.17.6: 2 November 2023

#### Improvements

- ElixirLS updated to [v0.17.6](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0176)

### v0.17.5: 31 October 2023

#### Improvements

- ElixirLS updated to [v0.17.5](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0175)

### v0.17.4: 30 October 2023

#### Improvements

- ElixirLS updated to [v0.17.4](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0174)

### v0.17.3: 24 October 2023

#### Improvements

- ElixirLS updated to [v0.17.3](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0173)
- Better sanitization of elixir stack traces in error reports

#### Fixes

- Fixed crash when Test UI is not able to parse test file

### v0.17.2: 23 October 2023

#### Improvements

- ElixirLS updated to [v0.17.2](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0172)
- The extension reports errors and usage data via VSCode telemetry. Refer to [README.md#Telemetry](README.md#Telemetry)

#### Fixes

- Grammar updated - fixed dot access matched as function call. This regression was introduced in v0.17.1
- Grammar updated - fixed punctuation not matched in atoms and attributes. This regression was introduced in v0.17.0
- Restart command refactored. Previously it would fail to restart a failed language server client

### v0.17.1: 13 October 2023

#### Improvements

- ElixirLS updated to [v0.17.1](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0171)

#### Fixes

- Variables are no longer matched as punctuation in grammar
- Restored function call matching in grammar
- Consistently match modules. Previous rules matched them differently in `defmodule`

### v0.17.0: 11 October 2023

#### Highlights

- Syntax highlighting for Unicode identifiers. Elixir supports Unicode identifiers since v1.5 and now all ElixirLS features should work with them
- When running a debug session from Test UI test result is now passed to the test controller and UI updates accordingly

#### Improvements

- ElixirLS updated to [v0.17.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0170)
- The extension is now bundled. This should improve startup time
- `defprotocol` and `defimpl` are now treated as modules in grammar

#### Fixes

- Task arguments are now correctly passed to debugger when starting debug session from Test UI. This bug made it impossible to debug a single test
- Fixed race conditions in Test Controller. Previously if Test UI was loaded before the language server starts the extension would error and fail to get the list of tests in project
- `env` from launch config is now correctly passed to debugger process in folderless setup (i.e. when launch config is bundled in workspace file)
- Bogus syntax highlighting rules matching function calls removed

### v0.16.0: 19 August 2023

#### Improvements

- ElixirLS updated to [v0.16.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0160)
- Migrated to pull based configuration retrieval and removed deprecated configuration sync. This addresses issues in recent VSCode versions when after restart the server would ignore client configuration.
- Improved handling of language server uninitialized state. This should make Testing UI more stable.

#### Fixes

- Fixed syntax highlighting with camelCase calls [Milo Lee](https://github.com/oo6)
- Debug now starts in the correct workspace folder. Previously the debug controller incorrectly assumed there is only one workspace.

#### Deprecations and removals

- `<<` and `>>` bracket matching has been removed. It broke syntax highlighting in modules using `<<<` and `>>>` bitwise operators.

### v0.15.3: 7 July 2023

No changes since v0.15.2. 0.15.2 failed to publish to Open VSX

### v0.15.2: 29 June 2023

#### Improvements

- ElixirLS updated to [v0.15.1](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0151) with support for OTP 26

### v0.15.1: 22 June 2023

### Fixes

- Revert `do` `end` bracket matching. This introduced too many problems and the workarounds did not work for `do:`
- Revert markdown highlighting in heredocs. `text.html.markdown` interferes with elixir grammar when a list (`*` or `-`) is present. Handling this would require a dedicated grammar for heredoc markdown.

### v0.15.0: 20 June 2023

#### Improvements

- ElixirLS updated to [v0.15.0](https://github.com/elixir-lsp/elixir-ls/blob/master/CHANGELOG.md#v0150)
- Added support for elixir 1.15 multi-letter sigils
- Added highlighting of matching `do` `end` pairs
- Treat code in heredocs as markdown. This allows syntax highlighting and delegation to markdown language server in `@moduledoc` `@doc` and `@typedocs`
- Highlight elixir code in `~L` sigil
- Improved handling of multi-root workspaces. Now language server is started in outermost workspace directories that contain `mix.exs`.
- Pass env from launch configuration to debugger. This allows setting node name for remote debugging (e.g. `"env": {"ELS_ELIXIR_OPTS": "--sname mynode"}`)

### Fixes

- Fixed not working syntax highlighting for `defguard` and `reraise`
- Reverted changes adding syntax highlighting in `.heex`. This conflicted with [Phoenix Framework extension](https://marketplace.visualstudio.com/items?itemName=phoenixframework.phoenix)
- `languageServerOverridePath` is correctly handled in debugger
- Consistently highlight `@moduledoc` `@doc` and `@typedocs` modifiers as documentation

### Refactorings

- The extension code has been split into smaller units
- Test suite expanded
- Test suite now passing on unix and windows

### Breaking changes and deprecations

- Removed highlighting of some pre elixir 1.0 operators (`inlist`, `inbits`, `bc`, `lc`, `xor`) that are not supported by the compiler
- elixir 1.12 is no longer supported
- Disabled ANSI colors in test output when run from Testing tab. VSCode test output does not support ANSI color markers

### v0.14.7: 6 May 2023

#### Fixes

- Refer to correct version in launch script

### v0.14.6: 6 May 2023

#### Improvements

- Mix.install is now running in quiet mode. Thanks to that git errors are no longer swallowed. This should make resolving problems easier.
- TestUI Run test and Debug will now be default use a launch configuration named `mix test` if present in workspace [Dave Purrington](https://github.com/dpurrington)
- Added option `elixirLS.autoInsertRequiredAlias` controlling if complete provider
will auto insert aliases

#### Fixes

- Fix crash when running tests via code lense
- Fix crash in test discovery
- Protocol consolidation is now turned off. This was causing problems in debugger

### v0.14.5: 21 April 2023

#### Fixes

- Include fixes for crashes from v0.14.5 of elixirLS
- Explicitly set MIX_ENV to `test` in run/debug test commands

### v0.14.4: 20 April 2023

#### Fixes

- Fixed invalid encoding of messages with unicode strings. This should resolve issues when starting the server in in non-ASCII path

### v0.14.3: 17 April 2023

#### Fixes

- Fix compatibility with elixir 1.12 and 1.13

### v0.14.2: 15 April 2023

#### Fixes

- Correctly set release tag in Windows startup scripts
- Make startup scripts not crash on Linux

### v0.14.0: 14 April 2023

#### Highlights

- Debugger can now be run directly from Test UI
- The extension now uses `Mix.install` to manage elixir-ls versions. Thanks to that it will use a correct version build for the project's environment, OTP and elixir version.

#### Improvements

- Test Code Lense integrated with Test UI [Carl-Foster](https://github.com/Carl-Foster)
- Test UI properly respects `projectDir` setting
- Improve rendering of `defdelegate` [Vicente Merlo](https://github.com/antedeguemon)
- It's now possible to disable auto build with `autoBuild` setting
- Fixed handling of scoped settings in multiroot workspaces
- Debugger respects `MIX_TARGET`

#### Refactorings

- Formatter properly lints all files [Carl-Foster](https://github.com/Carl-Foster)

### v0.13.0: 10 January 2023

#### Improvements

- Allow to override default elixirLS release path in config [Daniel Silva](https://github.com/DFilipeS)
- VSCode task provider with common mix tasks e.g. clean, compile, get.deps, test

#### Deprecations and removals

- HEEX syntax highlighting - turned out to break phoenix extension

### v0.12.0: 8 November 2022

Improvements:

- Test UI support added
- HEEX syntax highlighting [Matthew Lehner](https://github.com/matthewlehner)
- More extension activation events
- Support for elixir 1.14 EEX comment syntax [Brian Alexander](https://github.com/balexand)
- Custom command `Trigger mix clean in language server`

Fixes:

- duplicated workspace modification subscription removed

See [changes in ElixirLS](https://github.com/elixir-lsp/elixir-ls/blob/v0.12.0/CHANGELOG.md#v0120-7-november-2022)

### v0.11.0: 14 August 2022

Improvements:

- Elixir 1.14 support
- Document symbols now return non empty selection ranges. This fixes breadcrumbs behavior in vscode
- Fixed dialyzer crash on OTP 25
- Added support for mix formatter plugins ([Dalibor Horinek](https://github.com/DaliborHorinek))
- Debugger now returns detailed info about ports, pids and function variables
- Debugger completions now return detail field
- Diagnostic positions now return column position returned by compiler (elixir 1.14+)
- Diagnostic position fixed to never return invalid negative values
- An exact `do` keyword completion is now preselected and more preferred over `defoverridable`
- Fixed hexdocs links in hover for aliased modules and imported functions ([Milo Lee](https://github.com/oo6))
- Better module name suggestions in Phoenix `live` directory ([Manos Emmanouilidis](https://github.com/bottlenecked))

**Deprecations**
- Minimum version of Elixir is now 1.11

### v0.10.0: 10 June 2022

Improvements to debugger adapter:

- A lot of new features around breakpoints: function breakpoints, conditional breakpoints, hit count and log points [#656](https://github.com/elixir-lsp/elixir-ls/pull/656), [#661](https://github.com/elixir-lsp/elixir-ls/pull/661), [#671](https://github.com/elixir-lsp/elixir-ls/pull/671) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Completions in debugger eval console [#679](https://github.com/elixir-lsp/elixir-ls/pull/679) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Debugger evaluate results can now be expanded [#672](https://github.com/elixir-lsp/elixir-ls/pull/672) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Messages in the queue of debugged process can now be examined [#681](https://github.com/elixir-lsp/elixir-ls/pull/681) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Debugger can now handle pause and terminateThread requests [#675](https://github.com/elixir-lsp/elixir-ls/pull/675) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Clipboard and hover eval is now supported in debugger [#680](https://github.com/elixir-lsp/elixir-ls/pull/680) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Auto interpreting can now be disabled [#616](https://github.com/elixir-lsp/elixir-ls/pull/616) (thanks [Jason Axelson](https://github.com/axelson))
- Debugger conforms better to DAP 1.51 specification [#678](https://github.com/elixir-lsp/elixir-ls/pull/678) (thanks [Łukasz Samson](https://github.com/lukaszsamson))

Improvements to language server:

- Language server can now be restarted via custom command (e.g. from VSCode) [#653](https://github.com/elixir-lsp/elixir-ls/pull/653) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Hover provider adds links to hexdocs.pm [#574](https://github.com/elixir-lsp/elixir-ls/pull/574) (thanks [Fenix](https://github.com/zhenfeng-zhu))
- Numerous cases of invalid UTF8-UTF16 position conversions fixed [#677](https://github.com/elixir-lsp/elixir-ls/pull/677) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Improved markdown wrapping [#663](https://github.com/elixir-lsp/elixir-ls/pull/663) (thanks [我没有抓狂](https://github.com/BlindingDark))
- Improved MIX_TARGET environment variable handling [#670](https://github.com/elixir-lsp/elixir-ls/pull/670) (thanks [Masatoshi Nishiguchi](https://github.com/mnishiguchi))
- defmodule snippet now suggests a module name [#684](https://github.com/elixir-lsp/elixir-ls/pull/684) (thanks [Manos Emmanouilidis](https://github.com/bottlenecked))
- Constant recompilation on Nerves projects fixed [#686](https://github.com/elixir-lsp/elixir-ls/issues/686) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Invalid negative positions in diagnostics are no longer emitted [#695](https://github.com/elixir-lsp/elixir-ls/pull/695) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Improvements to document symbols provider (https://github.com/elixir-lsp/elixir-ls/commit/1e38db4c9dd9277dfffd9563286f652e3d617a5f) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Added support for OTP 25 new dialyzer options (https://github.com/elixir-lsp/elixir-ls/commit/0da7623f644f79559699e9f002820ad9219d108d) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Improvements to complete (operator, sigil, bitstring) [#150](https://github.com/elixir-lsp/elixir_sense/pull/150), (https://github.com/elixir-lsp/elixir_sense/commit/33df514a1254455f54cb069999454c7e8586eb2d) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Improved alias resolution (https://github.com/elixir-lsp/elixir_sense/issues/151) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Fixed crash on OTP 24.2 (https://github.com/elixir-lsp/elixir_sense/commit/72f3d4ffee3c11c289d47d14a6c5f6e1a4afacb4) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Better function detection when hovering inside string interpolation [#152](https://github.com/elixir-lsp/elixir_sense/pull/152) (thanks [Milo Lee](https://github.com/oo6))
- Support for external plugins to elixir_sense [#141](https://github.com/elixir-lsp/elixir_sense/pull/141) (thanks [Zach Daniel](https://github.com/zachdaniel))

VSCode:

- To Pipe and From Pipe code transformation command [#182](https://github.com/elixir-lsp/vscode-elixir-ls/pull/182) (thanks [Paulo Valente](https://github.com/polvalente))
- Restart language server command added [#218](https://github.com/elixir-lsp/vscode-elixir-ls/pull/218) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- New settings related to auto interpreting in debugger (https://github.com/elixir-lsp/vscode-elixir-ls/commit/4294f9f0da6819e519aa4278f5f2d553ff054dac) (thanks [Jason Axelson](https://github.com/axelson))
- New OTP 25 dialyzer settings (https://github.com/elixir-lsp/vscode-elixir-ls/commit/50a8a53fa79c14d2ea4031f872ec3d7cd32155f5) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Compile time environment variables can now be set in extension config [#213](https://github.com/elixir-lsp/vscode-elixir-ls/pull/213) (thanks [vacarsu](https://github.com/vacarsu))
- Additional watched extensions can now be set in extension config [#197](https://github.com/elixir-lsp/vscode-elixir-ls/pull/197) (thanks [Vanja Bucic](https://github.com/vanjabucic))
- Improved unquote_slicing highlighting [#221](https://github.com/elixir-lsp/vscode-elixir-ls/pull/221) (thanks [Milo Lee](https://github.com/oo6))
- Improved string interpolation highlighting [#229](https://github.com/elixir-lsp/vscode-elixir-ls/pull/229) (thanks [Milo Lee](https://github.com/oo6))
- Improved regex with < highlighting [#226](https://github.com/elixir-lsp/vscode-elixir-ls/pull/226) (thanks [Tiago Moraes](https://github.com/tiagoefmoraes))
- Extension updated to use LSP v3.16 [#227](https://github.com/elixir-lsp/vscode-elixir-ls/pull/227) (thanks [Łukasz Samson](https://github.com/lukaszsamson))

Houskeeping:

thanks [Łukasz Samson](https://github.com/lukaszsamson), [Thanabodee Charoenpiriyakij](https://github.com/wingyplus), [Daniils Petrovs](https://github.com/DaniruKun), [Jason Axelson](https://github.com/axelson)

### v0.9.0: 4 December 2021

Improvements:
- Elixir 1.13 support (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#620](https://github.com/elixir-lsp/elixir-ls/pull/620)
- Fix formatting performance problems with .formatter.exs in subdirectories (thanks [Jon Leighton](https://github.com/jonleighton)) [#609](https://github.com/elixir-lsp/elixir-ls/pull/609)
- Allow watching additional extensions via `additionalWatchedExtensions` (thanks [Vanja Bucic](https://github.com/vanjabucic)) [#569](https://github.com/elixir-lsp/elixir-ls/pull/569)
- Support for setting additional environment variables (thanks [vacarsu](https://github.com/vacarsu)) [#622](https://github.com/elixir-lsp/elixir-ls/pull/622)
- Allow configuring debugExpressionTimeoutMs (thanks [Jason Axelson](https://github.com/axelson)) [#613](https://github.com/elixir-lsp/elixir-ls/pull/613)

Changes:
- Default `fetchDeps` to false (thanks [Jason Axelson](https://github.com/axelson)) [#633](https://github.com/elixir-lsp/elixir-ls/pull/633)
  - `fetchDeps` causes some bad race conditions, especially with Elixir 1.13

Bug Fixes:
- Add indentation following \"do\" completion (thanks [AJ Foster](https://github.com/aj-foster)) [#606](https://github.com/elixir-lsp/elixir-ls/pull/606)

Housekeeping:
- Add initial mkdocs documentation website (thanks [Daniils Petrovs](https://github.com/DaniruKun)) [#619](https://github.com/elixir-lsp/elixir-ls/pull/619)
- Update to elixir-lsp fork of mix_task_archive_deps (thanks [Jason Axelson](https://github.com/axelson)) [#628](https://github.com/elixir-lsp/elixir-ls/pull/628)

VSCode:
- Change the default of `fetchDeps` to false (thanks [Jason Axelson](https://github.com/axelson)) [#189](https://github.com/elixir-lsp/vscode-elixir-ls/pull/189)
- Allow configuring the debug expression timeout (thanks [Jason Axelson](https://github.com/axelson)) [#210](https://github.com/elixir-lsp/vscode-elixir-ls/pull/210)
- Set which pairs of brackets should be colorized (thanks [S. Arjun](https://github.com/systemctl603)) [#207](https://github.com/elixir-lsp/vscode-elixir-ls/pull/207)

### v0.8.1: 1 September 2021

Improvements:
- Add a "do" autocompletion (thanks [Jason Axelson](https://github.com/axelson/)) [#593](https://github.com/elixir-lsp/elixir-ls/pull/593)
- Add an "end" autocompletion (thanks [Maciej Szlosarczyk](https://github.com/maciej-szlosarczyk)) [#599](https://github.com/elixir-lsp/elixir-ls/pull/599)

Housekeeping:
- Remove dependency on forms (thanks [Awlexus](https://github.com/Awlexus)) [#596](https://github.com/elixir-lsp/elixir-ls/pull/596)
- CI releases: utilize auto selection of latest patch version (thanks [Po Chen](https://github.com/princemaple)) [#591](https://github.com/elixir-lsp/elixir-ls/pull/591)
- Change minimum OTP version to 22 in warning message (thanks [Thanabodee Charoenpiriyakij](https://github.com/wingyplus)) [#592](https://github.com/elixir-lsp/elixir-ls/pull/592)
- Fix various typos (thanks [Kian Meng Ang](https://github.com/kianmeng)) [#594](https://github.com/elixir-lsp/elixir-ls/pull/594)

### v0.8.0: 14 August 2021

Improvements:
- Basic single-file (e.g. `.exs`) support (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#562](https://github.com/elixir-lsp/elixir-ls/pull/562) (and VSCode [#195](https://github.com/elixir-lsp/vscode-elixir-ls/pull/195))
- Add commands for piping and unpiping text (thanks [Paulo Valente](https://github.com/polvalente)) [#515](https://github.com/elixir-lsp/elixir-ls/pull/515)
- Make `test` snippet consistent by including quotes (thanks [Mitchell Hanberg](https://github.com/mhanberg)) [#542](https://github.com/elixir-lsp/elixir-ls/pull/542)
- Smarter spec suggestions in protocols and implementations (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#549](https://github.com/elixir-lsp/elixir-ls/pull/549)
- Trigger signature_help on comma (thanks [Jared Mackey](https://github.com/jared-mackey)) [#564](https://github.com/elixir-lsp/elixir-ls/pull/564)
- Watch HEEx and  Surface files (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#583](https://github.com/elixir-lsp/elixir-ls/pull/583)
- ElixirSense: Add more fuzzy matching (thanks [Maciej Szlosarczyk](https://github.com/maciej-szlosarczyk)) [#131](https://github.com/elixir-lsp/elixir_sense/pull/131)
- ElixirSense: Add inference when using dependency injection with module attributes ([Gustavo Aguiar](https://github.com/gugahoa)) [#133](https://github.com/elixir-lsp/elixir_sense/pull/133)
- ElixirSense: Add support for EEP-48 (updated documentation storage format) (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#132](https://github.com/elixir-lsp/elixir_sense/pull/132)
  - http://erlang.org/doc/apps/kernel/eep48_chapter.html
- Watch `.heex` and `.sface` templates (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#583](https://github.com/elixir-lsp/elixir-ls/pull/583)

Bug Fixes:
- Fix suggest contracts windows regression (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#531](https://github.com/elixir-lsp/elixir-ls/pull/531)
- Support exunit describe and test calls with unevaluated names (thanks [Jonathan Arnett](https://github.com/J3RN)) [#537](https://github.com/elixir-lsp/elixir-ls/pull/537)
- Improve test runner to use exunit testPaths and testPattern (thanks [Étienne Lévesque](https://github.com/Blond11516)) [#500](https://github.com/elixir-lsp/elixir-ls/pull/500)
- Fix race-condition in suggest contracts (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#544](https://github.com/elixir-lsp/elixir-ls/pull/544)
- Fix `@doc false` and `@moduledoc false` for folding ranges (thanks [Jason Axelson](https://github.com/axelson/)) [#580](https://github.com/elixir-lsp/elixir-ls/pull/580)
- Guard against sending -1 line or column locations in LSP messages (thanks [Oliver Marriott](https://github.com/rktjmp)) [#558](https://github.com/elixir-lsp/elixir-ls/pull/558)
- Avoid crashing on manipulatePipes errors (thanks [Paulo Valente](https://github.com/polvalente)) [#576](https://github.com/elixir-lsp/elixir-ls/pull/576)
- Handle Nova long form paths in rootURI (thanks [Raul Chedrese](https://github.com/raulchedrese)) [#579](https://github.com/elixir-lsp/elixir-ls/pull/579)
- Fix invalid glob pattern in watchers registration (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#586](https://github.com/elixir-lsp/elixir-ls/pull/586)
- Handle `.` and symlinks as the project dir (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#587](https://github.com/elixir-lsp/elixir-ls/pull/587)

Housekeeping:
- Minor iteration/performance improvements (thanks [Andrew Summers](https://github.com/asummers)) [#527](https://github.com/elixir-lsp/elixir-ls/pull/527)

VSCode:
- Support optional `~S` sigil at start of doc folding region (thanks [thepeoplesbourgeois](https://github.com/thepeoplesbourgeois)) [#179](https://github.com/elixir-lsp/vscode-elixir-ls/pull/179)
- Fix run test command to save document before running tests (thanks [Étienne Lévesque](https://github.com/Blond11516)) [#165](https://github.com/elixir-lsp/vscode-elixir-ls/pull/165)
- Support HEEx and Surface files (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#204](https://github.com/elixir-lsp/vscode-elixir-ls/pull/204)

**Deprecations**
- Minimum version of Elixir is now 1.10
- Minimum version of Erlang/OTP is now 22
These are keeping in line with our Version Support Guidelines: https://github.com/elixir-lsp/elixir-ls/blob/master/DEVELOPMENT.md#version-support-guidelines

### v0.7.0: 06 April 2021

Improvements:
- Use fuzzy matching for function completion (thanks [Po Chen](https://github.com/princemaple)) [#491](https://github.com/elixir-lsp/elixir-ls/pull/491/files)
  - For example: "valp" will match `validate_password` and "Enum.chub" will match `Enum.chunk_by/2`
  - Note: the plan is to extend this fuzzy matching to other types of completion in the future
- Support auto-generating folding ranges (textDocument/foldingRange) (thanks [billylanchantin](https://github.com/billylanchantin)) [#492](https://github.com/elixir-lsp/elixir-ls/pull/492)
- Snippet variants with n-1 placeholders to use after pipe (thanks [Leonardo Donelli](https://github.com/LeartS)) [#501](https://github.com/elixir-lsp/elixir-ls/pull/501)
- Make launcher script more robust and support symlinks... more robustly (thanks [Joshua Trees](https://github.com/jtrees)) [#473](https://github.com/elixir-lsp/elixir-ls/pull/473)
- Add support for Elixir 1.12 (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#523](https://github.com/elixir-lsp/elixir-ls/pull/523)

Bug Fixes:
- Make expandMacro a custom command (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#498](https://github.com/elixir-lsp/elixir-ls/pull/498)
  - Scope expandMacro command to ElixirLS server instance (thanks [Tom Crossland](https://github.com/tcrossland)) [#505](https://github.com/elixir-lsp/elixir-ls/pull/505)
- Suppress setup script stdout output on windows (thanks [Po Chen](https://github.com/princemaple)) [#497](https://github.com/elixir-lsp/elixir-ls/pull/497)

Housekeeping:
- Improved support for OTP 24 (thanks [Tom Crossland](https://github.com/tcrossland)) [#504](https://github.com/elixir-lsp/elixir-ls/pull/504)
  - Note that OTP 24 isn't officially supported since it is not yet released
- Add meta-test to ensure that all commands include the server instance id (thanks [Jason Axelson](https://github.com/axelson)) [#507](https://github.com/elixir-lsp/elixir-ls/pull/507)
- Fix test flakiness by ensuring build is complete (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#511](https://github.com/elixir-lsp/elixir-ls/pull/511)

VSCode:
- Fix test lens shell escaping on Windows (thanks [Étienne Lévesque](https://github.com/Blond11516)) [#175](https://github.com/elixir-lsp/vscode-elixir-ls/pull/175)
-  Add hrl to watched files (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#177](https://github.com/elixir-lsp/vscode-elixir-ls/pull/177)
- Fix CI issues (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#178](https://github.com/elixir-lsp/vscode-elixir-ls/pull/178)
- Add support for `expandMacro` command (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#176](https://github.com/elixir-lsp/vscode-elixir-ls/pull/176)

**Deprecations**
Deprecate non-standard `elixirDocument/macroExpansion` command. It is being replaced with the `expandMacro` custom command. See [#498](https://github.com/elixir-lsp/elixir-ls/pull/498) for details. It is planned to be fully removed in 0.8

### v0.6.5: 9 February 2021

Bug Fixes:
- Skip non file: URI scheme notifications (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#475](https://github.com/elixir-lsp/elixir-ls/pull/475)

Housekeeping:
- Fixes tests not compiling after first run (thanks [Étienne Lévesque](https://github.com/Blond11516)) [#463](https://github.com/elixir-lsp/elixir-ls/pull/463)

### v0.6.4: 2 February 2021

Bug Fixes:
- Revert "Make wrapper script more robust" (thanks [Jason Axelson](https://github.com/axelson)) [#471](https://github.com/elixir-lsp/elixir-ls/pull/471)

### v0.6.3: 30 January 2021

Improvements:
- Add support for `textDocument/implementation` ("Go to Implementations" and "Peek Implementations") (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#415](https://github.com/elixir-lsp/elixir-ls/pull/415)
- More specific `CompletionItemKind` for autocomplete (thanks [Jason Axelson](https://github.com/axelson)) [#419](https://github.com/elixir-lsp/elixir-ls/pull/419)
- Support ASDF installed via homebrew on macOS (thanks [Fabian Stegemann](https://github.com/zetaron)) [#428](https://github.com/elixir-lsp/elixir-ls/pull/428)
- Make launcher script more robust and support symlinks (thanks [Joshua Trees](https://github.com/jtrees)) [#445](https://github.com/elixir-lsp/elixir-ls/pull/445)
- ElixirSense: Fix autocomplete for many_to_many associations (thanks [Damon Janis](https://github.com/damonvjanis)) [elixir_sense #120](https://github.com/elixir-lsp/elixir_sense/pull/120)
- Experimental: Add code lens to run tests (thanks [Étienne Lévesque](https://github.com/Blond11516)) [#389](https://github.com/elixir-lsp/elixir-ls/pull/389)
  - Note: This is disabled by default for now

Bug Fixes:
- Fix multiple issues with text synchronization (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#411](https://github.com/elixir-lsp/elixir-ls/pull/411)
- Purge consolidated protocols before compilation (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#406](https://github.com/elixir-lsp/elixir-ls/pull/406)
- Don't add stream_data to release archive (thanks [Tomasz Kowal](https://github.com/tomekowal)) [#417](https://github.com/elixir-lsp/elixir-ls/pull/417)
  - Fixes bug introduced in [#411](https://github.com/elixir-lsp/elixir-ls/pull/411) so it doesn't affect a released version of ElixirLS
- Do not insert `end` after `do:` (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#426](https://github.com/elixir-lsp/elixir-ls/pull/426)
- Fix awaiting_contracts not getting responses (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#433](https://github.com/elixir-lsp/elixir-ls/pull/433)
- Fix invalid value set in write_manifest_pid (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#430](https://github.com/elixir-lsp/elixir-ls/pull/430)
- Give better warning for incomplete erlang install (thanks [Jason Axelson](https://github.com/axelson)) [#434](https://github.com/elixir-lsp/elixir-ls/pull/434)
- Fix some test lenses bugs (thanks [Étienne Lévesque](https://github.com/Blond11516)) [#443](https://github.com/elixir-lsp/elixir-ls/pull/443)
- URI - file system path conversion fixes (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#447](https://github.com/elixir-lsp/elixir-ls/pull/447)
- Significantly improve debugger stability (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#457](https://github.com/elixir-lsp/elixir-ls/pull/457)
- Fix invalid snippet inserted when completing fun with record argument (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#458](https://github.com/elixir-lsp/elixir-ls/issues/458)
- Return correct location for defs with when (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#464](https://github.com/elixir-lsp/elixir-ls/pull/464)

Housekeeping:
- Switch from Travis CI to GitHub actions (thanks [Jason Axelson](https://github.com/axelson)) [#420](https://github.com/elixir-lsp/elixir-ls/pull/420)
- Add an .editorconfig for the project (thanks [Jeff Jewiss](https://github.com/jeffjewiss)) [#432](https://github.com/elixir-lsp/elixir-ls/pull/432)
- Add test coverage to packet stream and wire protocol modules (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#429](https://github.com/elixir-lsp/elixir-ls/pull/429)

VSCode:
- Fix debugger not starting on windows (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#154](https://github.com/elixir-lsp/vscode-elixir-ls/pull/154)
- Add fodling markers for @doc, @moduledoc, @typedoc, and #region (thanks [Michael Johnston](https://github.com/lastobelus)) [#157](https://github.com/elixir-lsp/vscode-elixir-ls/pull/157)
- README update to reflect editor.acceptSuggestionOnEnter change (thanks [Maximilien Mellen](https://github.com/maxmellen)) [#159](https://github.com/elixir-lsp/vscode-elixir-ls/pull/159)

### v0.6.2: 15 November 2020

Improvements:
- Add setup.bat support for windows (thanks [E14](https://github.com/E14)) [#374](https://github.com/elixir-lsp/elixir-ls/pull/374)
- Add a message when done fetching deps [#380](https://github.com/elixir-lsp/elixir-ls/pull/380)

Changes:
- Remove query prefixes from workspace symbol search (the functionality is now longer supported by VSCode) (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#396](https://github.com/elixir-lsp/elixir-ls/pull/396)

Bug Fixes:
- Fix formatting on windows (thanks [Po Chen](https://github.com/princemaple)) [#375](https://github.com/elixir-lsp/elixir-ls/pull/375)
- Improve formatting speed (thanks [Matt Baker](https://github.com/mattbaker)) [#390](https://github.com/elixir-lsp/elixir-ls/pull/390)
- Fix warnings and errors around starting wx (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#388](https://github.com/elixir-lsp/elixir-ls/pull/388)
  - This fixes an issue when running ElixirLS in VSCode remote dev containers

Housekeeping:
- Add GitHub action to auto-publish releases (thanks [Po Chen](https://github.com/princemaple)) [#384](https://github.com/elixir-lsp/elixir-ls/pull/384)
- Spec compliance, race condition fixes, and more tests (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#399](https://github.com/elixir-lsp/elixir-ls/pull/399)

VSCode:
- Bump deps and switch to newer vscode platform version (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#148](https://github.com/elixir-lsp/vscode-elixir-ls/pull/148)
- Subscribe Copy Debug Info command for disposal (thanks [Tan Jay Jun](https://github.com/jayjun)) [#149](https://github.com/elixir-lsp/vscode-elixir-ls/pull/149)
- Turn files in stack traces into clickable links (thanks [Tan Jay Jun](https://github.com/jayjun)) [#152](https://github.com/elixir-lsp/vscode-elixir-ls/pull/152)

### v0.6.1: 4 October 2020

VSCode:
- Fix broken packaging (issue [#145](https://github.com/elixir-lsp/vscode-elixir-ls/issues/145))

### v0.6.0: 3 October 2020

Potentially breaking changes:
- Do not format files that are not listed in `inputs` of `.formatter.exs` (thanks [Tan Jay Jun](https://github.com/jayjun)) [#315](https://github.com/elixir-lsp/elixir-ls/pull/315)
- Drop OTP 20 and Elixir 1.7.x support and set some version support guidelines (thanks [Jason Axelson](https://github.com/axelson)) [PR #337](https://github.com/elixir-lsp/elixir-ls/pull/337)

Improvements:
- Add Ecto completion plugin from ElixirSense (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#333](https://github.com/elixir-lsp/elixir-ls/pull/333)
  - Supports generic completion items and moves doc snippet completions to ElixirSense because there's more context there (more detail available in [elixir_sense#104](https://github.com/elixir-lsp/elixir_sense/issues/104))
- Add eval support in debugger to see values of variables in scope (thanks [Dmitry Shpagin](https://github.com/sofakingworld)) [#339](https://github.com/elixir-lsp/elixir-ls/pull/339)
- Use ElixirSense's error tolerant parser for document symbols (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#322](https://github.com/elixir-lsp/elixir-ls/pull/322)
- Add more auto-completion trigger characters: `& % ^ : !` (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#327](https://github.com/elixir-lsp/elixir-ls/pull/327)
- Disable busy-wait in BEAM to reduce CPU usage (thanks [Jason Axelson](https://github.com/axelson)) [#331](https://github.com/elixir-lsp/elixir-ls/pull/331)
- Update HoverProvider to return MarkupContent (thanks [Jonathan Arnett](https://github.com/J3RN)) [#342](https://github.com/elixir-lsp/elixir-ls/pull/342)
- In debugger, exclude modules with wildcards (thanks [Fabian Stegemann](https://github.com/zetaron)) [#363](https://github.com/elixir-lsp/elixir-ls/pull/363)
- Support Elixir 1.11 (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#360](https://github.com/elixir-lsp/elixir-ls/pull/360)

Bug Fixes:
- Fix issue with formatting and deps handling (thanks [Thanabodee Charoenpiriyakij](https://github.com/wingyplus)) [#345](https://github.com/elixir-lsp/elixir-ls/pull/345)
  - This would manifest as `** (Mix.Error) Unknown dependency :ecto_sql given to :import_deps in the formatter configuration.`
- Fix formatting files in umbrella projects (thanks [Drew Olson](https://github.com/drewolson))[#350](https://github.com/elixir-lsp/elixir-ls/pull/350)
- Fix callback suggesions (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#359](https://github.com/elixir-lsp/elixir-ls/pull/359)

House keeping:
- Use error tolerant parser for WorkspaceSymbols (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#322](https://github.com/elixir-lsp/elixir-ls/pull/322)
- Fix the link in the README to releases (thanks [RJ Dellecese](https://github.com/rjdellecese)) [#312](https://github.com/elixir-lsp/elixir-ls/pull/312)
- Update the dialyzer section in the readme (thanks [Serenity597](https://github.com/Serenity597)) [#323](https://github.com/elixir-lsp/elixir-ls/pull/323)
- Add vim-lsp to plugin list (thanks [Thanabodee Charoenpiriyakij](https://github.com/wingyplus)) [#340](https://github.com/elixir-lsp/elixir-ls/pull/340)
- Cleanup test output (thanks [Jason Axelson](https://github.com/axelson)) [#347](https://github.com/elixir-lsp/elixir-ls/pull/347)
- Remove the default .tool-versions file (thanks [Jason Axelson](https://github.com/axelson)) [#351](https://github.com/elixir-lsp/elixir-ls/pull/351)
- Fix up the test suite (thanks [Jason Axelson](https://github.com/axelson)) [#352](https://github.com/elixir-lsp/elixir-ls/pull/352)
  - And re-enable dialyzer [#354](https://github.com/elixir-lsp/elixir-ls/pull/354)

Note: `MIX_TARGET` support was added in 0.5.0 but wasn't added to the changelog until later:
- Support `MIX_TARGET` so the language server can have target specific contexts, like with Nerves (thanks [Jon Carstens](https://github.com/jjcarstens)) [#299](https://github.com/elixir-lsp/elixir-ls/pull/299)

VSCode:
- Debugger does not successfully launch on Windows (thanks [Craig Tataryn](https://github.com/ctataryn)) [#115](https://github.com/elixir-lsp/vscode-elixir-ls/pull/115)
- Add support to highlight octal numbers correctly (thanks [Thanabodee Charoenpiriyakij](https://github.com/wingyplus)) [#128](https://github.com/elixir-lsp/vscode-elixir-ls/pull/128)
  - Followup improvement [#137](https://github.com/elixir-lsp/vscode-elixir-ls/pull/137)
- Add support to highlight binary numbers correctly (thanks [Thanabodee Charoenpiriyakij](https://github.com/wingyplus)) [#133](https://github.com/elixir-lsp/vscode-elixir-ls/pull/133)
- Add support to highlight `...` correctly (thanks [Thanabodee Charoenpiriyakij](https://github.com/wingyplus)) [#130](https://github.com/elixir-lsp/vscode-elixir-ls/pull/130)
- Highlight atoms as `constant.language.symbol.elixir` instead of `constant.other.symbol.elixir` (thanks [Omri Gabay](https://github.com/OmriSama)) [#142](https://github.com/elixir-lsp/vscode-elixir-ls/pull/142)

### v0.5.0: 28 June 2020

Improvements:
- Support completion of callback function definitions (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#265](https://github.com/elixir-lsp/elixir-ls/pull/265)
- Support WorkspaceSymbols (go to symbol in workspace) without dialyzer being enabled (thanks [Jason Axelson](https://github.com/axelson)) [#263](https://github.com/elixir-lsp/elixir-ls/pull/263)
- Give more direct warnings when mix.exs cannot be found (thanks [Jason Axelson](https://github.com/axelson)) [#297](https://github.com/elixir-lsp/elixir-ls/pull/297)
- Add completions for `@moduledoc false` and `@doc false` (thanks [Jason Axelson](https://github.com/axelson)) [#288](https://github.com/elixir-lsp/elixir-ls/pull/288)
- Support `MIX_TARGET` so the language server can have target specific contexts, like with Nerves (thanks [Jon Carstens](https://github.com/jjcarstens)) [#299](https://github.com/elixir-lsp/elixir-ls/pull/299)

Changes:
- Major improvement/change: Improve autocomplete and signature help (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#273](https://github.com/elixir-lsp/elixir-ls/pull/273)
  - Don't insert arguments when completing a function call (almost always had to be deleted)
  - Autocomplete triggers signature help
  - Don't insert a `()` around the function call if the formatter configuration does not require it
  - Further autocomplete refinements (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#300](https://github.com/elixir-lsp/elixir-ls/pull/300)
- No longer always return a static list of keywords for completion (thanks [Jason Axelson](https://github.com/axelson)) [#259](https://github.com/elixir-lsp/elixir-ls/pull/259)

Bug Fixes:
- Formatting was returning invalid floating point number (thanks [Thanabodee Charoenpiriyakij](https://github.com/wingyplus)) [#250](https://github.com/elixir-lsp/elixir-ls/pull/250)
- Fix detection of empty hover hints (thanks [Dmitry Gutov](https://github.com/dgutov)) [#279](https://github.com/elixir-lsp/elixir-ls/pull/279)
- Debugger doesn't fail when modules cannot be interpreted (thanks [Łukasz Samson](https://github.com/lukaszsamson)) (such as nifs) [#283](https://github.com/elixir-lsp/elixir-ls/pull/283)
- Do not advertise `workspaceFolders` support (thanks [Jason Axelson](https://github.com/axelson)) [#298](https://github.com/elixir-lsp/elixir-ls/pull/298)
- Do not try to create gitignore when project dir not set (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#306](https://github.com/elixir-lsp/elixir-ls/pull/306)
- Only call DocumentSymbols (outline pane) for .ex and .exs files (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#262](https://github.com/elixir-lsp/elixir-ls/pull/262)

House keeping:
- Server runs with a unique id (and uses it to disambiguate commands) (thanks [Alessandro Tagliapietra](https://github.com/alex88)) [#278](https://github.com/elixir-lsp/elixir-ls/pull/278)
- Improvements to the reliability of the test suite (thanks [Jason Axelson](https://github.com/axelson)) [#270](https://github.com/elixir-lsp/elixir-ls/pull/270), [#271](https://github.com/elixir-lsp/elixir-ls/pull/271)
- Rename debugger app so that it does not conflict with otp debugger app (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#280](https://github.com/elixir-lsp/elixir-ls/pull/280)
- Vendor Jason library to prevent conflicts with user's code (thanks [Jason Axelson](https://github.com/axelson)) [#253](https://github.com/elixir-lsp/elixir-ls/pull/253)
- Switch to new supervisor format (thanks [Jason Axelson](https://github.com/axelson)) [#260](https://github.com/elixir-lsp/elixir-ls/pull/260)
- Display the version of Elixir used to compile ELixirLS (thanks [Jason Axelson](https://github.com/axelson)) [#264](https://github.com/elixir-lsp/elixir-ls/pull/264)

VSCode:
- Support workspaces with multiple elixir projects (thanks [Alessandro Tagliapietra](https://github.com/alex88)) [#70](https://github.com/elixir-lsp/vscode-elixir-ls/pull/70)
  - Support per-folder configuration for many settings (makes the multi-workspace support more powerful) (thanks [AJ Foster](https://github.com/aj-foster)) [#110](https://github.com/elixir-lsp/vscode-elixir-ls/pull/110)
- Improved support for phoenix templates (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#93](https://github.com/elixir-lsp/vscode-elixir-ls/pull/93)
  - Shows errors in `.eex` and `.leex` files (instead of associated `.ex` file)
- Improve syntax highlighting following pipes (thanks [Dusty Pomerleau](https://github.com/dustypomerleau)) [#81](https://github.com/elixir-lsp/vscode-elixir-ls/pull/81)
- Make `%` a dedicated punctuation scope in elixir syntax file (thanks [Dusty Pomerleau](https://github.com/dustypomerleau)) [#72](https://github.com/elixir-lsp/vscode-elixir-ls/pull/72)
- Migrate generated tasks.json to 2.0.0 syntax (thanks [Dusty Pomerleau](https://github.com/dustypomerleau)) [#71](https://github.com/elixir-lsp/vscode-elixir-ls/pull/71)
- Improve development instructions (thanks [Tan Jay Jun](https://github.com/jayjun)) [#97](https://github.com/elixir-lsp/vscode-elixir-ls/pull/97)
- Activate extension whenever workspace contains elixir files (thanks [Jason Axelson](https://github.com/axelson)) [#107](https://github.com/elixir-lsp/vscode-elixir-ls/pull/107)
- Make heredocs and most sigils auto-close when used with quotes and triple quotes (thanks [Jarrod Davis](https://github.com/jarrodldavis)) [#101](https://github.com/elixir-lsp/vscode-elixir-ls/pull/101)
- Set a default for `elixirLS.projectDir` (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#112](https://github.com/elixir-lsp/vscode-elixir-ls/pull/112)
- Support setting `elixirLS.mixTarget` to include target specific dependencies, like with Nerves (thanks [Jon Carstens](https://github.com/jjcarstens)) [#108](https://github.com/elixir-lsp/vscode-elixir-ls/pull/108)

### v0.4.0: 16 May 2020

Improvements:
- Add autocompletion of struct fields on a binding when we know for sure what type of struct it is. (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#202](https://github.com/elixir-lsp/elixir-ls/pull/202)
  - For details see the [Code Completion section of the readme](https://github.com/elixir-lsp/elixir-ls/tree/a2a1f38bf0f47e074ec5d50636d669fae03a3d5e#code-completion)
- Normalize compiler warnings and associate them with templates (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#241](https://github.com/elixir-lsp/elixir-ls/pull/241)
- Add all core elixir apps to the Dialyzer PLT. (thanks [Eric Entin](https://github.com/ericentin)) [#225](https://github.com/elixir-lsp/elixir-ls/pull/225)
- Change "did not receive workspace/didChangeConfiguration" log level from warning to info (thanks [Jason Axelson](https://github.com/axelson)) [#222](https://github.com/elixir-lsp/elixir-ls/pull/222)
- Automatically create a `.gitignore` file inside the `.elixir-ls` dir so that users do not need to manually add it to their gitignore (thanks [Thanabodee Charoenpiriyakij](https://github.com/wingyplus)) [#232](https://github.com/elixir-lsp/elixir-ls/pull/232)
- Dialyzer provider shouldn't track removed files and modules (thanks [Michał Szajbe](https://github.com/szajbus)) [#237](https://github.com/elixir-lsp/elixir-ls/pull/237)
- Load all modules after first build (thanks [Akash Hiremath](https://github.com/akash-akya)) [#227](https://github.com/elixir-lsp/elixir-ls/pull/227)

Bug Fixes:
- Dialyzer: Get beam file for preloaded modules. (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#218](https://github.com/elixir-lsp/elixir-ls/pull/218)
- Warn when using the debugger on Elixir 1.10.0-1.10.2. (thanks [Jason Axelson](https://github.com/axelson)) [#221](https://github.com/elixir-lsp/elixir-ls/pull/221)
- Don't return snippets to clients that don't declare `snippetSupport` for function completions (thanks [Jeffrey Xiao](https://github.com/jeffrey-xiao)) [#223](https://github.com/elixir-lsp/elixir-ls/pull/223)

VSCode:
- Add basic support for `.html.leex` files for Phoenix LiveView (thanks [oskarkook](https://github.com/oskarkook)) [#82](https://github.com/elixir-lsp/vscode-elixir-ls/pull/82)
- Add filetype and watcher for `.html.leex` files for Phoenix LiveView (thanks [Byron Hambly](https://github.com/delta1)) [#83](https://github.com/elixir-lsp/vscode-elixir-ls/pull/83)
- Better phoenix templates support (thanks [Marlus Saraiva](https://github.com/msaraiva)) [#93](https://github.com/elixir-lsp/vscode-elixir-ls/pull/93)

VSCode potentially breaking changes:
- Change language id to be lowercase kebab-case in accordance with [VSCode guidelines](https://code.visualstudio.com/docs/languages/identifiers#_new-identifier-guidelines). This also fixes an issue displaying the elixir logo for html.eex files. (thanks [Matt Furden](https://github.com/zolrath)) [#87](https://github.com/elixir-lsp/vscode-elixir-ls/pull/87)
  - This changes the language id's `EEx`->`eex` and `HTML (EEx)`->`html-eex`
  - If you have customized your emmet configuration configuration then you need to update it:
  - Open VSCode and hit `Ctrl+Shift+P` or `Cmd+Shift+P` and type `"Preference: Open Settings (JSON)"`
  - Add or edit your `emmet.includedLanguages` to include the new Language Id:
```json
"emmet.includeLanguages": {
  "html-eex": "html"
}
```

If you have eex file associations in your settings.json then remove them:
```
"files.associations": {
  "*.html.eex": "HTML (EEx)", // remove this
  "*.html.leex": "HTML (EEx)" // remove this
},
```

### v0.3.3: 15 Apr 2020

Meta:
- The original repository at [JakeBecker](https://github.com/JakeBecker)/[elixir-ls](https://github.com/JakeBecker/elixir-ls) has now been deprecated in favor of [elixir-lsp](https://github.com/elixir-lsp)/[elixir-ls](https://github.com/elixir-lsp/elixir-ls). Any IDE extensions that use ElixirLS should switch to using this repository. The ["ElixirLS Fork"](https://marketplace.visualstudio.com/items?itemName=elixir-lsp.elixir-ls) extension on the VS Code marketplace will be deprecated, and updates will continue at the [original ElixirLS extension](https://marketplace.visualstudio.com/items?itemName=JakeBecker.elixir-ls)

Improvements:
- Return the type of function/macro in DocumentSymbols provider (e.g. `def`, `defp`, `defmacro`) (thanks [Jason Axelson](https://github.com/axelson)) [#189](https://github.com/elixir-lsp/elixir-ls/pull/189)
- Return `deprecated` flag or completion tag on completion items for clints that declare `deprecatedSupport` or `tagSupport` in complete provider (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#180](https://github.com/elixir-lsp/elixir-ls/pull/180)

Bug Fixes:
- Fix `textDocument/documentSymbol` on a non-fully initialized server (thanks [Jason Axelson](https://github.com/axelson)) [#173](https://github.com/elixir-lsp/elixir-ls/pull/173)
- Don't return snippets to clients that don't declare `snippetSupport` for completions (thanks [Jason Axelson](https://github.com/axelson)) [#177](https://github.com/elixir-lsp/elixir-ls/pull/177)
- Handle an exception that was raised in the DocumentSymbols provider (thanks [Jason Axelson](https://github.com/axelson)) [#179](https://github.com/elixir-lsp/elixir-ls/pull/179)
- Fix support for environments (such as Docker Alpine linux) that do not have bash (thanks [Cees de Groot](https://github.com/cdegroot)) [#190](https://github.com/elixir-lsp/elixir-ls/pull/190)
- Handle syntax errors without raising an exception (thanks [Jason Axelson](https://github.com/axelson)) [#186](https://github.com/elixir-lsp/elixir-ls/pull/186) [#192](https://github.com/elixir-lsp/elixir-ls/pull/192)
- Workspace symbols handle module unloading during compilation without bringing down the server (thanks [Jason Axelson](https://github.com/axelson)) [#191](https://github.com/elixir-lsp/elixir-ls/pull/191)

VSCode:
- Change: Upgrade vscode-languageclient to 6.1.3 to support Language Server Protocol 3.15 (thanks [Łukasz Samson](https://github.com/lukaszsamson)) [#64](https://github.com/elixir-lsp/vscode-elixir-ls/pull/64)

### v0.3.2: 28 Mar 2020

Improvements:
- Bump ElixirSense
  - Fixes find all references doesn't work with argument defaults [#150](https://github.com/elixir-lsp/elixir-ls/issues/150)
  - Adds erlang edoc support [elixir_sense #86](https://github.com/elixir-lsp/elixir_sense/pull/86)
- Improvements to complete provider (thanks to [Łukasz Samson](https://github.com/lukaszsamson)) [#159](https://github.com/elixir-lsp/elixir-ls/pull/159)
  - Better handling when file fails to parse
  - Remove no longer necessary workaround that prevented completing default `@` (such as `@doc` or `@external_resource`)
  - Add more keywords
  - Trim spaces
- Use lower compression level to speed up dialyzer manifest writing (thanks to [hworld](https://github.com/hworld)) [#164](https://github.com/elixir-lsp/elixir-ls/pull/164)

Bug Fixes:
- Fix dialyzer errors not being reported for umbrella projects [#149](https://github.com/elixir-lsp/elixir-ls/pull/149) (thanks [hworld](https://github.com/hworld))
- Fix dialyzer checking files that have not changed which gives a good speedup [#165](https://github.com/elixir-lsp/elixir-ls/pull/165) (thanks [hworld](https://github.com/hworld))

VSCode:
- Change: No longer override default value of `editor.acceptSuggestionOnEnter` [vscode-elixir-ls #53](https://github.com/elixir-lsp/vscode-elixir-ls/pull/53)
- Change: Warn when incompatible extensions are installed [vscode-elixir-ls #57](https://github.com/elixir-lsp/vscode-elixir-ls/pull/57)

### v0.3.1: 3 Mar 2020

Improvements:

- Do not highlight function calls the same as function definitions [vscode-elixir-ls #40](https://github.com/elixir-lsp/vscode-elixir-ls/pull/40) (thanks [Jason Axelson](https://github.com/axelson))
- Code lens is returned in more situations [#122](https://github.com/elixir-lsp/elixir-ls/pull/122) (thanks [Łukasz Samson](https://github.com/lukaszsamson))
- Properly support requests without params (fixes shutdown in vim-lsc) [#139](https://github.com/elixir-lsp/elixir-ls/pull/139) (thanks [Brad Folkens](https://github.com/bfolkens))

Bug Fixes:
- Fix the debugger [#143](https://github.com/elixir-lsp/elixir-ls/pull/143)
- textDocumentSync save match spec (fixes error notice in vim-lsp) [#144](https://github.com/elixir-lsp/elixir-ls/pull/144) (thanks [N. G. Scheurich](https://github.com/ngscheurich))

### v0.3.0: 14 Feb 2020

Major Improvements:

- Add workspaceSymbol support to quickly navigate to modules, functions, callbacks etc (thanks to [Łukasz Samson](https://github.com/lukaszsamson)) [#110](https://github.com/elixir-lsp/elixir-ls/pull/110)
- Provide completions for protocol functions (thanks to [Łukasz Samson](https://github.com/lukaszsamson)) [#83](https://github.com/elixir-lsp/elixir-ls/pull/83)
- Upgrade ElixirSense (thanks to [Jason Axelson](https://github.com/axelson)) [#82](https://github.com/elixir-lsp/elixir-ls/pull/82)
  - Main changes: return results by arity, return all type signatures, typespec and dialyzer fixes

Improvements:

- Update dialyxir to 1.0.0-rc.7
- Improvements to `textDocument/documentSymbol`, now `DocumentSymbol` is returned instead of the more simplistic `SymbolInformation` (thanks to [Łukasz Samson](https://github.com/lukaszsamson) and [kent-medin](https://github.com/kent-medin)) [#76](https://github.com/elixir-lsp/elixir-ls/pull/76)
- Support asdf-vm in wrapper scripts (thanks to [Cees de Groot](https://github.com/cdegroot)) [#78](https://github.com/elixir-lsp/elixir-ls/pull/78)
- Update startup message (thanks to [Ahmed Hamdy](https://github.com/shakram02)) [#85](https://github.com/elixir-lsp/elixir-ls/pull/85)
- Add didSave to server capabilities (thanks to [Jonáš Trantina](https://github.com/Coffei)) [#86](https://github.com/elixir-lsp/elixir-ls/pull/86)

Potentially Breaking Changes:

- `language_server.sh` and `debugger.sh` run bash instead of `sh` (this is expected to break very few setups, if any) [#118](https://github.com/elixir-lsp/elixir-ls/pull/118)

### v0.2.28: 16 Nov 2019

- Fix debugger tasks not continuing to run on Elixir 1.9 (thanks to [joshua-andrassy](https://github.com/joshua-andrassy) for doing the legwork)
  - Fixes [JakeBecker/elixir-ls#194](https://github.com/JakeBecker/elixir-ls/issues/194) and [JakeBecker/elixir-ls#185](https://github.com/JakeBecker/elixir-ls/issues/185)
- Improve supervision tree when writing dialyzer manifest files

VSCode:

- Add syntax rules for function calls [vscode-elixir-ls #15](https://github.com/elixir-lsp/vscode-elixir-ls/pull/15) (thanks [CaiqueMitsuoka](https://github.com/CaiqueMitsuoka))

### v0.2.27: 14 Nov 2019

VSCode:

- Fix missing comma issue in the language configuration [#16](https://github.com/elixir-lsp/vscode-elixir-ls/pull/16)
- Add some basic configuration for HTML (EEx) files [#14](https://github.com/elixir-lsp/vscode-elixir-ls/pull/14) (thanks [@J3RN](https://github.com/J3RN))
- Fix exceptions raised when running on Erlang 20 and 21 [#65](https://github.com/elixir-lsp/elixir-ls/issues/65)

### v0.2.26: 4 Sept 2019

- Dialyxir new 1.0-rc formatting support
- `can_format/2` now case-insensitive (fixes formatting on Mac OS X)
- `defdelegate` snippet is now syntactically correct (was previously missing a comma)
- `workspace/didChangeConfiguration` handles `null` now (fixes [eglot](https://github.com/joaotavora/eglot) support)
- Update elixir_sense
- Watch LiveView .leex files
- Change 'dialyzerFormat' default setting to `"dialyxir_long"`

### v0.2.25: 23 May 2019

- Fix compatibility with Elixir 1.9
- Fix bug where Mix file is not reloaded on change if it had errors
- Remove unnecessary empty parens from suggested specs
- Add 'dialyzerFormat' setting to select which warning formatter to use. Options are `"dialyzer"` (default), `"dialyxir_short"`, `"dialyxir_long"`
- (VS Code) Support syntax highlighting in Phoenix LiveView (.leex) files, including ~L sigil (Thanks to @rrichardsonv)
- (VS Code) Improved syntax highlighting and other automatic behavior (Thanks to @crbelaus)
- Fix crash when yecc grammar file has conflicts
- Dialyzer robustness improvements
- When autocompleting a function name with cursor immediately prior to a `(`, don't insert additional parens and argument list

### v0.2.24: 15 Oct 2018

- Fix debugger crash in new versions of VS Code (Thanks to @martin-watts)
- Minor improvements to logs and error messages

### v0.2.23: 05 Aug 2018

- Fix crashes caused by the new spec suggestions feature
- Fix showing of @spec suggestions on newly opened files

### v0.2.22: 03 Aug 2018

- Fix crash in Dialyzer when stale-checking beam files takes too long
- Fix documentation and arg names in suggestions for Elixir 1.7
- Formatter response is now incremental instead of replacing the entire document text
- New feature: Autocomplete suggestions for struct field names (Thanks to @msaraiva/elixir_sense)
- New feature: Suggest @spec annotations using Dialyzer's inferred success typings. To turn it off, set `elixirLS.suggestSpecs: false`

### v0.2.21: 13 Jul 2018

- Print PATH to developer console if "elixir" command fails
- Fix Dialyzer crash when some modules are undialyzable

### v0.2.20: 13 Jul 2018

- Skipped because I got my versions out of sync :/

### v0.2.19: 06 Jul 2018

- Fix compatibility issues with recent Elixir versions (1.7.0-dev) and Erlang OTP 21
- Go-to-definition now works for variables (thanks to [Elixir Sense](https://github.com/msaraiva/elixir_sense))
- Better error messages when server crashes or fails to launch

### v0.2.18: 19 Mar 2018

- Fix autocomplete bugs when typing in parentheses
- Copy latest syntax highlighting from fr1zle/vscode-elixir
- Handle `subdirectories` and `import_deps` in `.formatter.exs`. Requires the latest Elixir (1.6.5), which you can install via kiex with `kiex install master` prior to its release.

### v0.2.17: 9 Mar 2018

- New feature: Automatically fetch deps when compiling. Set `elixirLS.fetchDeps` to `false` to disable
- New feature: Incremental text synchronization
- Minor improvements to autocomplete and automatic block closing

### v0.2.16: 7 Mar 2018

- New feature: Smart automatic insertion of "end" when beginning a block. This replaces the autocomplete-based approach and fixes the very annoying completion of "->" with "end" when not appropriate
- ** ACCEPT AUTOCOMPLETE SUGGESTIONS WITH TAB INSTEAD OF ENTER.** See readme for an explanation of why. You can change it back if you really want.
- Change default settings to automatically trim trailing whitespace and add newline at end of file
- Don't trigger autocomplete on "\_" because you're usually just naming an unused variable

### v0.2.15: 6 Mar 2018

- Improve autocomplete and re-enable quickSuggestions by default

### v0.2.14: 3 Mar 2018

- Fix failures to launch in some projects

### v0.2.13: 2 Mar 2018

- New feature: Find references to modules and functions (Thanks to @mattbaker)
- New feature: Find symbols in document (Thanks to @mattbaker)
- Fix failure to launch if project prints anything to stdout in the mixfile

### v0.2.12: 22 Feb 2018

- Fix bug where Dialyzer warnings sometimes remain after being fixed
- Override build directory to ".elixir_ls/build" as [recommended by José Valim](https://github.com/elixir-lang/elixir/issues/7356#issuecomment-366644546)
- Fix restart button in debugger

### v0.2.11: 31 Jan 2018

- Improve syntax highlighting (Thanks to @TeeSeal)

### v0.2.10: 24 Jan 2018

- Fix builds and related features on Windows

### v0.2.9: 29 Nov 2017

- Fix autocomplete not firing after "."

### v0.2.8: 29 Nov 2017

- Add auto-indentation rules (copied from
  [fr1zle/vscode-elixir](https://github.com/fr1zle/vscode-elixir))
- Disable `editor.quickSuggestions` by default so autocomplete suggestions are
  triggered automatically only when after a ".". This is nice because the
  language server irritatingly tries to auto-complete things like "do" or "else"
  if they come at the end of a line.
- Add configuration option "mixEnv" to set the Mix environment used when
  compiling. It now defaults to "test" instead of "dev" to aid in TDD and to
  avoid interfering with the Phoenix dev server.
- Add configuration option "projectDir" for when your Mix project is in a
  subdirectory instead of the workspace root.
- Add debug launch configuration option "env" to set environment variables
  (including `MIX_ENV`)
- Add debug launch configuration option "excludeModules" to avoid interpreting
  modules. This is important if for modules that contain NIFs which can't be
  debugged.

### v0.2.7: 9 Nov 2017

- Read formatter options from `.formatter.exs` in project root instead of
  including line length in extension config options

### v0.2.6: 3 Nov 2017

- Don't focus Output pane on errors because request handler errors are common
  and recoverable

### v0.2.5: 3 Nov 2017

- Improve error output in debugger and fix failures to launch debugger

### v0.2.4: 25 Oct 2017

- Package ElixirLS as .ez archives instead of escripts. This should make `asdf`
  installs work.
- Fix debugger error logging when initialize fails
- Fix timeouts when calling back into the language server with build or dialyzer
  results

### v0.2.3: 24 Oct 2017

- Fix failing debugger launch
- Fix segfaults in OTP 20 caused by regexes precompiled in OTP 19

### v0.2.2: 19 Oct 2017

- Fix launch on Windows when there are spaces in the path

### v0.2.1: 19 Oct 2017

- Fix bug where deps are recompiled after every change
- Update README
- Update syntax highlighting (merged from fr1zle/vscode-elixir)

### v0.2.0: 17 Oct 2017

- Rewritten build system to make use of Elixir 1.6 compiler diagnostics
- Code formatting in Elixir 1.6
- Automatic dialyzer server in Erlang/OTP 20
- Lots and lots of refactoring

### v0.0.9: 23 Jun 2017

- Revert to building with Erlang OTP 19.2 instead of 20.0. It seems that
  escripts built with 20.0 won't run on 19.2 runtimes.
- Fix handling of Windows paths with non-default drive letter

### v0.0.8: 23 Jun 2017

- Enable setting breakpoints in Erlang modules

### v0.0.7: 12 Jun 2017

- Fix launching of debugger on OSX (when working directory is not set to the
  extension directory)
- Fix launching of language server when Elixir is installed with "asdf" tool.
  (Fix in 0.0.6 didn't actually work)

### v0.0.6: 12 Jun 2017

- Handle Elixir installations that were done via the "asdf" tool

### v0.0.5: 11 Jun 2017

- Windows support

### v0.0.4: 10 Jun 2017

- Updated ElixirLS to package its apps as escripts and updated client to handle
  it. This should fix the error `(Mix) Could not start application language_server: could not find application file: language_server.app`.
  Windows, however, is still broken.
- Began a changelog :)
