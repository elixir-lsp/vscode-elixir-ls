#!/usr/bin/env bash
set -e

tsc -p ./
cd elixir-ls
mix deps.get
mix elixir_ls.release -o ../elixir-ls-release
