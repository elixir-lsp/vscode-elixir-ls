# Open a Mix project

ElixirLS activates when it finds a Mix project — a folder containing a `mix.exs`
file.

1. Open the folder that contains your project's `mix.exs`
   (**File → Open Folder…**). ElixirLS starts automatically.
2. On first start it fetches dependencies and compiles the project, so initial
   indexing can take a while. Subsequent starts are incremental and much faster.

> **Workspace Trust:** ElixirLS compiles your project, which executes code from the
> project **and all of its dependencies** (macros, `mix.exs`, and dependency build
> scripts run at compile time). For that reason the extension only runs in
> [trusted workspaces](https://code.visualstudio.com/docs/editor/workspace-trust).
> Only trust projects whose sources — and dependencies — you trust.

**Monorepos / nested projects:** if your `mix.exs` is not at the workspace root,
set `elixirLS.projectDir` (covered in the next step).
