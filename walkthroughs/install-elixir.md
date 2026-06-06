# Install Elixir & Erlang/OTP

ElixirLS runs against the Elixir and Erlang/OTP installed on your machine — it does
not bundle them.

1. Install **Erlang/OTP** and **Elixir** using your preferred method:
   - A version manager such as [asdf](https://asdf-vm.com/),
     [mise](https://mise.jdx.dev/), or [`kerl`](https://github.com/kerl/kerl) /
     [`kiex`](https://github.com/taylor/kiex) (recommended — lets you match each
     project's required versions).
   - Or the official [Elixir install guide](https://elixir-lang.org/install.html).
2. Verify the tools are on your `PATH`:

   ```sh
   elixir --version
   ```

   This should print both the Elixir and the Erlang/OTP version.

> Tip: ElixirLS picks up the `elixir` and `mix` found on the `PATH` of the
> environment VS Code is launched from. If you use a version manager, make sure its
> shims are initialized for that environment.
