#!/usr/bin/env sh

SCRIPTPATH=`dirname $0`

# Compile typescript
tsc -p ./

if [ ! -f "$SCRIPTPATH/elixir-ls/mix.exs" ]; then
  echo "[Error] ./elixir-ls/mix.exs does not exist. You probably didn't initialize the Git submodule. Run the following command:" 1>&2
  echo "  git submodule init && git submodule update" 1>&2
  exit 1
fi

echo "Building ElixirLS submodule"
cd "$SCRIPTPATH/elixir-ls"
mix deps.get
mix compile