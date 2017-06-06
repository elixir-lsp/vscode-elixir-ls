#!/bin/bash
cd "$(dirname $0)/../elixir_ls/apps/debugger"
elixir -S mix run --no-halt --no-compile --no-deps-check