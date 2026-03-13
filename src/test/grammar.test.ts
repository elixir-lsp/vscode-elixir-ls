import * as assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import { loadWASM, OnigScanner, OnigString } from "vscode-oniguruma";
import {
  type IGrammar,
  INITIAL,
  type IOnigLib,
  type IRawGrammar,
  parseRawGrammar,
  Registry,
} from "vscode-textmate";

const REPO_ROOT = path.resolve(__dirname, "../../");

async function createOnigLib(): Promise<IOnigLib> {
  const wasmPath = path.join(
    REPO_ROOT,
    "node_modules/vscode-oniguruma/release/onig.wasm",
  );
  const fileBuffer = fs.readFileSync(wasmPath);
  const wasmBin = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  );
  await loadWASM(wasmBin);
  return {
    createOnigScanner: (patterns: string[]) => new OnigScanner(patterns),
    createOnigString: (s: string) => new OnigString(s),
  };
}

function loadGrammarFile(name: string): IRawGrammar {
  const grammarPath = path.join(REPO_ROOT, "syntaxes", name);
  const content = fs.readFileSync(grammarPath, "utf8");
  return parseRawGrammar(content, grammarPath);
}

function stubShellGrammar(): IRawGrammar {
  return parseRawGrammar(
    JSON.stringify({
      scopeName: "source.shell",
      patterns: [
        {
          match:
            "\\b(echo|if|then|fi|for|do|done|while|case|esac|function|return|exit|set|export|local)\\b",
          name: "keyword.control.shell",
        },
      ],
    }),
    "shell.json",
  );
}

async function createRegistry(): Promise<Registry> {
  const onigLib = createOnigLib();
  const grammars: Record<string, string> = {
    "source.elixir": "elixir.json",
  };
  return new Registry({
    onigLib,
    loadGrammar: async (scopeName: string) => {
      const file = grammars[scopeName];
      if (file) {
        return loadGrammarFile(file);
      }
      if (scopeName === "source.shell") {
        return stubShellGrammar();
      }
      return null;
    },
  });
}

/** Tokenize a multi-line string and return all tokens with their scopes. */
function tokenizeLines(grammar: IGrammar, text: string) {
  const lines = text.split("\n");
  let ruleStack = INITIAL;
  const result: Array<{ line: number; text: string; scopes: string[] }> = [];
  for (let i = 0; i < lines.length; i++) {
    const lineTokens = grammar.tokenizeLine(lines[i], ruleStack);
    for (const token of lineTokens.tokens) {
      result.push({
        line: i,
        text: lines[i].substring(token.startIndex, token.endIndex),
        scopes: token.scopes,
      });
    }
    ruleStack = lineTokens.ruleStack;
  }
  return result;
}

/** Check that at least one token in the line has a scope matching the predicate. */
function assertScopeOnLine(
  tokens: ReturnType<typeof tokenizeLines>,
  lineIndex: number,
  scopeSubstring: string,
  message?: string,
) {
  const lineTokens = tokens.filter((t) => t.line === lineIndex);
  const found = lineTokens.some((t) =>
    t.scopes.some((s) => s.includes(scopeSubstring)),
  );
  assert.ok(
    found,
    message ||
      `Expected scope containing "${scopeSubstring}" on line ${lineIndex}, got scopes: ${JSON.stringify(
        lineTokens.map((t) => ({ text: t.text, scopes: t.scopes })),
        null,
        2,
      )}`,
  );
}

/** Check that no token in the line has a scope matching the predicate. */
function assertNoScopeOnLine(
  tokens: ReturnType<typeof tokenizeLines>,
  lineIndex: number,
  scopeSubstring: string,
  message?: string,
) {
  const lineTokens = tokens.filter((t) => t.line === lineIndex);
  const found = lineTokens.some((t) =>
    t.scopes.some((s) => s.includes(scopeSubstring)),
  );
  assert.ok(
    !found,
    message ||
      `Expected no scope containing "${scopeSubstring}" on line ${lineIndex}, but found: ${JSON.stringify(
        lineTokens
          .filter((t) => t.scopes.some((s) => s.includes(scopeSubstring)))
          .map((t) => ({ text: t.text, scopes: t.scopes })),
        null,
        2,
      )}`,
  );
}

