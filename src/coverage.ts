import * as vscode from "vscode";

// Per-file coverage as emitted by the debug adapter's ExUnit formatter. In
// addition to lines, it reports per-function (declaration) coverage and
// per-clause (branch) coverage for genuine multi-clause functions, neither of
// which Mix/ExUnit's own coverage output exposes.
export interface CoverageFile {
  file: string;
  // statement coverage: [lineNumber (1-based), hitCount]
  lines: [number, number][];
  // declaration coverage: one entry per function
  functions?: { name: string; line: number; count: number }[];
  // branch coverage: clause counts grouped by their (multi-clause) function,
  // hosted on the function's definition line
  branches?: {
    line: number;
    branches: { line: number; count: number; label: string }[];
  }[];
}

interface BranchHit {
  line: number;
  count: number;
  label: string;
}

interface FileCov {
  // line (1-based) -> accumulated hit count
  lines: Map<number, number>;
  // "name@line" -> function declaration with accumulated count
  functions: Map<string, { name: string; line: number; count: number }>;
  // host line -> ("line:label" -> branch with accumulated count)
  branches: Map<number, Map<string, BranchHit>>;
}

// file uri string -> coverage
type RunCoverage = Map<string, FileCov>;

// Detailed coverage is retained per run so VS Code can lazily request it via
// TestRunProfile.loadDetailedCoverage after the run has finished.
const runCoverage = new WeakMap<vscode.TestRun, RunCoverage>();

function emptyFileCov(): FileCov {
  return { lines: new Map(), functions: new Map(), branches: new Map() };
}

function summarize(uri: vscode.Uri, cov: FileCov): vscode.FileCoverage {
  let coveredLines = 0;
  for (const count of cov.lines.values()) {
    if (count > 0) {
      coveredLines++;
    }
  }
  const statement = new vscode.TestCoverageCount(coveredLines, cov.lines.size);

  let declaration: vscode.TestCoverageCount | undefined;
  if (cov.functions.size > 0) {
    let coveredFns = 0;
    for (const fn of cov.functions.values()) {
      if (fn.count > 0) {
        coveredFns++;
      }
    }
    declaration = new vscode.TestCoverageCount(coveredFns, cov.functions.size);
  }

  let totalBranches = 0;
  let coveredBranches = 0;
  for (const group of cov.branches.values()) {
    for (const branch of group.values()) {
      totalBranches++;
      if (branch.count > 0) {
        coveredBranches++;
      }
    }
  }
  const branch =
    totalBranches > 0
      ? new vscode.TestCoverageCount(coveredBranches, totalBranches)
      : undefined;

  return new vscode.FileCoverage(uri, statement, branch, declaration);
}

/**
 * Records a batch of file coverage for a run, merging with any coverage already
 * seen in the same run (a run may span several `mix test` sessions). The merged
 * summary is (re)published to the run via `addCoverage`.
 */
export function recordCoverage(
  run: vscode.TestRun,
  files: CoverageFile[],
): void {
  let perRun = runCoverage.get(run);
  if (!perRun) {
    perRun = new Map();
    runCoverage.set(run, perRun);
  }

  for (const file of files) {
    const uri = vscode.Uri.file(file.file);
    const key = uri.toString();

    let cov = perRun.get(key);
    if (!cov) {
      cov = emptyFileCov();
      perRun.set(key, cov);
    }

    for (const [line, count] of file.lines) {
      cov.lines.set(line, (cov.lines.get(line) ?? 0) + count);
    }

    for (const fn of file.functions ?? []) {
      const fnKey = `${fn.name}@${fn.line}`;
      const prev = cov.functions.get(fnKey);
      cov.functions.set(fnKey, {
        name: fn.name,
        line: fn.line,
        count: (prev?.count ?? 0) + fn.count,
      });
    }

    for (const group of file.branches ?? []) {
      let hosted = cov.branches.get(group.line);
      if (!hosted) {
        hosted = new Map();
        cov.branches.set(group.line, hosted);
      }
      for (const branch of group.branches) {
        const branchKey = `${branch.line}:${branch.label}`;
        const prev = hosted.get(branchKey);
        hosted.set(branchKey, {
          line: branch.line,
          label: branch.label,
          count: (prev?.count ?? 0) + branch.count,
        });
      }
    }

    run.addCoverage(summarize(uri, cov));
  }
}

/**
 * Resolves detailed coverage for a file, used by the Coverage run profile's
 * `loadDetailedCoverage`. Returns per-line StatementCoverage (with branch
 * coverage attached on function-definition lines that host multi-clause
 * branches) and per-function DeclarationCoverage.
 */
export function loadDetailedCoverage(
  run: vscode.TestRun,
  file: vscode.FileCoverage,
): vscode.FileCoverageDetail[] {
  const cov = runCoverage.get(run)?.get(file.uri.toString());
  if (!cov) {
    return [];
  }

  const details: vscode.FileCoverageDetail[] = [];

  // Statement (line) coverage, including any function-definition lines that host
  // branch coverage even if `:cover` did not report them as executable lines.
  const lines = new Set<number>([...cov.lines.keys(), ...cov.branches.keys()]);
  for (const line of lines) {
    const count = cov.lines.get(line) ?? 0;
    const hosted = cov.branches.get(line);
    const branches = hosted
      ? [...hosted.values()].map(
          (branch) =>
            new vscode.BranchCoverage(
              branch.count,
              new vscode.Position(branch.line - 1, 0),
              branch.label,
            ),
        )
      : [];
    details.push(
      new vscode.StatementCoverage(
        count,
        new vscode.Position(line - 1, 0),
        branches,
      ),
    );
  }

  // Declaration (function) coverage.
  for (const fn of cov.functions.values()) {
    details.push(
      new vscode.DeclarationCoverage(
        fn.name,
        fn.count,
        new vscode.Position(fn.line - 1, 0),
      ),
    );
  }

  return details;
}
