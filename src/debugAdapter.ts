import type { DebugProtocol } from "@vscode/debugprotocol";
import * as vscode from "vscode";
import { buildCommand } from "./executable";
import {
  preprocessStacktrace,
  preprocessStacktraceInProperties,
  reporter,
  type TelemetryEvent,
} from "./telemetry";

class DebugAdapterExecutableFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  private _context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  public createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable,
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    console.log(
      "DebugAdapterExecutableFactory called with session",
      session,
      "executable",
      executable,
    );
    const command = buildCommand(
      this._context,
      "debug_adapter",
      session.workspaceFolder,
    );

    const options: vscode.DebugAdapterExecutableOptions =
      executable.options ?? {};

    if (session.workspaceFolder) {
      // we starting the session in workspace folder
      // set cwd to workspace folder path
      options.cwd = session.workspaceFolder.uri.fsPath;
    }

    // for folderless session (when `session.workspaceFolder` is `undefined`)
    // assume that cwd is workspace root and `projectDir` will be used to point
    // to the root of mix project e.g. `"projectDir": "${workspaceRoot:foo}"`

    // for some reason env from launch config is not being passed to executable config
    // by default we need to do that manually
    if (session.configuration.env) {
      options.env = {
        ...(options.env ?? {}),
        ...session.configuration.env,
      };
    }

    const resultExecutable = new vscode.DebugAdapterExecutable(
      command,
      executable.args,
      options,
    );

    if (session.workspaceFolder) {
      console.log(
        `ElixirLS: starting DAP session in workspace folder ${session.workspaceFolder.name} with executable`,
        resultExecutable,
      );
    } else {
      console.log(
        "ElixirLS: starting folderless DAP session with executable",
        resultExecutable,
      );
    }

    reporter.sendTelemetryEvent("debug_session_starting", {
      "elixir_ls.debug_session_mode": session.workspaceFolder
        ? "workspaceFolder"
        : "folderless",
    });

    return resultExecutable;
  }
}

export interface DebuggeeExited {
  sessionId: string;
  code: number;
}

export interface DebuggeeOutput {
  sessionId: string;
  output: DebugProtocol.OutputEvent;
}

