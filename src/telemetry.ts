import {
  type TelemetryEventMeasurements,
  type TelemetryEventProperties,
  TelemetryReporter,
} from "@vscode/extension-telemetry";
import type * as vscode from "vscode";

const key =
  "InstrumentationKey=0979629c-3be4-4b0d-93f2-2be81cccd799;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=7ad820f6-e2a9-4df6-97d8-d72ce90b8460";
const fakeKey = "00000000-0000-0000-0000-000000000000";

interface EventSamplingConfig {
  eventName: string;
  propertyKey?: string;
  propertyValue?: string;
  samplingFactor: number; // Range 0-1
}

const samplingConfigs: EventSamplingConfig[] = [
  {
    eventName: "build",
    samplingFactor: 0.004,
  },
  {
    eventName: "build_error",
    samplingFactor: 0.01,
  },
  {
    eventName: "test_controller_resolve_error",
    samplingFactor: 0.001,
  },
  {
    eventName: "dialyzer",
    samplingFactor: 0.004,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_foldingRange",
    samplingFactor: 0.0001,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_completion",
    samplingFactor: 0.001,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_codeAction",
    samplingFactor: 0.0001,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_hover",
    samplingFactor: 0.001,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_documentSymbol",
    samplingFactor: 0.0001,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "workspace_symbol",
    samplingFactor: 0.002,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_codeLens",
    samplingFactor: 0.001,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "workspace_executeCommand:getExUnitTestsInFile",
    samplingFactor: 0.0003,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_signatureHelp",
    samplingFactor: 0.001,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_definition",
    samplingFactor: 0.001,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_onTypeFormatting",
    samplingFactor: 0.002,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "textDocument_formatting",
    samplingFactor: 0.002,
  },
  {
    eventName: "lsp_request",
    propertyKey: "elixir_ls.lsp_command",
    propertyValue: "initialize",
    samplingFactor: 0.01,
  },
  {
    eventName: "dap_request",
    propertyKey: "elixir_ls.dap_command",
    propertyValue: "threads",
    samplingFactor: 0.01,
  },
  {
    eventName: "dap_request",
    propertyKey: "elixir_ls.dap_command",
    propertyValue: "initialize",
    samplingFactor: 0.1,
  },
  {
    eventName: "dap_request",
    propertyKey: "elixir_ls.dap_command",
    propertyValue: "launch",
    samplingFactor: 0.1,
  },
  {
    eventName: "dap_request",
    propertyKey: "elixir_ls.dap_command",
    propertyValue: "disconnect",
    samplingFactor: 0.1,
  },
  {
    eventName: "unhandlederror",
    samplingFactor: 0.001,
  },
];

function shouldSampleEvent(
  eventName: string,
  properties: TelemetryEventProperties | undefined,
  config: EventSamplingConfig,
): boolean {
  if (eventName !== config.eventName) {
    return false;
  }

  if (
    config.propertyKey &&
    (!properties || properties[config.propertyKey] !== config.propertyValue)
  ) {
    return false;
  }

  return true;
}

function applySampling(
  eventName: string,
  properties: TelemetryEventProperties | undefined,
  cb: (samplingFactor: number) => void,
) {
  let samplingFactor = 1; // Default sampling factor

  for (const config of samplingConfigs) {
    if (shouldSampleEvent(eventName, properties, config)) {
      samplingFactor = config.samplingFactor;
      break;
    }
  }

  if (samplingFactor === 1 || Math.random() <= samplingFactor) {
    cb(samplingFactor);
  }
}

export let reporter: TelemetryReporter;

class EnvironmentReporter extends TelemetryReporter {
  constructor() {
    super(process.env.ELS_TEST ? fakeKey : key);
  }

