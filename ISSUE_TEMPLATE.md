### Is this the right repo?

Most of the functionality for this extension comes from ElixirLS: https://github.com/elixir-lsp/elixir-ls

Please file your issue on this repo (vscode-elixir-ls) only if it has something to do with VS Code specifically and would not apply to other IDEs running ElixirLS. Otherwise, file it here: https://github.com/elixir-lsp/elixir-ls/issues

If the language server fails to launch, the problem is most likely in ElixirLS, so please file the issue on that repo.

### Environment

Most of this can be filled out by running the VSCode command (by default bound to Ctrl+Shift+P) "ElixirLS: Copy Debug Info"

- Elixir & Erlang versions (elixir --version):
- VSCode ElixirLS version:
- Operating System Version:

### Troubleshooting

- [ ] Restart your editor (which will restart ElixirLS) sometimes fixes issues
- [ ] Stop your editor, remove the entire `.elixir_ls` directory, then restart your editor

### Crash report template

_Delete this section if not reporting a crash_

1.  Create a new Mix project with `mix new empty`, then open that project with VS Code and open an Elixir file. Is your issue reproducible on the empty project? If not, please publish a repo on Github that does reproduce it.
2.  Check the output log by opening `View > Output` and selecting "ElixirLS" in the dropdown. Please include any output that looks relevant. (If ElixirLS isn't in the dropdown, the server failed to launch.)
3.  Check the developer console by opening `Help > Toggle Developer Tools` and include any errors that look relevant.
