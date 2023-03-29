defmodule Execute do
  def target("prepare") do
    :ok = git_update()
    :ok = npm_install()
    :ok = elixir_ls_mix_deps_get()
    :ok = tsc_compile()
  end

  def target("compile") do
    #  "compile": "tsc -p ./ && cd elixir-ls && MIX_ENV=prod mix elixir_ls.release -o ../elixir-ls-release",
    :ok = tsc_compile()
    :ok = elixir_ls_prod_release()
  end

  def target("prepublish") do
    # #!/usr/bin/env bash
    # set -e

    # tsc -p ./
    # cd elixir-ls
    # mix deps.get
    # mix elixir_ls.release -o ../elixir-ls-release
    :ok = tsc_compile()
    :ok = elixir_ls_mix_deps_get()
    :ok = elixir_ls_prod_release() # Assuming we also do it with MIX_ENV=prod
  end

  def git_update() do
    {_, 0} =
      System.shell("git submodule update --init --recursive",
        into: IO.stream()
      )

    :ok
  end

  def npm_install() do
    {_, 0} =
      System.shell("npm install",
        into: IO.stream()
      )

    :ok
  end

  def elixir_ls_mix_deps_get() do
    {_, 0} =
      System.cmd("mix", ["deps.get"], cd: "elixir-ls", into: IO.stream())

    :ok
  end

  def elixir_ls_prod_release() do
    # cd elixir-ls && MIX_ENV=prod mix elixir_ls.release -o ../elixir-ls-release",
    {_, 0} =
      System.cmd("mix", ["elixir_ls.release", "-o", "../elixir-ls-release"],
       env: [{"MIX_ENV", "prod"}],
       cd: "elixir-ls",
       into: IO.stream())

    :ok
  end

  def tsc_compile() do
    {_, 0} =
      System.shell("tsc -p ./",
        into: IO.stream()
      )

    :ok
  end


end

if length(System.argv()) == 0 do
  raise "provide target: prepare | compile | prepublish"
end

[target | _] = System.argv()

:ok = Execute.target(target)
