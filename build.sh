#!/usr/bin/env sh
SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`

# Compile typescript
tsc -p ./

if [ ! -f "$SCRIPTPATH/elixir-ls/mix.exs" ]; then
  echo "[Error] ./elixir-ls/mix.exs does not exist. You probably didn't initialize the Git submodule. Run the following command:" 1>&2
  echo "  git submodule init && git submodule update" 1>&2
  exit 1
fi

echo "Building ElixirLS submodule"
"$SCRIPTPATH"/elixir-ls/release.sh

echo "Copy results into elixir-ls-release"
rm -rf elixir-ls-release
mkdir elixir-ls-release
cp -r "$SCRIPTPATH"/elixir-ls/release/* elixir-ls-release