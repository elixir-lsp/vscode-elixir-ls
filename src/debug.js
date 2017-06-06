const path = require("path");
const childProcess = require('child_process');
const shell = require('shelljs');
const fs = require('fs');


const mixExe = shell.which('mix');

if (!mixExe) {
  console.error("Can't find executable 'elixir' in path")
} else {
  const input = ["run", "--no-halt"]
  shell.cd("elixir_ls/apps/debugger");
  // spawnSync(mixExe, input, {stdio: 'inherit'});
  const file = "/Users/jakebecker/IdeaProjects/elixir_language_server/elixir_ls/apps/debugger/script.sh"
  console.log("about to do the thing");

  const result = childProcess.spawnSync(mixExe, ["run"], { });
  const str = JSON.stringify({
    stdout: result.stdout.toString(),
    stderr: result.stdout.toString(),
  });
  fs.writeFile("output.txt", str);
  for(;;);
}