# ElixirLS: Elixir support and debugger for VS Code

Provides Elixir language support and debugger. This extension is powered by the [Elixir Language Server (ElixirLS)](https://github.com/JakeBecker/elixir-ls), an Elixir implementation of Microsoft's IDE-agnostic [Language Server Protocol](https://github.com/Microsoft/language-server-protocol) and [VS Code debug protocol](https://code.visualstudio.com/docs/extensionAPI/api-debugging). Visit its page for more information. For a guide to debugger usage in Elixir, read [this blog post](https://medium.com/@JakeBeckerCode/debugging-elixir-in-vs-code-400e21814614).

Features include:

- Debugger support (requires Erlang >= OTP 19)
- Automatic, incremental Dialyzer analysis (requires Erlang OTP 20)
- Inline reporting of build warnings and errors (requires Elixir >= 1.6)
- Documentation lookup on hover
- Go-to-definition
- Code completion (triggered by typing `SomeModule.` or hitting `Ctrl + Space`. You can enable `editor.quickSuggestions` for continuous autocompletion)
- Code formatter (requires Elixir >= 1.6. Triggered by `Alt + Shift + F` hotkey or enabling `editor.formatOnSave`)

![Screenshot](https://raw.githubusercontent.com/JakeBecker/elixir-ls/master/images/screenshot.png)

## Supported versions

Elixir:
- 1.4 minimum
- \>= 1.6 recommended. Required for reporting of build warnings and errors, and for code formatting support.

Erlang:
- OTP 18 minimum
- OTP 20 recommended. >= OTP 19 is required for debugger support, and OTP 20 is recommended for automatic incremental Dialyzer integration.

## Contributing

Most of the functionality of this extension comes from ElixirLS which is included as a Git submodule in the `elixir-ls` folder. Make sure you clone the repo using `git clone --recursive` or run `git submodule init && git submodule update` after cloning. To launch the extension from VS Code, run the "Launch Extension" launch config.

Including `elixir-ls` as a submodule makes it easy to develop and test code changes for ElixirLS itself. If you want to modify ElixirLS, not just its VS Code client code, you'll want to fork the [ElixirLS](https://github.com/JakeBecker/elixir-ls) repo on Github and push any changes you make to the ElixirLS submodule to your fork. An example of how that might look:

```
# Clone this repo recursively to ensure you get the elixir-ls submodule
git clone --recursive git@github.com:JakeBecker/vscode-elixir-ls.git

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

## Acknowledgements and related projects

There is another VS Code extension for Elixir, [VSCode Elixir](https://github.com/fr1zle/vscode-elixir). It's powered by [Elixir Sense](https://github.com/msaraiva/elixir_sense), another language "smartness" server similar to ElixirLS. Much of this extension's client code (such as syntax highlighting) was copied directly from VSCode Elixir, for which they deserve all the credit.