  override sendTelemetryEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined,
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }

    applySampling(eventName, properties, (samplingFactor) =>
      super.sendTelemetryEvent(
        eventName,
        properties,
        this.appendCount(eventName, samplingFactor, measurements),
      ),
    );
  }

  override sendTelemetryErrorEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined,
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }

    applySampling(eventName, properties, (samplingFactor) =>
      super.sendTelemetryErrorEvent(
        eventName,
        properties,
        this.appendCount(eventName, samplingFactor, measurements),
      ),
    );
  }

  override sendRawTelemetryEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined,
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }

    applySampling(eventName, properties, (samplingFactor) =>
      super.sendRawTelemetryEvent(
        eventName,
        properties,
        this.appendCount(eventName, samplingFactor, measurements),
      ),
    );
  }

  override sendDangerousTelemetryErrorEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined,
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }

    applySampling(eventName, properties, (samplingFactor) =>
      super.sendDangerousTelemetryErrorEvent(
        eventName,
        properties,
        this.appendCount(eventName, samplingFactor, measurements),
      ),
    );
  }

  override sendDangerousTelemetryEvent(
    eventName: string,
    properties?: TelemetryEventProperties | undefined,
    measurements?: TelemetryEventMeasurements | undefined,
  ): void {
    if (process.env.ELS_TEST) {
      return;
    }

    applySampling(eventName, properties, (samplingFactor) =>
      super.sendDangerousTelemetryEvent(
        eventName,
        properties,
        this.appendCount(eventName, samplingFactor, measurements),
      ),
    );
  }

  private appendCount(
    eventName: string,
    samplingFactor: number,
    measurements?: TelemetryEventMeasurements | undefined,
  ): TelemetryEventMeasurements {
    const label = `elixir_ls.${eventName}_count`;
    if (!measurements) {
      const measurementsWithCount: TelemetryEventMeasurements = {};
      // biome-ignore lint/suspicious/noExplicitAny: dynamic property access requires an explicit any cast
      (<any>measurementsWithCount)[label] = 1 / samplingFactor;
      return measurementsWithCount;
    }
    let countFound = false;
    Object.keys(measurements).forEach((key) => {
      if (key.endsWith("_count")) {
        // biome-ignore lint/suspicious/noExplicitAny: dynamic property access requires an explicit any cast
        (<any>measurements)[key] /= samplingFactor;
        countFound = true;
      }
    });
    if (!countFound) {
      // biome-ignore lint/suspicious/noExplicitAny: dynamic property access requires an explicit any cast
      (<any>measurements)[label] = 1 / samplingFactor;
    }
    return measurements;
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

export function preprocessStacktrace(originalStack: string) {
  let stack = originalStack;
  // Define the libraries you want to preserve
  const libraries = [
    "elixir_sense",
    "language_server",
    "debug_adapter",
    "elixir_ls_utils",
    "elixir",
    "mix",
    "eex",
    "ex_unit",
  ];

  for (const library of libraries) {
    // Regular expression to capture paths of the library
    const libraryPathRegex = new RegExp(`(.*)(/${library}/)([^\\s]+)`, "g");

    stack = stack.replace(
      libraryPathRegex,
      (_, _before, _libraryPath, after) => {
        const modifiedPath = after.replace(/\//g, "_");
        return `USER_PATH_${library}_${modifiedPath}`;
      },
    );
  }

  // Sanitize Elixir function arity syntax
  stack = stack.replace(/\/\d+/g, (match) => match.replace("/", "_"));

  // Sanitize Elixir key errors
  stack = stack.replace(/key (.*?) not found/g, "k_ey $1 not found");

  stack = stack.replace(/badkey/g, "badk_ey");

  stack = stack.replace(/bad key/g, "bad k_ey");

  stack = stack.replace(/unknown key/g, "unknown k_ey");

  stack = stack.replace(/does not have the key/g, "does not have the k_ey");

  stack = stack.replace(/token missing/g, "t_oken missing");

  stack = stack.replace(/unexpected token/g, "unexpected t_oken");

  stack = stack.replace(/Unexpected token/g, "Unexpected t_oken");

  stack = stack.replace(/reserved token/g, "reserved t_oken");

  const sensitiveKeywords = [
    "key",
    "token",
    "sig",
    "secret",
    "signature",
    "password",
    "passwd",
    "pwd",
    "android:value",
  ];
  sensitiveKeywords.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})[^a-zA-Z0-9]`, "gi");
    const encodeKeyword = `${keyword[0]}_${keyword.slice(1)}`;
    stack = stack.replace(regex, encodeKeyword);
  });

  // Workaround for Erlang node names being identified as emails
  stack = stack.replace(/@([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+)/g, "_at_$1");

  return stack;
}

export function preprocessStacktraceInProperties(
  properties?: TelemetryEventProperties | undefined,
): TelemetryEventProperties | undefined {
  if (!properties) {
    return properties;
  }

  // biome-ignore lint/suspicious/noExplicitAny: properties may contain arbitrary values
  for (const key in <any>properties) {
    // biome-ignore lint/suspicious/noExplicitAny: values may be of unknown type
    (<any>properties)[key] = preprocessStacktrace((<any>properties)[key]);
  }
  return properties;
}
