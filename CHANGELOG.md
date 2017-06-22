### v0.0.8: 23 Jun 2017
  - Enable setting breakpoints in Erlang modules

### v0.0.7: 12 Jun 2017
  - Fix launching of debugger on OSX (when working directory is not set to the extension directory)
  - Fix launching of language server when Elixir is installed with "asdf" tool. (Fix in 0.0.6 didn't actually work)

### v0.0.6: 12 Jun 2017
  - Handle Elixir installations that were done via the "asdf" tool

### v0.0.5: 11 Jun 2017
  - Windows support

### v0.0.4: 10 Jun 2017
  - Updated ElixirLS to package its apps as escripts and updated client to handle it. This should fix the error `(Mix) Could not start application language_server: could not find application file: language_server.app`. Windows, however, is still broken.
  - Began a changelog :)
