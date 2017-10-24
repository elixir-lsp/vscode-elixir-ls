@echo off & setlocal enabledelayedexpansion

SET ERL_LIBS=%~dp0..\elixir-ls-release
mix elixir_ls.debugger
