import { createHash } from "node:crypto";
import * as vscode from "vscode";
import { buildScriptPath } from "./executable";
import type { WorkspaceTracker } from "./project";

// Must match the id in contributes.mcpServerDefinitionProviders.
const PROVIDER_ID = "elixirLS.mcp";

// ElixirLS exposes its MCP server over TCP. This script bridges the server's TCP
// transport to the stdio transport VS Code's MCP client speaks. It is shipped in
// the ElixirLS release (the release task copies ./scripts).
const BRIDGE_SCRIPT = "tcp_to_stdio_bridge.exs";

// Mirrors ElixirLS `Server.calculate_mcp_port/2` / `hash_root_uri/1`:
//   port = mcpPort, if set to a positive integer
//        = 3789 + (md5(root_uri) |> :binary.decode_unsigned() |> rem(1000))
// `root_uri` is the LSP rootUri the client sends, which is the workspace folder's
// `uri.toString()`. md5 digest is big-endian, matching :binary.decode_unsigned/1.
function hashRootUri(rootUri: string): number {
  const digest = createHash("md5").update(rootUri).digest();
  return Number(BigInt(`0x${digest.toString("hex")}`) % 1000n);
}

function calculateMcpPort(folder: vscode.WorkspaceFolder): number {
  const configured = vscode.workspace
    .getConfiguration("elixirLS", folder)
    .get<number>("mcpPort");
  if (typeof configured === "number" && configured > 0) {
    return configured;
  }
  return 3789 + hashRootUri(folder.uri.toString());
}

function isMcpEnabled(folder: vscode.WorkspaceFolder): boolean {
  return (
    vscode.workspace
      .getConfiguration("elixirLS", folder)
      .get<boolean>("mcpEnabled") === true
  );
}

/**
 * Registers ElixirLS's built-in MCP server with VS Code's MCP infrastructure so
 * users no longer need a hand-written mcp.json. One stdio server definition is
 * provided per (outermost) workspace folder that has `elixirLS.mcpEnabled` set;
 * each launches the TCP→stdio bridge against that workspace's predictable port.
 *
 * Note: if the predictable port was busy and the server fell back to another
 * port, the bridge (which targets the predictable port) will not connect — the
 * same limitation as manual configuration. Setting `elixirLS.mcpPort` removes the
 * ambiguity.
 */
export function configureMcp(
  context: vscode.ExtensionContext,
  workspaceTracker: WorkspaceTracker,
): void {
  // Gate on the API surface — forks (Cursor/Windsurf) and older builds that claim
  // engine 1.105 may not implement the MCP provider API.
  if (typeof vscode.lm?.registerMcpServerDefinitionProvider !== "function") {
    console.log(
      "ElixirLS: MCP server definition provider API unavailable, skipping registration",
    );
    return;
  }

  const didChangeEmitter = new vscode.EventEmitter<void>();
  context.subscriptions.push(didChangeEmitter);

  const provider: vscode.McpServerDefinitionProvider = {
    onDidChangeMcpServerDefinitions: didChangeEmitter.event,
    provideMcpServerDefinitions: () => {
      const folders = vscode.workspace.workspaceFolders ?? [];
      const seen = new Set<string>();
      const definitions: vscode.McpServerDefinition[] = [];

      for (const folder of folders) {
        // Nested folders share a single language server (and its MCP server) on
        // the outermost folder — dedupe so we don't launch duplicate bridges.
        const outer = workspaceTracker.getOuterMostWorkspaceFolder(folder);
        const key = outer.uri.toString();
        if (seen.has(key) || !isMcpEnabled(outer)) {
          continue;
        }
        seen.add(key);

        const port = calculateMcpPort(outer);
        const definition = new vscode.McpStdioServerDefinition(
          `ElixirLS MCP (${outer.name})`,
          "elixir",
          [buildScriptPath(context, BRIDGE_SCRIPT), String(port)],
          {},
          context.extension.packageJSON.version,
        );
        // Run in the project dir so version managers (asdf/mise) resolve Elixir.
        definition.cwd = outer.uri;
        definitions.push(definition);
      }

      return definitions;
    },
  };

  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider(PROVIDER_ID, provider),
  );

  // Re-query when the set of folders or the MCP-related settings change.
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => didChangeEmitter.fire()),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("elixirLS.mcpEnabled") ||
        event.affectsConfiguration("elixirLS.mcpPort")
      ) {
        didChangeEmitter.fire();
      }
    }),
  );
}
