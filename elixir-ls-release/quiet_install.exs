if System.get_env("ELS_LOCAL") == "1" do
  dir = Path.expand("#{__DIR__}/../elixir-ls")
  IO.puts(:stderr, "Starting local ElixirLS install from #{dir}")
  IO.puts(:stderr, "Running in #{File.cwd!}")
  Mix.install(
    [
      {:elixir_ls, path: dir},
    ],
    # force: true,
    config_path: Path.join(dir, "config/config.exs"),
    lockfile: Path.join(dir, "mix.lock")
  )
else
  IO.puts(:stderr, "Starting ElixirLS release #{System.get_env("ELS_RELEASE")}")
  IO.puts(:stderr, "Running in #{File.cwd!}")
  Mix.install([
    {:elixir_ls, github: "elixir-lsp/elixir-ls", tag: System.get_env("ELS_RELEASE")}
  ])
end
