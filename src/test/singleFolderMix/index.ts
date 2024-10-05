import * as path from "node:path";
import { glob } from "glob";
import * as Mocha from "mocha";

export async function run(
  testsRoot: string,
  cb: (error: unknown, failures?: number) => void,
) {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  try {
    const files = await glob("**/**.test.js", { cwd: testsRoot });
    // Add files to the test suite
    // biome-ignore lint/complexity/noForEach: <explanation>
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

    try {
      // Run the mocha test
      mocha.run((failures) => {
        cb(null, failures);
      });
    } catch (err) {
      cb(err);
    }
  } catch (globError) {
    cb(globError);
  }
}
