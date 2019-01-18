import { ServerOptions } from 'vscode-languageclient';
import { ExtensionContext } from "vscode";
import { join as pathJoin } from "path";
import { platform } from 'os';
import { mkdirSync } from 'fs';

export function startElixirLS(context: ExtensionContext) {
  const cmd: string = 'language_server' + file_type();
  const path: string = pathJoin(context.extensionPath, 'elixir-ls-release');
  const fullCmd: string = pathJoin(path, cmd);

  const opts = { command: fullCmd };
  const serverOpts: ServerOptions = {
    run: opts,
    debug: opts,
  };

  console.log(fullCmd);

  // @ts-ignore
  mkdirSync(path, { recursive: true });
}

function file_type(): '.sh' | '.bat' {
  if (platform() == "win32") {
    return ".bat"
  } else {
    return ".sh"
  }
}