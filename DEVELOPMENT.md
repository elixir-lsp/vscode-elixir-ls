# Development

## Packaging

1. Make and push the elixir-ls tag
2. Update the elixir-ls submodule `git submodule foreach git pull origin master`
3. Set `ELS_RELEASE` to an appropriate version in `launch.sh` and `language_server|debugger.bat`
4. Test the new vscode-elixir-ls version with:

    ```
    npm install
    npm install -g vsce@latest
    vsce package
    code --install-extension ./elixir-ls-0.2.44.vsix  --force
    ```

5. Push and verify the build is green.
6. Tag and push tags. Github action will create and publish the release to Visual Studio Marketplace and Open VSX Registry
7. Update forum announcement post: https://elixirforum.com/t/introducing-elixirls-the-elixir-language-server/5857

## References

https://code.visualstudio.com/api/working-with-extensions/publishing-extension

Personal Access Token (PAT) direct link: https://dev.azure.com/elixir-lsp/_usersSettings/tokens

https://code.visualstudio.com/api/language-extensions/embedded-languages

## VSCode grammar debugging

Run "Developer: Inspect Editor Tokens and Scopes" when you want to debug the textmate grammar
