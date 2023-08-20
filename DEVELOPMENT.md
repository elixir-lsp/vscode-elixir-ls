# Development

## Packaging

1. Update the elixir-ls submodule `git submodule foreach git pull origin master` to desired tag
2. Update version in `package.json` (to e.g. `0.15.0`)
3. Update [CHANGELOG.md](CHANGELOG.md)
4. Test the new vscode-elixir-ls version with:

    ```shell
    npm install
    npm install -g @vscode/vsce@latest
    vsce package
    code --install-extension ./elixir-ls-*.vsix --force
    ```

5. Push and verify the build is green.
6. Tag and push tags. Tag needs to be version prefixed with `v` (e.g. `v0.15.0`). Github action will create and publish the release to Visual Studio Marketplace and Open VSX Registry. Semver prerelease tags (e.g. `v0.1.0-rc.0`) will dry run publish.
7. Update forum announcement post: https://elixirforum.com/t/introducing-elixirls-the-elixir-language-server/5857

## References

https://code.visualstudio.com/api/working-with-extensions/publishing-extension

Personal Access Token (PAT) direct link: https://dev.azure.com/elixir-lsp/_usersSettings/tokens

https://code.visualstudio.com/api/language-extensions/embedded-languages

## VSCode grammar debugging

Run "Developer: Inspect Editor Tokens and Scopes" when you want to debug the textmate grammar
