import * as path from "path";

import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    const disableGpu = process.env.DISABLE_GPU == "1" ? ["--disable-gpu"] : [];

    // single elixir file no workspace
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath: path.resolve(__dirname, "./noWorkspaceElixirFile"),
      launchArgs: [
        ...disableGpu,
        path.resolve(__dirname, "../../src/test-fixtures/elixir_script.exs"),
      ],
    });

    // single non elixir file no workspace
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath: path.resolve(__dirname, "./noWorkspace"),
      launchArgs: [
        ...disableGpu,
        path.resolve(__dirname, "../../src/test-fixtures/non_elixir.txt"),
      ],
    });

    // single folder no mix
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath: path.resolve(__dirname, "./singleFolderNoMix"),
      launchArgs: [
        ...disableGpu,
        path.resolve(__dirname, "../../src/test-fixtures/single_folder_no_mix"),
      ],
    });

    // single folder mix
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath: path.resolve(__dirname, "./singleFolderMix"),
      launchArgs: [
        ...disableGpu,
        path.resolve(__dirname, "../../src/test-fixtures/single_folder_mix"),
      ],
    });

    // multi root
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath: path.resolve(__dirname, "./multiRoot"),
      launchArgs: [
        ...disableGpu,
        path.resolve(
          __dirname,
          "../../src/test-fixtures/multi_root.code-workspace"
        ),
      ],
    });
  } catch (err) {
    console.error(err);
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
