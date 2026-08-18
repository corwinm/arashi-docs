import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const commands = [
  "add", "clone", "completion", "create", "doctor", "exec", "handoff", "init",
  "install", "list", "move", "prune", "pull", "push", "remove", "setup", "shell",
  "status", "switch", "sync", "update",
];
const commandPattern = commands.join("|");
const optionPattern = String.raw`-{1,2}[\w-]+(?:=[^\s\x60]+)?`;
const quotedLegacyExecutable = String.raw`(?<![\w./@-])(?:&\s+)?(?:"arashi"|'arashi')`;
const legacyInvocation = new RegExp(
  String.raw`(?:(?:\bcommand\s+)?(?<![./@-])\barashi|${quotedLegacyExecutable})\s+(?:--(?:help|version)\b|<command>(?=\s|\x60|$)|(?:(?:${optionPattern})(?:\s+(?!(?:${commandPattern})\b|${optionPattern})[^\s\x60]+)?\s+)*(?:${commandPattern})\b)`,
  "g",
);
const compatibilityNote = "`arashi` executable remains supported for existing scripts and workflows";

function isIntentionalLegacyExample(
  line: string,
  start: number,
  end: number,
  inDatedManualAcceptanceOutcomes: boolean,
): boolean {
  const before = line.slice(0, start);
  const after = line.slice(end);
  const clauseStart = Math.max(before.lastIndexOf(";"), before.lastIndexOf("."), before.lastIndexOf("!"), before.lastIndexOf("?")) + 1;
  const clausePrefix = before.slice(clauseStart);

  if (
    inDatedManualAcceptanceOutcomes &&
    /^\s*-\s+\[[xX]\]\s+/.test(line) &&
    /\bcompleted\b/i.test(clausePrefix) &&
    /\barashi\b["']?\s+--version\b/i.test(line.slice(start, end)) &&
    /^`?\s+returned\s+`?v?\d+(?:\.\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?`?(?=[\s.,;!?]|$)/i.test(after)
  ) {
    return true;
  }

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

function logicalShellLines(content: string): Array<{ line: string; lineNumber: number; inDatedManualAcceptanceOutcomes: boolean }> {
  const physicalLines = content.split(/\r?\n/);
  const logicalLines: Array<{ line: string; lineNumber: number; inDatedManualAcceptanceOutcomes: boolean }> = [];
  let inDatedManualAcceptanceOutcomes = false;
  let powerShellFence: "`" | "~" | null = null;
  for (let index = 0; index < physicalLines.length; index += 1) {
    const lineNumber = index + 1;
    let line = physicalLines[index];
    if (/^#{1,6}\s+/.test(line)) {
      inDatedManualAcceptanceOutcomes = /^#{1,6}\s+Manual Acceptance Outcomes\s+\(\d{4}-\d{2}-\d{2}\)\s*$/.test(line);
    }
    const fence = line.match(/^\s*(`{3,}|~{3,})\s*([A-Za-z0-9_-]*)\s*$/);
    if (fence && powerShellFence === fence[1][0]) {
      powerShellFence = null;
    } else if (fence && powerShellFence === null && /^(?:powershell|pwsh)$/i.test(fence[2])) {
      powerShellFence = fence[1][0] as "`" | "~";
    }
    while (
      (/\\[ \t]*$/.test(line) || (powerShellFence !== null && /(?<!`)`$/.test(line))) &&
      index + 1 < physicalLines.length
    ) {
      line = line.replace(powerShellFence !== null && /(?<!`)`$/.test(line) ? /`$/ : /\\[ \t]*$/, " ") +
        physicalLines[index + 1].trimStart();
      index += 1;
    }
    logicalLines.push({ line, lineNumber, inDatedManualAcceptanceOutcomes });
  }
  return logicalLines;
}

export function findPreferredArashiInvocations(content: string, source: string): string[] {
  return logicalShellLines(content).flatMap(({ line, lineNumber, inDatedManualAcceptanceOutcomes }) => {
    legacyInvocation.lastIndex = 0;
    return [...line.matchAll(legacyInvocation)]
      .filter((match) => !isIntentionalLegacyExample(
        line,
        match.index,
        match.index + match[0].length,
        inDatedManualAcceptanceOutcomes,
      ))
      .map(() => `${source}:${lineNumber}: preferred examples must use aw: ${line.trim()}`);
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
  checkDistributionSemantics(root, errors);
  return errors;
}

const distributionRequirements = new Map<string, Array<[text: string, diagnostic: string]>>([
  ["docs/getting-started/index.md", [
    ["macOS/Linux installer provides both `arashi` and `aw`", "macOS/Linux dual-name installation"],
    ["PowerShell installer provides both `arashi` and `aw`", "PowerShell dual-name installation"],
    ["npm installs provide both `arashi` and `aw`", "npm dual-name installation"],
    ["on PATH or at the destination", "effective PATH and destination collisions"],
    ["no direct-installer ownership ledger", "manual wrapper ownership and migration"],
    ["deliberately move or remove the complete manual payload", "manual wrapper ownership and migration"],
  ]],
  ["docs/commands/shell.md", [
    ["both activation lines in one managed block", "managed shell integration"],
    ["native completion for both executable names", "dual-name shell integration"],
    ["unrelated `aw` alias or function", "shell namespace collision"],
  ]],
  ["docs/commands/completion.md", [
    ["registers both `arashi` and `aw`", "dual-name completion"],
  ]],
  ["docs/commands/update.md", [
    ["refreshes both `arashi` and `aw`", "dual-name update"],
  ]],
  ["public/getting-started.md", [
    ["macOS/Linux installer provides both `arashi` and `aw`", "macOS/Linux dual-name installation"],
    ["PowerShell installer provides both `arashi` and `aw`", "PowerShell dual-name installation"],
    ["npm installs provide both `arashi` and `aw`", "npm dual-name installation"],
    ["on PATH or at the destination", "effective PATH and destination collisions"],
    ["no direct-installer ownership ledger", "manual wrapper ownership and migration"],
    ["deliberately move or remove the complete manual payload", "manual wrapper ownership and migration"],
  ]],
  ["public/commands/shell.md", [
    ["both activation lines in one managed block", "managed shell integration"],
    ["native completion for both executable names", "dual-name shell integration"],
    ["unrelated `aw` alias or function", "shell namespace collision"],
  ]],
  ["public/commands/completion.md", [
    ["registers both `arashi` and `aw`", "dual-name completion"],
  ]],
  ["public/commands/update.md", [
    ["refreshes both `arashi` and `aw`", "dual-name update"],
  ]],
  ["public/llms-full.txt", [
    ["macOS/Linux installer provides both `arashi` and `aw`", "macOS/Linux dual-name installation"],
    ["PowerShell installer provides both `arashi` and `aw`", "PowerShell dual-name installation"],
    ["npm installs provide both `arashi` and `aw`", "npm dual-name installation"],
    ["native completion for both executable names", "dual-name shell integration"],
    ["registers both `arashi` and `aw`", "dual-name completion"],
    ["refreshes both `arashi` and `aw`", "dual-name update"],
    ["no direct-installer ownership ledger", "manual wrapper ownership and migration"],
    ["deliberately move or remove the complete manual payload", "manual wrapper ownership and migration"],
  ]],
]);

const manualWindowsPayload = [
  "arashi-windows-x64.exe", "arashi", "arashi.ps1", "arashi.bat", "aw", "aw.ps1", "aw.bat",
];
const landingForbidden = ["ownership ledger", "transaction rollback", "payload transaction", "backup inventory"];

function checkDistributionSemantics(root: string, errors: string[]): void {
  for (const [relativePath, requirements] of distributionRequirements) {
    const content = readFileSync(path.join(root, relativePath), "utf8");
    for (const [text, diagnostic] of requirements) {
      if (!content.includes(text)) errors.push(`${relativePath} is missing ${diagnostic}: ${JSON.stringify(text)}`);
    }
  }

  for (const relativePath of ["docs/getting-started/index.md", "public/getting-started.md", "public/llms-full.txt"]) {
    const content = readFileSync(path.join(root, relativePath), "utf8");
    const heading = "### Manual Windows fallback";
    const sectionStart = content.indexOf(heading);
    const nextHeading = content.indexOf("\n### ", sectionStart + heading.length);
    const section = sectionStart === -1 ? "" : content.slice(sectionStart, nextHeading === -1 ? undefined : nextHeading);
    const listedAssets = [...section.matchAll(/^- `([^`]+)`$/gm)]
      .map((match) => match[1])
      .filter((asset) => asset !== "arashi-checksums.txt");
    if (listedAssets.length !== manualWindowsPayload.length || manualWindowsPayload.some((asset, index) => listedAssets[index] !== asset)) {
      errors.push(`${relativePath} must list the exact seven-file manual Windows payload`);
    }
  }

  for (const relativePath of ["docs/index.mdx", "public/index.md"]) {
    const content = readFileSync(path.join(root, relativePath), "utf8").toLowerCase();
    for (const text of landingForbidden) {
      if (content.includes(text)) errors.push(`${relativePath} must not expose installer internals ${JSON.stringify(text)}`);
    }
  }

  for (const relativePath of distributionRequirements.keys()) {
    const content = readFileSync(path.join(root, relativePath), "utf8");
    if (/manual shell alias is equivalent to the supported (?:`?aw`?) executable/i.test(content)) {
      errors.push(`${relativePath} must not present a user-created shell alias as supported`);
    }
  }
}

function runDistributionControlledMismatchTests(sourceRoot: string): string[] {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-executable-distribution-docs-"));
  const failures: string[] = [];
  const resetFixture = (): void => {
    rmSync(fixtureRoot, { recursive: true, force: true });
    cpSync(path.join(sourceRoot, "docs"), path.join(fixtureRoot, "docs"), { recursive: true });
    cpSync(path.join(sourceRoot, "public"), path.join(fixtureRoot, "public"), { recursive: true });
  };
  const replaceFixtureText = (relativePath: string, oldText: string, newText: string): void => {
    const fixturePath = path.join(fixtureRoot, relativePath);
    const content = readFileSync(fixturePath, "utf8");
    if (!content.includes(oldText)) throw new Error(`Missing controlled fixture text ${JSON.stringify(oldText)} in ${relativePath}`);
    writeFileSync(fixturePath, content.replace(oldText, newText));
  };
  const cases = [
    ["POSIX dual-name install", "docs/getting-started/index.md", "macOS/Linux installer provides both `arashi` and `aw`", "macOS/Linux installer provides only `aw`", "macOS/Linux dual-name installation"],
    ["PowerShell dual-name install", "docs/getting-started/index.md", "PowerShell installer provides both `arashi` and `aw`", "PowerShell installer provides only `aw`", "PowerShell dual-name installation"],
    ["npm dual-name install", "docs/getting-started/index.md", "npm installs provide both `arashi` and `aw`", "npm installs provide only `aw`", "npm dual-name installation"],
    ["effective PATH collision", "docs/getting-started/index.md", "on PATH or at the destination", "at the destination", "effective PATH and destination collisions"],
    ["destination collision", "docs/getting-started/index.md", "on PATH or at the destination", "on PATH", "effective PATH and destination collisions"],
    ["manual wrapper ownership", "docs/getting-started/index.md", "no direct-installer ownership ledger", "an automatically adopted installer record", "manual wrapper ownership and migration"],
    ["manual wrapper migration", "docs/getting-started/index.md", "deliberately move or remove the complete manual payload", "leave the complete manual payload in place", "manual wrapper ownership and migration"],
    ["Windows payload", "docs/getting-started/index.md", "- `aw.bat`", "- `aw.cmd`", "exact seven-file manual Windows payload"],
    ["shell managed block", "docs/commands/shell.md", "both activation lines in one managed block", "one activation line", "managed shell integration"],
    ["shell dual names", "docs/commands/shell.md", "native completion for both executable names", "native completion for aw", "dual-name shell integration"],
    ["shell collision", "docs/commands/shell.md", "unrelated `aw` alias or function", "unrelated executable", "shell namespace collision"],
    ["completion dual names", "docs/commands/completion.md", "registers both `arashi` and `aw`", "registers only `aw`", "dual-name completion"],
    ["update dual names", "docs/commands/update.md", "refreshes both `arashi` and `aw`", "refreshes only `aw`", "dual-name update"],
    ["generated Markdown drift", "public/getting-started.md", "PowerShell installer provides both `arashi` and `aw`", "PowerShell installer provides only `aw`", "public/getting-started.md"],
    ["generated shell drift", "public/commands/shell.md", "native completion for both executable names", "native completion for aw", "public/commands/shell.md"],
    ["generated completion drift", "public/commands/completion.md", "registers both `arashi` and `aw`", "registers only `aw`", "public/commands/completion.md"],
    ["generated update drift", "public/commands/update.md", "refreshes both `arashi` and `aw`", "refreshes only `aw`", "public/commands/update.md"],
    ["LLM full export drift", "public/llms-full.txt", "npm installs provide both `arashi` and `aw`", "npm installs provide only `aw`", "public/llms-full.txt"],
  ] as const;
  try {
    for (const [label, relativePath, oldText, newText, diagnostic] of cases) {
      resetFixture();
      replaceFixtureText(relativePath, oldText, newText);
      const errors = checkRepository(fixtureRoot);
      if (!errors.some((error) => error.includes(diagnostic))) {
        failures.push(`${label}: expected diagnostic containing ${JSON.stringify(diagnostic)}`);
      }
    }

    resetFixture();
    const landing = path.join(fixtureRoot, "docs/index.mdx");
    writeFileSync(landing, `${readFileSync(landing, "utf8")}\nThe installer keeps a backup inventory for rollback.\n`);
    if (!checkRepository(fixtureRoot).some((error) => error.includes("installer internals"))) {
      failures.push("landing concision: expected installer internals diagnostic");
    }

    resetFixture();
    const shell = path.join(fixtureRoot, "docs/commands/shell.md");
    writeFileSync(shell, `${readFileSync(shell, "utf8")}\nA manual shell alias is equivalent to the supported aw executable.\n`);
    if (!checkRepository(fixtureRoot).some((error) => error.includes("user-created shell alias"))) {
      failures.push("unsupported alias claim: expected user-created shell alias diagnostic");
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
  return failures;
}

function selfTest(): string[] {
  const failures: string[] = [];
  const rejected = findPreferredArashiInvocations(
    [
      "Run `arashi status` and `arashi create topic`.",
      "```bash",
      "arashi --json status",
      "arashi --json \\",
      "  status",
      "arashi --json --verbose status",
      "```",
      "```powershell",
      "arashi --json `",
      "  status",
      "```",
      "Historical note aside, run `arashi status` now.",
      `${compatibilityNote}; new users should run \`arashi status\`.`,
      "Run `\"arashi\" status`.",
      "Run `'arashi' --help`.",
      "```bash",
      "\"arashi\" --json \\",
      "  status",
      "```",
      "```powershell",
      "& \"arashi\" --json status",
      "& 'arashi' create topic",
      "& \"arashi\" --json `",
      "  status",
      "```",
    ].join("\n"),
    "negative.md",
  );
  if (rejected.length !== 14 || !rejected.every((error) => error.startsWith("negative.md:"))) {
    failures.push(`negative preferred-command fixtures produced ${rejected.length} diagnostics instead of 14`);
  }
  const valid = [
    "npm install -g arashi",
    "npm install -g \"arashi\"",
    "npm install -g 'arashi'",
    "The package identifier is \"arashi\".",
    "Use the paths \"/opt/arashi\" and './vendor/arashi'.",
    "See \"https://github.com/corwinm/arashi\".",
    "https://github.com/corwinm/arashi",
    "`.arashi/config.json` and `ARASHI_CONFIG_PATH`",
    "`arashi-windows-x64.exe`, `arashi.ps1`, and `arashi.binaryPath`",
    "Historical evidence: `arashi status` was shown in the 1.0 release.",
    "Historical evidence: `\"arashi\" status` was shown in the 1.0 release.",
    "The `arashi` executable remains supported for existing scripts and workflows; `arashi status` remains valid there.",
    "The `arashi` executable remains supported for existing scripts and workflows; `\"arashi\" status` remains valid there.",
    "The incomplete identifier is `arashi --json`\nstatus is documented separately.",
    "The quoted identifier is `\"arashi\" --json`\nstatus is documented separately.",
    "```powershell\narashi --json ``\nstatus\n```",
    "Run `aw status`.",
  ].join("\n");
  if (findPreferredArashiInvocations(valid, "positive.md").length !== 0) {
    failures.push("positive identifier/history/compatibility fixture was rejected");
  }
  const recordedOutcomes = [
    "## Manual Acceptance Outcomes (2026-02-11)\n- [x] npm install flow: `npm install -g arashi --prefix <temp-dir>` completed and `arashi --version` returned `1.4.0`.",
    "## Manual Acceptance Outcomes (2026-02-11)\n- [x] PowerShell smoke test completed and `& \"arashi\" --version` returned `1.4.0`.",
  ];
  recordedOutcomes.forEach((fixture, index) => {
    if (findPreferredArashiInvocations(fixture, `recorded-outcome-${index + 1}.md`).length !== 0) {
      failures.push(`completed dated manual acceptance outcome ${index + 1} was rejected`);
    }
  });
  const historicalOutcomeControls = [
    "## Manual Acceptance Outcomes (2026-02-11)\n- [ ] Run `arashi --version` and record the returned version after the test is completed.",
    "## Release record\n- [x] 2026-02-11: `arashi --version` returned `1.4.0`.",
    "## Manual Acceptance Outcomes (2026-02-11)\n- [x] Legacy smoke test: `arashi status` completed successfully.",
  ];
  historicalOutcomeControls.forEach((fixture, index) => {
    if (findPreferredArashiInvocations(fixture, `historical-control-${index + 1}.md`).length !== 1) {
      failures.push(`historical outcome control ${index + 1} was not rejected exactly once`);
    }
  });
  return failures;
}

const errors = [
  ...checkRepository(process.cwd()),
  ...selfTest(),
  ...runDistributionControlledMismatchTests(process.cwd()),
];
if (errors.length > 0) {
  console.error("Primary documented command policy failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("Primary documented command policy passed for authored docs, generated Markdown, and LLM exports with positive/negative fixtures.");
