#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

function loadYaml(relPath) {
  return yaml.load(fs.readFileSync(path.join(__dirname, relPath), "utf8"));
}

function escapeChar(ch) {
  const specials = [
    "{",
    "}",
    "[",
    "]",
    "<",
    ">",
    "(",
    ")",
    "/",
    "\\",
    '"',
    "'",
    "|",
  ];
  return specials.includes(ch) ? `\\${ch}` : ch;
}

function buildSigils(conf) {
  const patterns = [];
  for (const h of conf.interpolated.heredocs) {
    patterns.push({
      begin: `~[a-z](?>${h.delim})`,
      beginCaptures: {
        0: { name: "punctuation.definition.string.begin.elixir" },
      },
      comment: "Double-quoted heredocs sigils",
      end: `^\\s*${h.delim}`,
      endCaptures: { 0: { name: "punctuation.definition.string.end.elixir" } },
      name: h.name,
      patterns: [
        { include: "#interpolated_elixir" },
        { include: "#escaped_char" },
      ],
    });
  }
  for (const d of conf.interpolated.delimiters) {
    patterns.push({
      begin: `~[a-z]\\${escapeChar(d.open)}`,
      beginCaptures: {
        0: { name: "punctuation.definition.string.begin.elixir" },
      },
      comment: "sigil (allow for interpolation)",
      end: `\\${escapeChar(d.close)}[a-z]*`,
      endCaptures: { 0: { name: "punctuation.definition.string.end.elixir" } },
      name: "string.quoted.double.interpolated.elixir",
      patterns: [
        { include: "#interpolated_elixir" },
        { include: "#escaped_char" },
        ...(d.nest ? [{ include: d.nest }] : []),
      ],
    });
  }
  for (const h of conf.literal.heredocs) {
    patterns.push({
      begin: `~[A-Z][A-Z0-9]*(?>${h.delim})`,
      beginCaptures: {
        0: { name: "punctuation.definition.string.begin.elixir" },
      },
      comment: "Double-quoted heredocs sigils",
      end: `^\\s*${h.delim}`,
      endCaptures: { 0: { name: "punctuation.definition.string.end.elixir" } },
      name: h.name,
    });
  }
  for (const d of conf.literal.delimiters) {
    const pat = {
      begin: `~[A-Z][A-Z0-9]*\\${escapeChar(d.open)}`,
      beginCaptures: {
        0: { name: "punctuation.definition.string.begin.elixir" },
      },
      comment: "sigil (without interpolation)",
      end: `\\${escapeChar(d.close)}[a-z]*`,
      endCaptures: { 0: { name: "punctuation.definition.string.end.elixir" } },
      name: "string.quoted.double.literal.elixir",
    };
    if (d.nest) pat.patterns = [{ include: d.nest }];
    patterns.push(pat);
  }
  return { patterns };
}

const base = loadYaml("../syntaxes/yaml/elixir.yml");
const sigils = loadYaml("../syntaxes/yaml/sigils.yml");
const modules = loadYaml("../syntaxes/yaml/modules.yml");

base.patterns = modules.concat(base.patterns);
base.repository.sigils = buildSigils(sigils);

fs.writeFileSync(
  path.join(__dirname, "../syntaxes/elixir.json"),
  JSON.stringify(base, null, 2),
);
