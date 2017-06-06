/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';

import { workspace, Disposable, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {

	const serverPath = context.asAbsolutePath(path.join(".", "elixir_ls", "apps", "language_server"));
	
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const args = ["run", "--no-halt", "--no-compile", "--no-deps-check"]
	let serverOptions: ServerOptions = {
		run: {command: "mix", args: args, options: {cwd: serverPath}},
		debug: {command: "mix", args: args, options: {cwd: serverPath}},
	}
	
	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for Elixir documents
		documentSelector: ['elixir'],
		synchronize: {
			// Synchronize the setting section 'elixirLS' to the server
			// configurationSection: 'elixirLS',
			// Notify the server about file changes to Elixir files contained in the workspace
			fileEvents: [
				workspace.createFileSystemWatcher('**/*.ex'),
				workspace.createFileSystemWatcher('**/*.exs')
			]
		}
	}
	
	// Create the language client and start the client.
	let disposable = new LanguageClient('elixirIDE', 'Elixir IDE', serverOptions, clientOptions).start();
	
	// Push the disposable to the context's subscriptions so that the 
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);
}
