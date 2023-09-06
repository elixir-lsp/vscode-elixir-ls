"use strict";

import * as vscode from "vscode";
import { buildCommand } from "./executable";
import { DebugProtocol } from "@vscode/debugprotocol";

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
    let options: vscode.DebugAdapterExecutableOptions | undefined =
      executable.options;

    if (session.workspaceFolder) {
      const cwd: string = session.workspaceFolder.uri.fsPath;

      if (options) {
        options = { ...options, cwd };
      } else {
        options = { cwd };
      }

      // for some reason env from launch config is not being passed to executable config
      // by default we need to do that manually
      if (session.configuration.env) {
        options = {
          ...options,
          env: {
            ...(options.env ?? {}),
            ...session.configuration.env,
          },
        };
      }
    }

    const resultExecutable = new vscode.DebugAdapterExecutable(
      command,
      executable.args,
      options
    );

    if (session.workspaceFolder) {
      console.log(
        `ElixirLS: starting DAP for ${session.workspaceFolder.uri.fsPath} with executable`,
        resultExecutable
      );
    } else {
      console.log("ElixirLS: starting DAP with executable", resultExecutable);
    }

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
      onError: (error: Error) => {
        console.warn(`ElixirLS: Debug session ${session.id}: `, error);
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
            }
          }

          if (event.event == "exited") {
            const exitedEvent = <DebugProtocol.ExitedEvent>message;
            self._onExited.fire({
              sessionId: session.id,
              code: exitedEvent.body.exitCode,
            });
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