suite("Bash sigil grammar tests", () => {
  let grammar: IGrammar;

  suiteSetup(async () => {
    const registry = await createRegistry();
    const g = await registry.loadGrammar("source.elixir");
    if (!g) {
      throw new Error("Failed to load Elixir grammar");
    }
    grammar = g;
  });

  suite("~BASH", () => {
    test("heredoc with double quotes gets source.shell scope", () => {
      const tokens = tokenizeLines(grammar, 'x = ~BASH"""\necho "hello"\n"""');
      assertScopeOnLine(tokens, 1, "source.shell");
    });

    test("heredoc with double quotes and modifiers closes properly", () => {
      const tokens = tokenizeLines(
        grammar,
        'result = ~BASH"""\necho before\nfalse\necho after\n    """eS',
      );
      assertScopeOnLine(tokens, 1, "source.shell");
      // Line 4 ("""eS) should have the end punctuation, not source.shell content
      const endTokens = tokens.filter(
        (t) =>
          t.line === 4 &&
          t.scopes.some((s) =>
            s.includes("punctuation.definition.string.end"),
          ),
      );
      assert.ok(
        endTokens.length > 0,
        `Expected closing delimiter on line 4, tokens: ${JSON.stringify(
          tokens
            .filter((t) => t.line === 4)
            .map((t) => ({ text: t.text, scopes: t.scopes })),
          null,
          2,
        )}`,
      );
    });

    test("double quote sigil does not consume past closing quote", () => {
      const tokens = tokenizeLines(
        grammar,
        '~BASH"false; echo printed"S == "printed\\n"',
      );
      // The == should NOT be inside source.shell
      const eqTokens = tokens.filter(
        (t) => t.text === "==" || t.text === " == ",
      );
      for (const t of eqTokens) {
        assert.ok(
          !t.scopes.some((s) => s === "source.shell"),
          `== should not be in source.shell scope, got: ${JSON.stringify(t.scopes)}`,
        );
      }
    });

    test("heredoc with single quotes gets source.shell scope", () => {
      const tokens = tokenizeLines(grammar, "x = ~BASH'''\necho 'hello'\n'''");
      assertScopeOnLine(tokens, 1, "source.shell");
    });

    test("curlies get source.shell scope", () => {
      const tokens = tokenizeLines(grammar, '~BASH{echo "hello"}');
      assertScopeOnLine(tokens, 0, "source.shell");
    });

    test("brackets get source.shell scope", () => {
      const tokens = tokenizeLines(grammar, "~BASH[echo hello]");
      assertScopeOnLine(tokens, 0, "source.shell");
    });

    test("parens get source.shell scope", () => {
      const tokens = tokenizeLines(grammar, "~BASH(echo hello)");
      assertScopeOnLine(tokens, 0, "source.shell");
    });

    test("angle brackets get source.shell scope", () => {
      const tokens = tokenizeLines(grammar, "~BASH<echo hello>");
      assertScopeOnLine(tokens, 0, "source.shell");
    });

    test("pipes get source.shell scope", () => {
      const tokens = tokenizeLines(grammar, "~BASH|echo hello|");
      assertScopeOnLine(tokens, 0, "source.shell");
    });

    test("slashes get source.shell scope", () => {
      const tokens = tokenizeLines(grammar, "~BASH/echo hello/");
      assertScopeOnLine(tokens, 0, "source.shell");
    });

    test("double quotes get source.shell scope", () => {
      const tokens = tokenizeLines(grammar, '~BASH"echo hello"');
      assertScopeOnLine(tokens, 0, "source.shell");
    });

    test("single quotes get source.shell scope", () => {
      const tokens = tokenizeLines(grammar, "~BASH'echo hello'");
      assertScopeOnLine(tokens, 0, "source.shell");
    });

    test("supports Elixir interpolation", () => {
      const tokens = tokenizeLines(grammar, "~BASH{echo #{name}}");
      const interpolationTokens = tokens.filter(
        (t) =>
          t.line === 0 &&
          t.scopes.some((s) => s.includes("meta.embedded.line.elixir")),
      );
      assert.ok(
        interpolationTokens.length > 0,
        "Expected interpolation tokens",
      );
    });

    test("accepts flags after closing delimiter", () => {
      const tokens = tokenizeLines(grammar, "~BASH{echo hello}SEO");
      const endTokens = tokens.filter(
        (t) =>
          t.line === 0 &&
          t.scopes.some((s) => s.includes("punctuation.definition.string.end")),
      );
      assert.ok(
        endTokens.length > 0,
        "Expected closing delimiter to be recognized",
      );
    });
  });

  suite("does not interfere with other sigils", () => {
    test("~r still gets regexp scope", () => {
      const tokens = tokenizeLines(grammar, "~r{foo.*bar}");
      assertScopeOnLine(tokens, 0, "string.regexp");
    });

    test("~s gets generic string scope, not shell", () => {
      const tokens = tokenizeLines(grammar, "~s{hello world}");
      assertNoScopeOnLine(tokens, 0, "source.shell");
    });

    test("~w gets generic string scope, not shell", () => {
      const tokens = tokenizeLines(grammar, "~w{one two three}");
      assertNoScopeOnLine(tokens, 0, "source.shell");
    });
  });
});
