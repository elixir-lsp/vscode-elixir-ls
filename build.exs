defmodule Execute do
  @extension "JakeBecker.elixir-ls"

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

  def target("install") do
    :ok = npm_install()
    :ok = npx_vsce_package()
    :ok = code_install_extension_force()
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
      System.shell("mix deps.get", cd: "elixir-ls", into: IO.stream())

    :ok
  end

  def elixir_ls_prod_release() do
    # cd elixir-ls && MIX_ENV=prod mix elixir_ls.release -o ../elixir-ls-release",
    {_, 0} =
      System.shell("mix elixir_ls.release -o ../elixir-ls-release",
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

  def npx_vsce_package do
    {_, 0} =
      System.shell("npx @vscode/vsce package",
        into: IO.stream()
      )

    :ok
  end

  def code_install_extension_force do
    existing_version = parse_current_extension_version()
    version = package_json_version()
    {:ok, new_version} = Version.parse(version)

    if existing_version != "" do
      case Version.compare(new_version, existing_version) do
        :gt -> nil
        :eq -> IO.puts("warning: New plugin version #{new_version} (from package.json) equals already installed, expect slow installation")
        :lt -> IO.puts("warning: New plugin version #{new_version} (from package.json) lags behind already installed, expect auto-update overwrite it, if not turned off")
      end
    end

    {_, 0} =
      System.shell("code --install-extension ./elixir-ls-#{version}.vsix --force",
        into: IO.stream()
      )

    :ok
  end

  def package_json_version do
    {version, 0} =
      System.shell("node -p -e \"require('./package.json').version\"")
    version |> String.replace("\n", "")
  end

  def parse_current_extension_version do
    {versions, 0} =
      System.shell("code --list-extensions --show-versions")
     one = versions |> String.split("\n") |> Enum.filter(fn v -> String.starts_with?(v, @extension <> "@") end) |> Enum.take(1)
     case one do
       [v] ->
          rest = String.trim_leading(v, @extension <> "@")
          {:ok, version} = Version.parse(rest)
          version

       _ -> ""
     end
  end

end

if length(System.argv()) == 0 do
  IO.puts """
  Usage:
    elixir ./build.exs <target>

  <target> options:
    prepare      prepares cloned repository for coding
    compile      helps package.json compile
    prepublish   helps package.json vscode:prepublish
    install      installs compiled extension locally
  """
else
  [target | _] = System.argv()

  :ok = Execute.target(target)
end
