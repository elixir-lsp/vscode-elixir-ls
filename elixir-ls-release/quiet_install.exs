# Put mix into quiet mode so it does not print anything to standard out
# especially it makes it surface git command errors such as reported in
# https://github.com/elixir-lsp/vscode-elixir-ls/issues/320
# to standard error
# see implementation in
# https://github.com/elixir-lang/elixir/blob/6f96693b355a9b670f2630fd8e6217b69e325c5a/lib/mix/lib/mix/scm/git.ex#LL304C1-L304C1
Mix.start
Mix.shell(Mix.Shell.Quiet)

if System.get_env("ELS_LOCAL") == "1" do
  dir = Path.expand("#{__DIR__}/../elixir-ls")
  IO.puts(:stderr, "Starting local ElixirLS install from #{dir}")
  IO.puts(:stderr, "Running in #{File.cwd!}")
  Mix.install(
    [
      {:elixir_ls, path: dir},
    ],
    # force: true,
    consolidate_protocols: false,
    config_path: Path.join(dir, "config/config.exs"),
    lockfile: Path.join(dir, "mix.lock")
  )
else
  IO.puts(:stderr, "Starting ElixirLS release #{System.get_env("ELS_RELEASE")}")
  IO.puts(:stderr, "Running in #{File.cwd!}")
  Mix.install([
    {:elixir_ls, github: "elixir-lsp/elixir-ls", tag: System.get_env("ELS_RELEASE")},
    consolidate_protocols: false
  ])
end
