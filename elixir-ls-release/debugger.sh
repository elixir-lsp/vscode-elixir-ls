#!/bin/sh
# Launches the debugger. This script must be in the same directory as mix install launch script.

readlink_f () {
  cd "$(dirname "$1")" > /dev/null || exit 1
  filename="$(basename "$1")"
  if [ -h "$filename" ]; then
    readlink_f "$(readlink "$filename")"
  else
    echo "$(pwd -P)/$filename"
  fi
}

if [ -z "${ELS_INSTALL_PREFIX}" ]; then
  dir="$(dirname "$(readlink_f "$0")")"
else
  dir=${ELS_INSTALL_PREFIX}
fi

export ELS_MODE=debugger
exec "${dir}/launch.sh"
