"use strict";

import * as vscode from "vscode";
import { buildCommand } from "./executable";
import { DebugProtocol } from "@vscode/debugprotocol";
import { TelemetryEvent, reporter } from "./telemetry";

class DebugAdapterExecutableFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  private _context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  public createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    console.log(
      "DebugAdapterExecutableFactory called with session",
      session,
      "executable",
      executable
    );
    const command = buildCommand(
      this._context,
      "debugger",
      session.workspaceFolder
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
      options
    );

    if (session.workspaceFolder) {
      console.log(
        `ElixirLS: starting DAP session in workspace folder ${session.workspaceFolder.name} with executable`,
        resultExecutable
      );
    } else {
      console.log(
        "ElixirLS: starting folderless DAP session with executable",
        resultExecutable
      );
    }

    reporter.sendTelemetryEvent(
      "elixir_ls.debug_session_starting",
      {"elixir_ls.debug_session_mode": session.workspaceFolder ? "workspaceFolder" : "folderless"}
    );

    return resultExecutable;
  }
}

export interface DebuggeeExited {
  sessionId: string;
  code: number;
}

export interface DebuggeeOutput {
  sessionId: string;
  output: string;
}

class DebugAdapterTrackerFactory
  implements vscode.DebugAdapterTrackerFactory, vscode.Disposable
{
  private _context: vscode.ExtensionContext;
  private startTimes: Map<string, number> = new Map();
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

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
    session: vscode.DebugSession
  ): vscode.ProviderResult<vscode.DebugAdapterTracker> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return {
      onWillStartSession: () => {
        self.startTimes.set(session.id, performance.now());
      },
      onWillStopSession: () => {
        self.startTimes.delete(session.id);
      },
      onError: (error: Error) => {
        console.warn(`ElixirLS: Debug session ${session.id}: `, error);
        
        reporter.sendTelemetryErrorEvent(
          "elixir_ls.debug_session_error",
          {
            "elixir_ls.debug_session_mode": session.workspaceFolder ? "workspaceFolder" : "folderless",
            "elixir_ls.debug_session_error": String(error),
            "elixir_ls.debug_session_error_stack": error.stack ?? ""
          }
        );
      },
      onExit: (code: number | undefined, signal: string | undefined) => {
        if (code == 0) {
          console.log(
            `ElixirLS: Debug session ${session.id}: DAP process exited with code `,
            code
          );
        } else {
          console.error(
            `ElixirLS: Debug session ${session.id}: DAP process exited with code `,
            code,
            " signal ",
            signal
          );
        }
        reporter.sendTelemetryErrorEvent(
          "elixir_ls.debug_session_exit",
          {
            "elixir_ls.debug_session_mode": session.workspaceFolder ? "workspaceFolder" : "folderless",
            "elixir_ls.debug_session_exit_code": String(code),
            "elixir_ls.debug_session_exit_signal": String(code),
          }
        );
      },
      onDidSendMessage: (message: DebugProtocol.ProtocolMessage) => {
        if (message.type == "event") {
          const event = <DebugProtocol.Event>message;
          if (event.event == "output") {
            const outputEvent = <DebugProtocol.OutputEvent>message;
            if (
              outputEvent.body.category == "stdout" ||
              outputEvent.body.category == "stderr"
            ) {
              self._onOutput.fire({
                sessionId: session.id,
                output: outputEvent.body.output,
              });
            } else if (outputEvent.body.category == "telemetry") {
              const telemetryData = <TelemetryEvent>outputEvent.body.data;
              // TODO remove debug_session_mode?
              reporter.sendTelemetryEvent(
                telemetryData.name,
                {
                  ...telemetryData.properties,
                  "elixir_ls.debug_session_mode": session.workspaceFolder ? "workspaceFolder" : "folderless"
                },
                telemetryData.measurements
              );
            }
          }

          if (event.event == "initialized") {
            const elapsed = performance.now() - self.startTimes.get(session.id)!
            reporter.sendTelemetryEvent(
              "elixir_ls.debug_session_initialized",
              {"elixir_ls.debug_session_mode": session.workspaceFolder ? "workspaceFolder" : "folderless"},
              {"elixir_ls.debug_session_initialize_time": elapsed}
            );
          }

          if (event.event == "exited") {
            const exitedEvent = <DebugProtocol.ExitedEvent>message;

            reporter.sendTelemetryEvent(
              "elixir_ls.debug_session_exited",
              {
                "elixir_ls.debug_session_mode": session.workspaceFolder ? "workspaceFolder" : "folderless",
                "elixir_ls.debug_session_exit_code": String(exitedEvent.body.exitCode)
              }
            );
            
            self._onExited.fire({
              sessionId: session.id,
              code: exitedEvent.body.exitCode,
            });
          }
        } else if (message.type == "response") {
          const response = <DebugProtocol.Response>message;
          if (!response.success) {
            const errorResponse = <DebugProtocol.ErrorResponse>message;
            if (errorResponse.body.error) {
              const errorMessage = errorResponse.body.error;

              if (errorMessage.sendTelemetry) {
                // TODO include errorMessage.variables?
                reporter.sendTelemetryErrorEvent(
                  "elixir_ls.dap_request_error",
                  {
                    "elixir_ls.debug_session_mode": session.workspaceFolder ? "workspaceFolder" : "folderless",
                    "elixir_ls.dap_command": errorResponse.command,
                    "elixir_ls.dap_error": errorResponse.message,
                    "elixir_ls.dap_error_message": errorMessage.format
                  }
                );
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
  // Use custom DebugAdapterExecutableFactory that launches the debugger with
  // the current working directory set to the workspace root so asdf can load
  // the correct environment properly.
  const factory = new DebugAdapterExecutableFactory(context);
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory("mix_task", factory)
  );

  trackerFactory = new DebugAdapterTrackerFactory(context);

  context.subscriptions.push(
    vscode.debug.registerDebugAdapterTrackerFactory("mix_task", trackerFactory)
  );

  context.subscriptions.push(trackerFactory);
}
