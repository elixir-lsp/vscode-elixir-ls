# Configure ElixirLS

ElixirLS works out of the box, but a few settings are worth knowing about. Open the
settings UI filtered to ElixirLS with the button below, or run
**Preferences: Open Settings** and search for `elixirLS`.

Commonly adjusted settings:

- **`elixirLS.projectDir`** — subdirectory containing your `mix.exs` when it is not
  at the workspace root (umbrella apps, monorepos).
- **`elixirLS.mixEnv`** / **`elixirLS.mixTarget`** — the `MIX_ENV` / `MIX_TARGET`
  used for compilation (`MIX_ENV` defaults to `test`, `MIX_TARGET` to `host`).
- **`elixirLS.dialyzerEnabled`** — enable/disable Dialyzer (see the Dialyzer step).
- **`elixirLS.fetchDeps`** — automatically fetch dependencies on compile.
- **`elixirLS.envVariables`** — extra environment variables for compilation.

Settings are `resource`-scoped, so you can override them per workspace folder in a
multi-root setup.
