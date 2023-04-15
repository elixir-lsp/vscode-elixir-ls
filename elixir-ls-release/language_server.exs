if System.get_env("ELS_LOCAL") == "1" do
  dir = Path.expand("#{__DIR__}/../elixir-ls")
  Mix.install(
    [
      {:elixir_ls, path: dir},
    ],
    config_path: Path.join(dir, "config/config.exs"),
    lockfile: Path.join(dir, "mix.lock")
  )
else
  Mix.install([
    {:elixir_ls, github: "elixir-lsp/elixir-ls", tag: System.get_env("ELS_RELEASE")}
  ])
end


ElixirLS.LanguageServer.CLI.main()
