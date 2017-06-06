# Elixir Language Server (ElixirLS)

*This project is in early alpha. It has only been tested with Elixir 1.4 on OSX. Wider support is intended soon.*

The Elixir Language Server provides a server that runs in the background, providing IDEs, editors, and other tools with information about Elixir Mix projects. It adheres to the [Language Server Protocol](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md), a standard supported by Microsoft and Red Hat for frontend-independant IDE support.

Features include:

- Debugger support!!!
- Inline reporting of build warnings and errors
- Documentation lookup on hover
- Go-to-definition
- Code completion

[screenshot]

ElixirLS is intended to be frontend-independent, but at this point has only been tested with VS Code. The VS Code plugin code is [here] and can be installed by searching "Elixir IDE" from the VS Code marketplace. The plugin repo includes this repository as a Git submodule -- if you want to try developing ElixirLS, the easiest way is to check out that repository and 

## Debugger support

ElixirLS includes debugger support adhering to the [VS Code debugger protocol](https://github.com/Microsoft/vscode/blob/master/src/vs/workbench/parts/debug/common/debugProtocol.d.ts) which is closely related to the Language Server Protocol. At the moment, only line breakpoints are supported.

When debugging in Elixir or Erlang, only modules that have been "interpreted" (using `:int.ni/1` or `:int.i/1`) will accept breakpoints or show up in stack traces. The debugger in ElixirLS automatically interprets all modules in the Mix project and dependencies prior to launching the Mix task, so you can set breakpoints anywhere in your project or dependency modules.

In order to debug modules in `.exs` files (such as tests), they must be specified under `requireFiles` in your launch configuration so they can be loaded and interpreted prior to running the task. For example, the default launch configuration for "mix test" in the VS Code plugin looks like this:

```
{
  "type": "mix_task",
  "name": "mix test",
  "request": "launch",
  "task": "test",
  "taskArgs": ["--trace"],
  "projectDir": "${workspaceRoot}",
  "requireFiles": [
    "test/**/test_helper.exs",
    "test/**/*_test.exs"
  ]
}
```

## Automatic builds and error reporting

In order to provide features like documentation look-up and code completion, ElixirLS needs to be able to load your project's compiled modules. ElixirLS attempts to compile your project automatically and reports build errors and warnings in the editor.

At the moment, this compilation is performed using a fork of Elixir 1.4's compiler. This is somewhat brittle, and making it more robust is a high priority in the near future. To avoid interfering with the developer's CLI workflow, ElixirLS creates a folder `.elixir_ls` in the project root and saves its build output there, so add `.elixir_ls` to your gitignore file.

Note that compiling untrusted Elixir files can be dangerous. Elixir can execute arbitrary code at compile time, which is how it can support such extensive metaprogramming. Consequently, compiling untrusted Elixir code is a lot like executing an untrusted script. Since ElixirLS compiles your code automatically, opening a project in an ElixirLS-enabled editor has the same risks as running `mix compile`. It's an unlikely attack vector, but worth being aware of.

## Acknowledgements and related projects

ElixirLS isn't the first frontend-independant server for Elixir language support. The original was [Alchemist Server](https://github.com/tonini/alchemist-server/), which powers the Alchemist plugin for Emacs. Another project, [Elixir Sense](https://github.com/msaraiva/elixir_sense), builds upon Alchemist and powers the [Elixir plugin for Atom](https://github.com/msaraiva/atom-elixir) as well as [another VS Code plugin](). ElixirLS uses Elixir Sense for several code insight features under-the-hood. Credit for those projects goes to their respective authors.