class DebugAdapterTrackerFactory
  implements vscode.DebugAdapterTrackerFactory, vscode.Disposable
{
  private startTimes: Map<string, number> = new Map();

  dispose() {
    this._onExited.dispose();
    this._onOutput.dispose();
  }

  private _onExited = new vscode.EventEmitter<DebuggeeExited>();
  get onExited(): vscode.Event<DebuggeeExited> {
    return this._onExited.event;
  }

  private _onOutput = new vscode.EventEmitter<DebuggeeOutput>();
  get onOutput(): vscode.Event<DebuggeeOutput> {
    return this._onOutput.event;
  }

  public createDebugAdapterTracker(
    session: vscode.DebugSession,
  ): vscode.ProviderResult<vscode.DebugAdapterTracker> {
    return {
      onWillStartSession: () => {
        this.startTimes.set(session.id, performance.now());
      },
      onWillStopSession: () => {
        this.startTimes.delete(session.id);
      },
      onError: (error: Error) => {
        console.warn(`ElixirLS: Debug session ${session.id}: `, error);

        reporter.sendTelemetryErrorEvent("debug_session_error", {
          "elixir_ls.debug_session_mode": session.workspaceFolder
            ? "workspaceFolder"
            : "folderless",
          "elixir_ls.debug_session_error": String(error),
          "elixir_ls.debug_session_error_stack": error.stack ?? "",
        });
      },
      onExit: (code: number | undefined, signal: string | undefined) => {
        if (code === 0) {
          console.log(
            `ElixirLS: Debug session ${session.id}: DAP process exited with code `,
            code,
          );
        } else {
          console.error(
            `ElixirLS: Debug session ${session.id}: DAP process exited with code `,
            code,
            " signal ",
            signal,
          );
        }
        reporter.sendTelemetryErrorEvent("debug_session_exit", {
          "elixir_ls.debug_session_mode": session.workspaceFolder
            ? "workspaceFolder"
            : "folderless",
          "elixir_ls.debug_session_exit_code": String(code),
          "elixir_ls.debug_session_exit_signal": String(signal),
        });
      },
      onDidSendMessage: (message: DebugProtocol.ProtocolMessage) => {
        if (message.type === "event") {
          const event = <DebugProtocol.Event>message;
          if (event.event === "output") {
            const outputEvent = <DebugProtocol.OutputEvent>message;
            if (outputEvent.body.category !== "telemetry") {
              this._onOutput.fire({
                sessionId: session.id,
                output: outputEvent,
              });
            } else {
              const telemetryData = <TelemetryEvent>outputEvent.body.data;
              if (telemetryData.name.endsWith("_error")) {
                reporter.sendTelemetryErrorEvent(
                  telemetryData.name,
                  {
                    ...preprocessStacktraceInProperties(
                      telemetryData.properties,
                    ),
                    "elixir_ls.debug_session_mode": session.workspaceFolder
                      ? "workspaceFolder"
                      : "folderless",
                  },
                  telemetryData.measurements,
                );
              } else {
                reporter.sendTelemetryEvent(
                  telemetryData.name,
                  {
                    ...telemetryData.properties,
                    "elixir_ls.debug_session_mode": session.workspaceFolder
                      ? "workspaceFolder"
                      : "folderless",
                  },
                  telemetryData.measurements,
                );
              }
            }
          }

          if (event.event === "initialized") {
            const elapsed =
              // biome-ignore lint/style/noNonNullAssertion: start time exists for active sessions
              performance.now() - this.startTimes.get(session.id)!;
            reporter.sendTelemetryEvent(
              "debug_session_initialized",
              {
                "elixir_ls.debug_session_mode": session.workspaceFolder
                  ? "workspaceFolder"
                  : "folderless",
              },
              { "elixir_ls.debug_session_initialize_time": elapsed },
            );
          }

          if (event.event === "exited") {
            const exitedEvent = <DebugProtocol.ExitedEvent>message;

            reporter.sendTelemetryEvent("debug_session_debuggee_exited", {
              "elixir_ls.debug_session_mode": session.workspaceFolder
                ? "workspaceFolder"
                : "folderless",
              "elixir_ls.debug_session_debuggee_exit_code": String(
                exitedEvent.body.exitCode,
              ),
            });

            this._onExited.fire({
              sessionId: session.id,
              code: exitedEvent.body.exitCode,
            });
          }
        } else if (message.type === "response") {
          const response = <DebugProtocol.Response>message;
          if (!response.success) {
            const errorResponse = <DebugProtocol.ErrorResponse>message;
            if (errorResponse.body.error) {
              const errorMessage = errorResponse.body.error;

              if (errorMessage.sendTelemetry) {
                // TODO include errorMessage.variables?
                reporter.sendTelemetryErrorEvent("dap_request_error", {
                  "elixir_ls.debug_session_mode": session.workspaceFolder
                    ? "workspaceFolder"
                    : "folderless",
                  "elixir_ls.dap_command": errorResponse.command,
                  "elixir_ls.dap_error": errorResponse.message,
                  "elixir_ls.dap_error_message": preprocessStacktrace(
                    errorMessage.format,
                  ),
                });
              }
            }
          }
        }
      },
    };
  }
}

export let trackerFactory: DebugAdapterTrackerFactory;

export function configureDebugger(context: vscode.ExtensionContext) {
  // Use custom DebugAdapterExecutableFactory that launches the debug adapter with
  // the current working directory set to the workspace root so asdf can load
  // the correct environment properly.
  const factory = new DebugAdapterExecutableFactory(context);
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory("mix_task", factory),
  );

  trackerFactory = new DebugAdapterTrackerFactory();

  context.subscriptions.push(
    vscode.debug.registerDebugAdapterTrackerFactory("mix_task", trackerFactory),
  );

  context.subscriptions.push(trackerFactory);
}
