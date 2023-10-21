import * as vscode from "vscode";
import TelemetryReporter, {
  TelemetryEventMeasurements,
  TelemetryEventProperties,
} from "@vscode/extension-telemetry";

const key = "0979629c-3be4-4b0d-93f2-2be81cccd799";
const fakeKey = "00000000-0000-0000-0000-000000000000";

export let reporter: TelemetryReporter;

class EnvironmentReporter extends TelemetryReporter {
  constructor() {
    super(process.env.ELS_TEST ? fakeKey : key);
  }

  override sendTelemetryEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }
    super.sendTelemetryEvent(eventName, properties, measurements);
  }

  override sendTelemetryErrorEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }
    super.sendTelemetryErrorEvent(eventName, properties, measurements);
  }

  override sendRawTelemetryEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }
    super.sendRawTelemetryEvent(eventName, properties, measurements);
  }

  override sendDangerousTelemetryErrorEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }
    super.sendDangerousTelemetryErrorEvent(eventName, properties, measurements);
  }

  override sendDangerousTelemetryEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }
    super.sendDangerousTelemetryEvent(eventName, properties, measurements);
  }
}

export interface TelemetryEvent {
  name: string;
  properties: { [key: string]: string };
  measurements: { [key: string]: number };
}

export function configureTelemetry(context: vscode.ExtensionContext) {
  reporter = new EnvironmentReporter();
  context.subscriptions.push(reporter);
}
