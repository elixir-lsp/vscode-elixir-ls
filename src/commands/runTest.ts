import { ExecOptions, exec } from "child_process";
import * as vscode from "vscode";
import {
  DebuggeeOutput,
  DebuggeeExited,
  trackerFactory,
} from "../debugAdapter";
import { reporter } from "../telemetry";

type RunArgs = {
  cwd: string;
  filePath: string;
  line?: number;
  workspaceFolder: vscode.WorkspaceFolder;
};

export default function runTest(
  args: RunArgs,
  debug: boolean
): Promise<string> {
  return debug ? debugTest(args) : runTestWithoutDebug(args);
}

async function runTestWithoutDebug(args: RunArgs): Promise<string> {
  reporter.sendTelemetryEvent("run_test", {
    "elixir_ls.with_debug": "false",
  });

  const command = `mix test ${buildTestCommandArgs(args).join(" ")}`;

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
  const launchJson = vscode.workspace.getConfiguration(
    "launch",
    args.workspaceFolder
  );
  const testConfig = launchJson.configurations.findLast(
    (e: { name: string }) => e.name == "mix test"
  );

  if (testConfig == undefined) {
    return undefined;
  }

  // override configuration with sane defaults
  testConfig.request = "launch";
  testConfig.task = "test";
  testConfig.projectDir = args.cwd;
  testConfig.env = {
    MIX_ENV: "test",
    ...(testConfig.env ?? {}),
  };
  testConfig.taskArgs = [...buildTestCommandArgs(args), "--raise"];
  testConfig.requireFiles = [
    "test/**/test_helper.exs",
    "apps/*/test/**/test_helper.exs",
    args.filePath,
  ];
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
    taskArgs: [...buildTestCommandArgs(args), "--raise"],
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

  const config = fileConfiguration ?? fallbackConfiguration;

  console.log("Starting debug session with launch config", config);
  return config;
}

async function debugTest(args: RunArgs): Promise<string> {
  reporter.sendTelemetryEvent("run_test", {
    "elixir_ls.with_debug": "true",
  });

  const debugConfiguration: vscode.DebugConfiguration = getDebugConfig(args);

  return new Promise((resolve, reject) => {
    const listeners: Array<vscode.Disposable> = [];
    const disposeListeners = () => {
      for (const listener of listeners) {
        listener.dispose();
      }
    };
    let sessionId = "";
    // default to error
    // expect DAP `exited` event with mix test exit code
    let exitCode = 1;
    const output: string[] = [];
    listeners.push(
      trackerFactory.onOutput((outputEvent: DebuggeeOutput) => {
        if (outputEvent.sessionId == sessionId) {
          output.push(outputEvent.output);
        }
      })
    );
    listeners.push(
      trackerFactory.onExited((exit: DebuggeeExited) => {
        console.log(
          `ElixirLS: Debug session ${exit.sessionId}: debuggee exited with code ${exit.code}`
        );
        if (exit.sessionId == sessionId) {
          exitCode = exit.code;
        }
      })
    );
    listeners.push(
      vscode.debug.onDidStartDebugSession((s) => {
        console.log(`ElixirLS: Debug session ${s.id} started`);
        sessionId = s.id;
      })
    );
    listeners.push(
      vscode.debug.onDidTerminateDebugSession((s) => {
        console.log(`ElixirLS: Debug session ${s.id} terminated`);

        disposeListeners();
        if (exitCode == 0) {
          resolve(output.join(""));
        } else {
          reject(output.join(""));
        }
      })
    );

    vscode.debug.startDebugging(args.workspaceFolder, debugConfiguration).then(
      (debugSessionStarted) => {
        if (!debugSessionStarted) {
          reporter.sendTelemetryErrorEvent("run_test_error", {
            "elixir_ls.with_debug": "true",
          });

          disposeListeners();

          reject("Unable to start debug session");
        }
      },
      (reason) => {
        reporter.sendTelemetryErrorEvent("run_test_error", {
          "elixir_ls.with_debug": "true",
          "elixir_ls.run_test_error": String(reason),
          "elixir_ls.run_test_error_stack": reason?.stack ?? "",
        });

        disposeListeners();
        reject("Unable to start debug session");
      }
    );
  });
}

function buildTestCommandArgs(args: RunArgs): string[] {
  let line = "";
  if (typeof args.line === "number") {
    line = `:${args.line}`;
  }

  // as of vscode 1.78 ANSI is not fully supported
  return [`${args.filePath}${line}`, "--no-color"];
}
