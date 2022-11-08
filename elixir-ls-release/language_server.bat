@echo off & setlocal enabledelayedexpansion

SET ELS_MODE=language_server
IF EXIST "%APPDATA%\elixir_ls\setup.bat" (
    CALL "%APPDATA%\elixir_ls\setup.bat" > nul
)

SET MIX_ENV=prod
elixir "%~dp0\quiet_install.exs" > nul
elixir --erl "+sbwt none +sbwtdcpu none +sbwtdio none" "%~dp0\language_server.exs"
