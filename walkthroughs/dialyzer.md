# Enable Dialyzer (optional)

ElixirLS includes an integrated, incremental [Dialyzer](https://www.erlang.org/doc/man/dialyzer)
that surfaces type discrepancies as you work.

- **`elixirLS.dialyzerEnabled`** — turn Dialyzer on or off (on by default).
- **`elixirLS.dialyzerWarnOpts`** — enable or disable individual warning categories.
- **`elixirLS.dialyzerFormat`** — choose the warning format
  (`dialyzer`, `dialyxir_short`, `dialyxir_long`).
- **`elixirLS.suggestSpecs`** — inline `@spec` suggestions from Dialyzer's inferred
  success typings.

The first Dialyzer run builds a PLT for your project and dependencies and can take
several minutes; later runs are incremental and only re-analyze what changed.

Use the button below to jump to these settings.
