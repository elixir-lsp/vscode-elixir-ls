/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";

import * as path from "path";

import { workspace, Disposable, ExtensionContext } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  SettingMonitor,
  ServerOptions,
  TransportKind
} from "vscode-languageclient";
import { platform } from "os";

export function activate(context: ExtensionContext) {
  const releasePath = context.asAbsolutePath(
    path.join(".", "elixir-ls-release")
  );
  const scriptName = platform() == "win32" ? "exscript.bat" : "exscript.sh";
  const exscriptPath = path.join(releasePath, scriptName);
  const languageServerPath = path.join(releasePath, "language_server");

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: { command: exscriptPath, args: [languageServerPath] },
    debug: { command: exscriptPath, args: [languageServerPath] }
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for Elixir documents
    documentSelector: ["elixir"],
    synchronize: {
      // Synchronize the setting section 'elixirLS' to the server
      configurationSection: "elixirLS",
      // Notify the server about file changes to Elixir files contained in the workspace
      fileEvents: [
        workspace.createFileSystemWatcher("**/*.{ex,exs,erl,yrl,xrl,eex")
      ]
    }
  };

  // Create the language client and start the client.
  let disposable = new LanguageClient(
    "ElixirLS",
    "ElixirLS",
    serverOptions,
    clientOptions
  ).start();

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(disposable);
}
