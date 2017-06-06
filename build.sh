#!/usr/bin/env sh

SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`

# Compile typescript
tsc -p ./

# Default location for elixir-ls source. You must check out elixir-ls separately from this repo
# in order to build! Default location is ../elixir-ls
${ELIXIR_LS_SRC:="$SCRIPTPATH/../elixir-ls"}

if [ ! -d "$ELIXIR_LS_SRC" ]; then
  echo "[Error] ElixirLS must be checked out to $ELIXIR_LS_SRC. You can override this path by setting environment variable ELIXIR_LS_SRC" 1>&2
  exit 1
fi

# Build elixir-ls
echo "Building ElixirLS in $ELIXIR_LS_SRC"
cd $ELIXIR_LS_SRC
mix deps.get
mix compile

# Copy to local subfolder elixir-ls
DEST="$SCRIPTPATH/elixir-ls"
echo "Copying ElixirLS from $ELIXIR_LS_SRC to $DEST"
rm -rf $DEST
cp -r $ELIXIR_LS_SRC $DEST

echo "Build script finished"
