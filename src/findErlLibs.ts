import { platform } from "os";
import * as upath from "upath";
import * as path from "path";

function findErlLibs(baseDir = null) {
  baseDir = baseDir || path.join(__dirname, "..");
  const releasePath = upath.normalize(path.join(baseDir, "elixir-ls-release"))
  const pathSeparator = platform() == "win32" ? ";" : ":";
  const prevErlLibs = process.env["ERL_LIBS"];
  return prevErlLibs
    ? prevErlLibs + pathSeparator + releasePath
    : releasePath;
}

export default findErlLibs;
