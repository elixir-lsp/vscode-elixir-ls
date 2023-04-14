if System.get_env("ELS_LOCAL") == "1" do
  Mix.install(
    [
      {:elixir_ls, path: "#{__DIR__}/../elixir-ls"},
    ],
    config_path: "#{__DIR__}/../elixir-ls/config/config.exs",
    lockfile: "#{__DIR__}/../elixir-ls/mix.lock"
  )
else
  Mix.install([
    {:elixir_ls, github: "elixir-lsp/elixir-ls", tag: System.get_env("ELS_RELEASE")}
  ])
end
