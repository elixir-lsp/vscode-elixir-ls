# Mix.install([
#   {:elixir_ls, github: "elixir-lsp/elixir-ls", ref: "7f7ba8ac7ad518945f7622369d13c16f48568b30"}
# ])

Mix.install(
  [
    {:elixir_ls, path: "#{__DIR__}/../elixir-ls"},
  ],
  config_path: "#{__DIR__}/../elixir-ls/config/config.exs",
  lockfile: "#{__DIR__}/../elixir-ls/mix.lock"
)

# Mix.install(
#   [
#     {:language_server, path: "#{__DIR__}/../elixir-ls/apps/language_server"},
#   ],
#   config_path: "#{__DIR__}/../elixir-ls/config/config.exs",
#   lockfile: "#{__DIR__}/../elixir-ls/mix.lock"
# )
