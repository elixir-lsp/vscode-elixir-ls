import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";

const key = "0979629c-3be4-4b0d-93f2-2be81cccd799";

export let reporter: TelemetryReporter;

export interface TelemetryEvent {
  name: string;
  properties: { [key: string]: string };
  measurements: { [key: string]: number };
}

export function configureTelemetry(context: vscode.ExtensionContext) {
  reporter = new TelemetryReporter(key);
  context.subscriptions.push(reporter);
}
