import { ExecOptions, exec } from "child_process";
import * as vscode from "vscode";

type RunArgs = {
  cwd: string;
  filePath: string;
  line?: number;
};

export default function runTest(
  args: RunArgs,
  debug: boolean
): Promise<string> {
  return debug ? debugTest(args) : runTestWithoutDebug(args);
}

async function runTestWithoutDebug(args: RunArgs): Promise<string> {
  const command = `mix test ${buildTestCommandArgs(args)}`;
  console.log(command, args.cwd);

  return new Promise((resolve, reject) => {
    const options: ExecOptions = {
      cwd: args.cwd,
      env: {
        ...process.env,
        MIX_ENV: "test",
      },
    };
    exec(command, options, (error, stdout, stderr) => {
      console.log("stdout", stdout);
      console.log("stderr", stderr);
      if (!error) {
        resolve(stdout);
      } else {
        reject(stdout + (stderr ? "\n" + stderr : ""));
      }
    });
  });
}

// Get the configuration for mix test, if it exists
function getTestConfig(args: RunArgs): vscode.DebugConfiguration | undefined {
  const launchJson = vscode.workspace.getConfiguration("launch");
  const testConfig = launchJson.configurations.findLast(
    (e: { name: string }) => e.name == "mix test"
  );

  if (testConfig == undefined) {
    return undefined;
  }

  testConfig.projectDir = args.cwd;
  testConfig.taskArgs.concat(buildTestCommandArgs(args));
  testConfig.requireFiles.push(args.filePath);
  return testConfig;
}

// Get the config to use for debugging
function getDebugConfig(args: RunArgs): vscode.DebugConfiguration {
  const fileConfiguration: vscode.DebugConfiguration | undefined =
    getTestConfig(args);

  const fallbackConfiguration: vscode.DebugConfiguration = {
    type: "mix_task",
    name: "mix test",
    request: "launch",
    task: "test",
    env: {
      MIX_ENV: "test",
    },
    taskArgs: [buildTestCommandArgs(args)],
    startApps: true,
    projectDir: args.cwd,
    // we need to require all test helpers and only the file we need to test
    // mix test runs tests in all required files even if they do not match
    // given path:line
    requireFiles: [
      "test/**/test_helper.exs",
      "apps/*/test/**/test_helper.exs",
      args.filePath,
    ],
  };

  return fileConfiguration ?? fallbackConfiguration;
}

async function debugTest(args: RunArgs): Promise<string> {
  const debugConfiguration: vscode.DebugConfiguration = getDebugConfig(args);

  return new Promise((resolve, reject) => {
    const listeners: Array<vscode.Disposable> = [];
    const disposeListeners = () => {
      for (const listener of listeners) {
        listener.dispose();
      }
    };
    listeners.push(
      vscode.debug.onDidStartDebugSession((_s) => {
        console.log("Debug session started");
      })
    );
    listeners.push(
      vscode.debug.onDidTerminateDebugSession((_s) => {
        console.log("Debug session terminated");

        disposeListeners();

        // there is no documented way of getting output from
        // vscode.debug.activeDebugConsole
        resolve("");
      })
    );
    vscode.debug
      .startDebugging(vscode.workspace.workspaceFolders![0], debugConfiguration)
      .then((debugSessionStarted) => {
        if (!debugSessionStarted) {
          disposeListeners();

          reject("unable to start debug session");
        }
      });
  });
}

function buildTestCommandArgs(args: RunArgs): string {
  let line = "";
  if (typeof args.line === "number") {
    line = `:${args.line}`;
  }

  return `${args.filePath}${line}`;
}
