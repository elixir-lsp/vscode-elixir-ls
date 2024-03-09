import * as vscode from "vscode";
import {
  DebuggeeOutput,
  DebuggeeExited,
  trackerFactory,
} from "../debugAdapter";
import * as os from "os";
import { reporter } from "../telemetry";

export type RunTestArgs = {
  cwd: string;
  filePath?: string;
  line?: number;
  doctestLine?: number;
  module?: string;
  workspaceFolder: vscode.WorkspaceFolder;
  getTest: (
    file: string,
    module: string,
    describe: string | null,
    name: string,
    type: string
  ) => vscode.TestItem | undefined;
};

// Get the configuration for mix test, if it exists
function getExistingLaunchConfig(
  args: RunTestArgs,
  debug: boolean
): vscode.DebugConfiguration | undefined {
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
  // as of vscode 1.78 ANSI is not fully supported
  testConfig.taskArgs = buildTestCommandArgs(args, debug);
  testConfig.requireFiles = [
    "test/**/test_helper.exs",
    "apps/*/test/**/test_helper.exs",
    args.filePath,
  ];
  testConfig.noDebug = !debug;
  return testConfig;
}

// Get the config to use for debugging
function getLaunchConfig(
  args: RunTestArgs,
  debug: boolean
): vscode.DebugConfiguration {
  const fileConfiguration: vscode.DebugConfiguration | undefined =
    getExistingLaunchConfig(args, debug);

  const fallbackConfiguration: vscode.DebugConfiguration = {
    type: "mix_task",
    name: "mix test",
    request: "launch",
    task: "test",
    env: {
      MIX_ENV: "test",
    },
    taskArgs: buildTestCommandArgs(args, debug),
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
    noDebug: !debug,
  };

  const config = fileConfiguration ?? fallbackConfiguration;

  console.log("Starting debug session with launch config", config);
  return config;
}

export async function runTest(
  run: vscode.TestRun,
  args: RunTestArgs,
  debug: boolean
): Promise<string> {
  reporter.sendTelemetryEvent("run_test", {
    "elixir_ls.with_debug": "true",
  });

  const debugConfiguration: vscode.DebugConfiguration = getLaunchConfig(
    args,
    debug
  );

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
          const category = outputEvent.output.body.category;
          if (category == "stdout" || category == "stderr") {
            output.push(outputEvent.output.body.output);
          } else if (category == "ex_unit") {
            const exUnitEvent = outputEvent.output.body.data.event;
            const data = outputEvent.output.body.data;
            const test = args.getTest(
              data.file,
              data.module,
              data.describe,
              data.name,
              data.type
            );
            if (test) {
              if (exUnitEvent == "test_started") {
                run.started(test);
              } else if (exUnitEvent == "test_passed") {
                run.passed(test, data.time / 1000);
              } else if (exUnitEvent == "test_failed") {
                run.failed(
                  test,
                  new vscode.TestMessage(data.message),
                  data.time / 1000
                );
              } else if (exUnitEvent == "test_errored") {
                // ex_unit does not report duration for invalid tests
                run.errored(test, new vscode.TestMessage(data.message));
              } else if (
                exUnitEvent == "test_skipped" ||
                exUnitEvent == "test_excluded"
              ) {
                run.skipped(test);
              }
            } else {
              if (exUnitEvent != "test_excluded") {
                console.warn(
                  `ElixirLS: Test ${data.file} ${data.module} ${data.describe} ${data.name} not found`
                );
              }
            }
          }
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

// as of vscode 1.85 ANSI is not fully supported
const COMMON_ARGS = [
  "--no-color",
  "--formatter",
  "ElixirLS.DebugAdapter.ExUnitFormatter",
];

function buildTestCommandArgs(args: RunTestArgs, debug: boolean): string[] {
  let line = "";
  if (typeof args.line === "number") {
    line = `:${args.line}`;
  }

  const result = [];

  if (args.module) {
    result.push("--only");
    result.push(`module:${args.module}`);
  }

  if (args.doctestLine) {
    result.push("--only");
    result.push(`doctest_line:${args.doctestLine}`);
  }

  if (args.filePath) {
    // workaround for https://github.com/elixir-lang/elixir/issues/13225
    // ex_unit file filters with windows path separators are broken on elixir < 1.16.1
    // fortunately unix separators work correctly
    // TODO remove this when we require elixir 1.17
    const path =
      os.platform() == "win32"
        ? args.filePath.replace("\\", "/")
        : args.filePath;
    result.push(`${path}${line}`);
  }

  if (debug) {
    result.push("--trace")
  }

  return [...result, ...COMMON_ARGS];
}
