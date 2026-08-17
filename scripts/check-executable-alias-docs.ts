import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const commands = [
  "add", "clone", "completion", "create", "doctor", "exec", "handoff", "init",
  "install", "list", "move", "prune", "pull", "push", "remove", "setup", "shell",
  "status", "switch", "sync", "update",
];
const commandPattern = commands.join("|");
const optionPattern = String.raw`-{1,2}[\w-]+(?:=[^\s\x60]+)?`;
const legacyInvocation = new RegExp(
  String.raw`(?:\bcommand\s+)?(?<![./@-])\barashi\s+(?:--(?:help|version)\b|<command>(?=\s|\x60|$)|(?:${optionPattern})(?:\s+(?!(?:${commandPattern})\b|--?)[^\s\x60]+)?\s+(?:${commandPattern})\b|(?:${commandPattern})\b)`,
  "g",
);
const compatibilityNote = "`arashi` executable remains supported for existing scripts and workflows";

function isIntentionalLegacyExample(line: string, start: number, end: number): boolean {
  const before = line.slice(0, start);
  const after = line.slice(end);
  const clauseStart = Math.max(before.lastIndexOf(";"), before.lastIndexOf("."), before.lastIndexOf("!"), before.lastIndexOf("?")) + 1;
  const clausePrefix = before.slice(clauseStart);

  if (/\bhistorical\s+(?:example|evidence|record|note)\s*:\s*[^;.!?]*$/i.test(clausePrefix)) {
    return true;
  }
  if (
    /\b(?:was|were)\s+(?:shown|used|documented)\b|\bpreviously\s+(?:used|documented)\b|\b(?:older|earlier)\s+(?:releases?|versions?)\b/i.test(after) &&
    /\b(?:historical|history)\b/i.test(clausePrefix)
  ) {
    return true;
  }

  const compatibilityStart = line.indexOf(compatibilityNote);
  return compatibilityStart !== -1 && compatibilityStart < start &&
    /\bremains?\s+(?:supported|valid|available)\b|\bcontinues?\s+to\s+(?:work|be supported)\b/i.test(after);
}

export function findPreferredArashiInvocations(content: string, source: string): string[] {
  return content.split(/\r?\n/).flatMap((line, index) => {
    legacyInvocation.lastIndex = 0;
    return [...line.matchAll(legacyInvocation)]
      .filter((match) => !isIntentionalLegacyExample(line, match.index, match.index + match[0].length))
      .map(() => `${source}:${index + 1}: preferred examples must use aw: ${line.trim()}`);
  });
}

function walk(root: string, extensions: Set<string>): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) return walk(absolute, extensions);
    return extensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

function checkRepository(root: string): string[] {
  const docsRoot = path.join(root, "docs");
  const publicRoot = path.join(root, "public");
  const sources = [
    ...walk(docsRoot, new Set([".md", ".mdx"])),
    ...walk(publicRoot, new Set([".md", ".txt"])),
  ];
  const errors = sources.flatMap((absolute) => {
    const source = path.relative(root, absolute);
    return findPreferredArashiInvocations(readFileSync(absolute, "utf8"), source);
  });

  const authored = walk(docsRoot, new Set([".md", ".mdx"]))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const noteCount = authored.split(compatibilityNote).length - 1;
  if (noteCount !== 1) errors.push(`docs must contain exactly one compatibility note; found ${noteCount}`);
  const gettingStarted = readFileSync(path.join(docsRoot, "getting-started/index.md"), "utf8");
  if (!gettingStarted.includes(compatibilityNote)) {
    errors.push("docs/getting-started/index.md must own the concise compatibility note");
  }

  for (const generated of ["getting-started.md", "llms.txt", "llms-full.txt"]) {
    const content = readFileSync(path.join(publicRoot, generated), "utf8");
    const count = content.split(compatibilityNote).length - 1;
    if (count !== 1) errors.push(`public/${generated} must contain the compatibility note exactly once; found ${count}`);
  }
  return errors;
}

function selfTest(): string[] {
  const failures: string[] = [];
  const rejected = findPreferredArashiInvocations(
    [
      "Run `arashi status` and `arashi create topic`.",
      "```bash",
      "arashi --json status",
      "```",
      "Historical note aside, run `arashi status` now.",
      `${compatibilityNote}; new users should run \`arashi status\`.`,
    ].join("\n"),
    "negative.md",
  );
  if (rejected.length !== 5 || !rejected.every((error) => error.startsWith("negative.md:"))) {
    failures.push(`negative preferred-command fixtures produced ${rejected.length} diagnostics instead of 5`);
  }
  const valid = [
    "npm install -g arashi",
    "https://github.com/corwinm/arashi",
    "`.arashi/config.json` and `ARASHI_CONFIG_PATH`",
    "`arashi-windows-x64.exe`, `arashi.ps1`, and `arashi.binaryPath`",
    "Historical evidence: `arashi status` was shown in the 1.0 release.",
    "The `arashi` executable remains supported for existing scripts and workflows; `arashi status` remains valid there.",
    "Run `aw status`.",
  ].join("\n");
  if (findPreferredArashiInvocations(valid, "positive.md").length !== 0) {
    failures.push("positive identifier/history/compatibility fixture was rejected");
  }
  return failures;
}

const errors = [...checkRepository(process.cwd()), ...selfTest()];
if (errors.length > 0) {
  console.error("Primary documented command policy failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("Primary documented command policy passed for authored docs, generated Markdown, and LLM exports with positive/negative fixtures.");
