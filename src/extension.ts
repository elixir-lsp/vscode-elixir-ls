/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";

import { execSync } from "child_process";
import { which } from "shelljs";
import { ExtensionContext, languages, window, workspace } from "vscode";
import { LanguageClient, LanguageClientOptions, RevealOutputChannelOn, ServerOptions } from "vscode-languageclient";
import { configuration } from "./configuration";
import { configureElixirLS } from "./ex_ls";

export function activate(context: ExtensionContext) {
  testElixir();

  const serverOpts: Thenable<ServerOptions> = configureElixirLS(context);

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for Elixir documents
    documentSelector: [
      { language: "elixir", scheme: "file" },
      { language: "elixir", scheme: "untitled" },
    ],
    // Don't focus the Output pane on errors because request handler errors are no big deal
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    synchronize: {
      // Synchronize the setting section 'elixirLS' to the server
      configurationSection: "elixirLS",
      // Notify the server about file changes to Elixir files contained in the workspace
      fileEvents: [
        workspace.createFileSystemWatcher("**/*.{ex,exs,erl,yrl,xrl,eex}"),
      ],
    },
  };

  // Create the language client and start the client.
  serverOpts.then((serverOptions) => {
    if (serverOptions === null) {
      return;
    }

    const disposable = new LanguageClient(
      "ElixirLS",
      "ElixirLS",
      serverOptions,
      clientOptions,
    ).start();

    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);

    context.subscriptions.push(
      languages.setLanguageConfiguration("elixir", configuration),
    );
  });
}

function testElixirCommand(command: string) {
  try {
    return execSync(`${command} -e ""`);
  } catch {
    return false;
  }
}

function testElixir() {
  let testResult = testElixirCommand("elixir");
  if (testResult === false) {
    // Try finding elixir in the path directly
    const elixirPath = which("elixir");
    if (elixirPath) {
      testResult = testElixirCommand(elixirPath);
    }
  }

  if (!testResult) {
    window.showErrorMessage(
      "Failed to run 'elixir' command. ElixirLS will probably fail to launch. Logged PATH to Development Console.",
    );
    console.warn(
      `Failed to run 'elixir' command. Current process's PATH: ${
        process.env.PATH
      }`,
    );
    return false;
  } else if (testResult.length > 0) {
    window.showErrorMessage(
      "Running 'elixir' command caused extraneous print to stdout. See VS Code's developer console for details.",
    );
    console.warn(
      "Running 'elixir -e \"\"' printed to stdout:\n" + testResult.toString(),
    );
    return false;
  } else {
    return true;
  }
}
