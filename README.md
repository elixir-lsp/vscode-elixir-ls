# ElixirLS: Elixir support and debugger for VS Code [![Actions Status](https://github.com/elixir-lsp/vscode-elixir-ls/workflows/CI/badge.svg)](https://github.com/elixir-lsp/vscode-elixir-ls/actions)

Provides Elixir language support and debugger. This extension is powered by the [Elixir Language Server (ElixirLS)](https://github.com/elixir-lsp/elixir-ls), an Elixir implementation of Microsoft's IDE-agnostic [Language Server Protocol](https://github.com/Microsoft/language-server-protocol) and [VS Code debug protocol](https://code.visualstudio.com/docs/extensionAPI/api-debugging). Visit its page for more information. For a guide to debugger usage in Elixir, read [this blog post](https://medium.com/@JakeBeckerCode/debugging-elixir-in-vs-code-400e21814614).

Features include:

- Debugger support (requires Erlang >= OTP 19)
- Automatic, incremental Dialyzer analysis (requires Erlang OTP 20)
- Automatic suggestion for @spec annotations based on Dialyzer's inferred success typings
- Inline reporting of build warnings and errors (requires Elixir >= 1.7)
- Code completion **(suggestions are accepted using tab instead of enter, see below)**
- Smart automatic closing of code blocks
- Documentation lookup on hover
- Go-to-definition
- Code formatter (requires Elixir >= 1.7. Triggered by `Alt + Shift + F` hotkey or enabling `editor.formatOnSave`)
- Find references to functions and modules (Thanks to @mattbaker)
- Quick symbol lookup in file (Thanks to @mattbaker)

![Screenshot](https://raw.githubusercontent.com/elixir-lsp/elixir-ls/master/images/screenshot.png)

## The reason for this fork

This fork started when [Jake Becker's repository](https://github.com/JakeBecker/vscode-elixir-ls) became inactive for an extended period of time. So we decided to start an active fork to merge dormant PR's and fix issues where possible. We also believe in an open and shared governance model to share the work instead of relying on one person to shoulder the whole burden.

## Default settings

ElixirLS is opinionated and sets the following default settings for Elixir files:

```
{
  // Based on Elixir formatter's style
  "editor.insertSpaces": true,
  "editor.tabSize": 2,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,

  // Provides smart completion for "do" and "fn ->" blocks. Does not run the Elixir formatter.
  "editor.formatOnType": true,

  // Misc
  "editor.wordBasedSuggestions": false,
  "editor.trimAutoWhitespace": false,

  // See below
  "editor.acceptSuggestionOnEnter": "off"
}
```

You can, of course, change them in your user settings, or on a per project basis in `.vscode/settings.json`.

It may take some getting used to, but I highly recommend leaving `acceptSuggestionOnEnter` off and using using `tab` instead of `enter` for autocomplete. In Elixir, it's very common to end a line with an identifier (such as `:error`, for example), and ElixirLS will sometimes try to autocomplete that (into `:error_handler` or `:error_logger`, for example). If you're typing quickly, you may hit enter before even noticing the suggestion and insert it by mistake. Automatic completion of `do` blocks is handled separately and does not require you to accept an autocomplete suggestion.

## Supported versions

See [ElixirLS](https://github.com/elixir-lsp/elixir-ls) for details on the supported Elixir and Erlang versions.

## Contributing

Most of the functionality of this extension comes from ElixirLS which is included as a Git submodule in the `elixir-ls` folder. Make sure you clone the repo using `git clone --recursive` or run `git submodule init && git submodule update` after cloning. To launch the extension from VS Code, run the "Launch Extension" launch config.

Including `elixir-ls` as a submodule makes it easy to develop and test code changes for ElixirLS itself. If you want to modify ElixirLS, not just its VS Code client code, you'll want to fork the [ElixirLS](https://github.com/elixir-lsp/elixir-ls) repo on Github and push any changes you make to the ElixirLS submodule to your fork. An example of how that might look:

```
# Clone this repo recursively to ensure you get the elixir-ls submodule
git clone --recursive git@github.com:elixir-lsp/vscode-elixir-ls.git

# Enter the submodule directory. Now, if you run git commands, they run in the submodule
cd vscode-elixir-ls/elixir-ls

# Create your feature branch
git checkout -b my_new_branch

# Add your forked elixir-ls repository as a remote
git remote add my_fork git@github.com:<your_github_username>/elixir-ls.git

# Make changes in the elixir-ls folder, commit them, and push to your forked repo
git commit ...
git push my_fork my_new_branch
```

You can build and install the extension locally using `vsce` command and `code` CLI.

```
# Install JS dependencies
npm i

# Build the extension
vsce package

# Install it locally
code --install-extension *.vsix --force
```

Note that if you have the extension installed from the Visual Studio Marketplace and are also installing a locally
built package, you may need to disable the `Extensions: Auto Check Updates` setting to prevent your
local install from being replaced with the Marketplace version.

### Running the tests locally

You should ensure that the tests run locally before submitting a PR, and if relevant add automated tests in the PR.

```
npm install
npm run compile
npm test
```

## Acknowledgements and related projects

There is another VS Code extension for Elixir, [VSCode Elixir](https://github.com/fr1zle/vscode-elixir). It's powered by [Elixir Sense](https://github.com/msaraiva/elixir_sense), another language "smartness" server similar to ElixirLS. Much of this extension's client code (such as syntax highlighting) was copied directly from VSCode Elixir, for which they deserve all the credit.
