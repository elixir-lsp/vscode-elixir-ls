### v0.2.11: 31 Jan 2017
* Improve syntax highlighting (Thanks to @TeeSeal)

### v0.2.10: 24 Jan 2017
* Fix builds and related features on Windows

### v0.2.9: 29 Nov 2017

* Fix autocomplete not firing after "."

### v0.2.8: 29 Nov 2017

* Add auto-indentation rules (copied from
  [fr1zle/vscode-elixir](https://github.com/fr1zle/vscode-elixir))
* Disable `editor.quickSuggestions` by default so autocomplete suggestions are
  triggered automatically only when after a ".". This is nice because the
  language server irritatingly tries to auto-complete things like "do" or "else"
  if they come at the end of a line.
* Add configuration option "mixEnv" to set the Mix environment used when
  compiling. It now defaults to "test" instead of "dev" to aid in TDD and to
  avoid interfering with the Phoenix dev server.
* Add configuration option "projectDir" for when your Mix project is in a
  subdirectory instead of the workspace root.
* Add debug launch configuration option "env" to set environment variables
  (including `MIX_ENV`)
* Add debug launch configuration option "excludeModules" to avoid interpreting
  modules. This is important if for modules that contain NIFs which can't be
  debugged.

### v0.2.7: 9 Nov 2017

* Read formatter options from `.formatter.exs` in project root instead of
  including line length in extension config options

### v0.2.6: 3 Nov 2017

* Don't focus Output pane on errors because request handler errors are common
  and recoverable

### v0.2.5: 3 Nov 2017

* Improve error output in debugger and fix failures to launch debugger

### v0.2.4: 25 Oct 2017

* Package ElixirLS as .ez archives instead of escripts. This should make `asdf`
  installs work.
* Fix debugger error logging when initialize fails
* Fix timeouts when calling back into the language server with build or dialyzer
  results

### v0.2.3: 24 Oct 2017

* Fix failing debugger launch
* Fix segfaults in OTP 20 caused by regexes precompiled in OTP 19

### v0.2.2: 19 Oct 2017

* Fix launch on Windows when there are spaces in the path

### v0.2.1: 19 Oct 2017

* Fix bug where deps are recompiled after every change
* Update README
* Update syntax highlighting (merged from fr1zle/vscode-elixir)

### v0.2.0: 17 Oct 2017

* Rewritten build system to make use of Elixir 1.6 compiler diagnostics
* Code formatting in Elixir 1.6
* Automatic dialyzer server in Erlang/OTP 20
* Lots and lots of refactoring

### v0.0.9: 23 Jun 2017

* Revert to building with Erlang OTP 19.2 instead of 20.0. It seems that
  escripts built with 20.0 won't run on 19.2 runtimes.
* Fix handling of Windows paths with non-default drive letter

### v0.0.8: 23 Jun 2017

* Enable setting breakpoints in Erlang modules

### v0.0.7: 12 Jun 2017

* Fix launching of debugger on OSX (when working directory is not set to the
  extension directory)
* Fix launching of language server when Elixir is installed with "asdf" tool.
  (Fix in 0.0.6 didn't actually work)

### v0.0.6: 12 Jun 2017

* Handle Elixir installations that were done via the "asdf" tool

### v0.0.5: 11 Jun 2017

* Windows support

### v0.0.4: 10 Jun 2017

* Updated ElixirLS to package its apps as escripts and updated client to handle
  it. This should fix the error `(Mix) Could not start application
  language_server: could not find application file: language_server.app`.
  Windows, however, is still broken.
* Began a changelog :)
