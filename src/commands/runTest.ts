import { exec } from "child_process";

type RunArgs = {
  cwd: string;
  filePath: string;
  line?: number;
};

export default async function runTest(args: RunArgs): Promise<string> {
  const command = buildTestCommand(args)
  console.log(command, args.cwd)

  return new Promise((resolve, reject) => {
    exec(command, { cwd: args.cwd }, (error, stdout, stderr) => {
      console.log("stdout", stdout)
      console.log("stderr", stderr)
      if (!error) {
        resolve(stdout)
      } else {
        reject(stdout)
      }
    })
  });
}

function buildTestCommand(args: RunArgs): string {
  let line = "";
  if(typeof args.line === 'number') {
    line = `:${args.line}`
  }

  return `mix test ${args.filePath}${line}`;
}
