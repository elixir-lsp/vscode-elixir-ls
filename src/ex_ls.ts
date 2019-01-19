import { ServerOptions } from "vscode-languageclient";
import { ExtensionContext, window } from "vscode";
import { join as pathJoin } from "path";
import { platform } from "os";
import { mkdirSync, access, writeFile } from "fs";
import { get } from "https";
import { Repository } from "gitty";
import { spawnSync } from "child_process";

// TODO: make this configurable
// This ZIP is directly specifying a commit at github
const sourceRepo: string = "https://github.com/elixir-lsp/elixir-ls.git";

export function configureElixirLS(
  context: ExtensionContext
): Thenable<ServerOptions> {
  const cmd: string = "language_server" + file_type();
  const repoPath: string = pathJoin(context.extensionPath, "elixir-ls-repo");
  const path: string = pathJoin(context.extensionPath, "elixir-ls-release");
  const fullCmd: string = pathJoin(path, cmd);

  const opts = { command: fullCmd };
  const serverOpts: ServerOptions = {
    run: opts,
    debug: opts
  };

  let result: Promise<ServerOptions> = new Promise<"update" | "cloned">(
    (resolve, reject) => {
      Repository.clone(repoPath, sourceRepo, (err: any) => {
        if (!err) {
          resolve("cloned");
        } else if (err && /exists/.test(err)) {
          resolve("update");
        } else {
          reject(err);
        }
      });
    }
  )
    .then((action) => {
      if (action == "update") {
        // TODO: check for updates
      }

      // TODO: check errors
      // TODO: skip conditionally
      spawnSync('mix', ['deps.get'], { cwd: repoPath })
      spawnSync('mix', ['compile'], { cwd: repoPath });
      spawnSync('mix', ['elixir_ls.release', '-o', path], { cwd: repoPath });
    })
    .then(_ => serverOpts)
    .catch(err => {
      window.showErrorMessage(`${err}`);
      return null;
    });

  return result;
}

function file_type(): ".sh" | ".bat" {
  if (platform() == "win32") {
    return ".bat";
  } else {
    return ".sh";
  }
}
