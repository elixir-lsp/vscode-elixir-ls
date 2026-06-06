# Debug your code

ElixirLS ships a debug adapter for Mix tasks, built on Erlang's `:int` interpreter.

1. Open the **Run and Debug** view (the play-with-bug icon), or use the button
   below.
2. Create a `launch.json` and pick **Elixir Mix** (type `mix_task`), or start from
   one of the provided configurations:
   - **mix (Default task)** — runs `mix run`.
   - **mix test** — runs your test suite under the debugger.
3. Set breakpoints in your `.ex` files and start debugging.

Key things to know:

- Only **interpreted** modules appear in the debugger stack. By default ElixirLS
  interprets all project modules; for large projects you can narrow this with
  `debugAutoInterpretAllModules: false` plus `debugInterpretModulesPatterns`.
- Modules with NIFs cannot be interpreted — list them in `excludeModules`.
- For Phoenix and other app-dependent tests, set `startApps: true`.
- `Kernel.dbg/2` breaks into the debugger by default (`breakOnDbg`).
