import { ServerOptions } from 'vscode-languageclient';
import { ExtensionContext } from "vscode";
import { join as pathJoin } from "path";
import { platform } from 'os';
import { mkdirSync, access } from 'fs';
import { get } from "https";

// TODO: make this configurable
// This ZIP is directly specifying a commit at github
const sourceURL: string = "https://github.com/elixir-lsp/elixir-ls/archive/030a987ac92ac7e501148d65d5a92afd7cb50dac.zip";

export function configureElixirLS(context: ExtensionContext): Thenable<ServerOptions> {
  const cmd: string = 'language_server' + file_type();
  const path: string = pathJoin(context.extensionPath, 'elixir-ls-release');
  const fullCmd: string = pathJoin(path, cmd);

  const opts = { command: fullCmd };
  const serverOpts: ServerOptions = {
    run: opts,
    debug: opts,
  };

  console.log(fullCmd);

  // Current typespecs do not know about the option object…
  // @ts-ignore
  mkdirSync(path, { recursive: true });

  let result: Promise<ServerOptions> = new Promise<boolean>((resolve, _reject) => {
    access(fullCmd, (err) => {
      resolve(!err)
    })
  }).then((needDownload) => new Promise<boolean>((resolve, _reject) => {
    get(sourceURL, (res) => {
      res.on('data', (data) => {
        // write to disc
      }).on('end', () => resolve(true));
    });
  })).then((needUnpack) => new Promise<boolean>((resolve, _reject) => {
    if (needUnpack) {
      // Unzip
    }
    resolve(true);
  })).then((_: boolean) => {
    return serverOpts;
  });

  return result;
}

function file_type(): '.sh' | '.bat' {
  if (platform() == "win32") {
    return ".bat"
  } else {
    return ".sh"
  }
}