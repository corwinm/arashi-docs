import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const sourceRequirements = new Map<string, string[]>([
  ["docs/index.mdx", []],
  [
    "docs/getting-started/index.md",
    [
      "`aw` is a shorter alias for `arashi`",
      "macOS/Linux installer provides both `arashi` and `aw`",
      "PowerShell installer provides both `arashi` and `aw`",
      "npm installs provide both `arashi` and `aw`",
      "aw status",
      "unrelated existing `aw` command",
      "unsupported interim workaround for older releases",
      "no direct-installer ownership ledger",
      "deliberately move or remove"
    ]
  ],
  [
    "docs/commands/shell.md",
    [
      "both `arashi` and `aw`",
      "one managed block",
      "unrelated `aw` alias or function",
      "command arashi"
    ]
  ],
  [
    "docs/commands/completion.md",
    ["both `arashi` and `aw`", "command arashi"]
  ],
  [
    "docs/commands/update.md",
    ["updates both `arashi` and `aw`", "`arashi` remains canonical"]
  ]
]);

const generatedRequirements = new Map<string, string[]>([
  ["public/index.md", []],
  ["public/getting-started.md", sourceRequirements.get("docs/getting-started/index.md") ?? []],
  ["public/commands/shell.md", sourceRequirements.get("docs/commands/shell.md") ?? []],
  ["public/commands/completion.md", sourceRequirements.get("docs/commands/completion.md") ?? []],
  ["public/commands/update.md", sourceRequirements.get("docs/commands/update.md") ?? []],
  [
    "public/llms.txt",
    [
      "`aw` is a shorter alias for `arashi`",
      "Getting started"
    ]
  ],
  [
    "public/llms-full.txt",
    [
      "`aw` is a shorter alias for `arashi`",
      "macOS/Linux installer provides both `arashi` and `aw`",
      "PowerShell installer provides both `arashi` and `aw`",
      "npm installs provide both `arashi` and `aw`",
      "both `arashi` and `aw`",
      "updates both `arashi` and `aw`",
      "no direct-installer ownership ledger",
      "deliberately move or remove"
    ]
  ]
]);

const landingForbidden = [
  "ownership ledger",
  "transaction rollback",
  "payload transaction",
  "backup inventory"
];
const unsupportedAliasClaim = "A manual shell alias is equivalent to the supported `aw` executable.";
const manualWindowsPayload = [
  "arashi-windows-x64.exe",
  "arashi",
  "arashi.ps1",
  "arashi.bat",
  "aw",
  "aw.ps1",
  "aw.bat"
];
const requiredFiles = new Set([...sourceRequirements.keys(), ...generatedRequirements.keys()]);
const root = path.resolve(process.cwd());
const errors = checkRoot(root);

if (errors.length > 0) {
  console.error("Executable alias documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

runControlledMismatchTests(root);
console.log(
  "Executable alias documentation contract passed for canonical docs, generated Markdown routes, and agent-readable exports, including controlled mismatch fixtures."
);

function checkRoot(rootPath: string): string[] {
  const found: string[] = [];
  checkRequirements(rootPath, sourceRequirements, found);
  checkRequirements(rootPath, generatedRequirements, found);

  for (const relativePath of ["docs/getting-started/index.md", "public/getting-started.md"]) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    if (!content.includes("on PATH or at the destination")) {
      found.push(`${relativePath} must distinguish effective PATH and destination collisions`);
    }
    if (
      !content.includes("no direct-installer ownership ledger") ||
      !content.includes("deliberately move or remove")
    ) {
      found.push(`${relativePath} is missing manual wrapper ownership and migration guidance`);
    }
    checkManualWindowsPayload(relativePath, content, found);
  }

  for (const relativePath of ["docs/commands/shell.md", "public/commands/shell.md"]) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    if (!content.includes("unrelated `aw` alias or function")) {
      found.push(`${relativePath} is missing shell namespace collision guidance`);
    }
  }

  for (const relativePath of ["docs/index.mdx", "public/index.md"]) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    for (const text of landingForbidden) {
      if (content.toLowerCase().includes(text)) {
        found.push(`${relativePath} must not expose installer internals ${JSON.stringify(text)}`);
      }
    }
  }

  for (const relativePath of requiredFiles) {
    const content = read(rootPath, relativePath, found);
    if (content?.includes(unsupportedAliasClaim)) {
      found.push(`${relativePath} must not present a user-created shell alias as supported`);
    }
  }

  return found;
}

function checkManualWindowsPayload(relativePath: string, content: string, found: string[]): void {
  const heading = "### Manual Windows fallback";
  const sectionStart = content.indexOf(heading);
  if (sectionStart === -1) {
    found.push(`${relativePath} is missing the exact seven-file manual Windows payload section`);
    return;
  }

  const nextHeading = content.indexOf("\n### ", sectionStart + heading.length);
  const section = content.slice(sectionStart, nextHeading === -1 ? undefined : nextHeading);
  const listedAssets = [...section.matchAll(/^- `([^`]+)`$/gm)]
    .map((match) => match[1])
    .filter((asset) => asset !== "arashi-checksums.txt");
  if (
    listedAssets.length !== manualWindowsPayload.length ||
    manualWindowsPayload.some((asset, index) => listedAssets[index] !== asset)
  ) {
    found.push(`${relativePath} must list the exact seven-file manual Windows payload`);
  }
}

function checkRequirements(
  rootPath: string,
  requirements: Map<string, string[]>,
  found: string[]
): void {
  for (const [relativePath, expected] of requirements) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    for (const text of expected) {
      if (!content.includes(text)) {
        found.push(`${relativePath} is missing ${JSON.stringify(text)}`);
      }
    }
  }
}

function runControlledMismatchTests(sourceRoot: string): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-executable-alias-docs-"));
  const selfTestFailures: string[] = [];

  const resetFixture = (): void => {
    rmSync(fixtureRoot, { recursive: true, force: true });
    mkdirSync(fixtureRoot, { recursive: true });
    for (const relativePath of requiredFiles) {
      const destination = path.join(fixtureRoot, relativePath);
      mkdirSync(path.dirname(destination), { recursive: true });
      cpSync(path.join(sourceRoot, relativePath), destination);
    }
  };

  const replaceFixtureText = (relativePath: string, oldText: string, newText: string): void => {
    const fixturePath = path.join(fixtureRoot, relativePath);
    const content = readFileSync(fixturePath, "utf8");
    if (!content.includes(oldText)) {
      throw new Error(`Controlled mismatch fixture could not find ${JSON.stringify(oldText)} in ${relativePath}.`);
    }
    writeFileSync(fixturePath, content.replaceAll(oldText, newText));
  };

  const expectRejected = (label: string, diagnostic: string): void => {
    const mismatchErrors = checkRoot(fixtureRoot);
    if (!mismatchErrors.some((error) => error.includes(diagnostic))) {
      selfTestFailures.push(`${label}: expected a diagnostic containing ${JSON.stringify(diagnostic)}`);
    }
  };

  try {
    const replacementCases = [
      {
        label: "alias shorthand mutation",
        path: "docs/getting-started/index.md",
        oldText: "`aw` is a shorter alias for `arashi`",
        newText: "`aw` is now the canonical command",
        diagnostic: 'docs/getting-started/index.md is missing "`aw` is a shorter alias for `arashi`"'
      },
      {
        label: "npm channel loss",
        path: "docs/getting-started/index.md",
        oldText: "npm installs provide both `arashi` and `aw`",
        newText: "npm installs provide only the canonical command",
        diagnostic: '"npm installs provide both `arashi` and `aw`"'
      },
      {
        label: "macOS/Linux channel loss",
        path: "docs/getting-started/index.md",
        oldText: "macOS/Linux installer provides both `arashi` and `aw`",
        newText: "macOS/Linux installer provides only `arashi`",
        diagnostic: '"macOS/Linux installer provides both `arashi` and `aw`"'
      },
      {
        label: "Windows channel loss",
        path: "docs/getting-started/index.md",
        oldText: "PowerShell installer provides both `arashi` and `aw`",
        newText: "PowerShell installer provides only `arashi`",
        diagnostic: '"PowerShell installer provides both `arashi` and `aw`"'
      },
      {
        label: "effective PATH collision loss",
        path: "docs/getting-started/index.md",
        oldText: "on PATH or at the destination",
        newText: "at the destination",
        diagnostic: "effective PATH and destination collisions"
      },
      {
        label: "destination collision loss",
        path: "docs/getting-started/index.md",
        oldText: "on PATH or at the destination",
        newText: "on PATH",
        diagnostic: "effective PATH and destination collisions"
      },
      {
        label: "shell namespace collision loss",
        path: "docs/commands/shell.md",
        oldText: "An unrelated `aw` alias or function is preserved instead of being overwritten.",
        newText: "An unrelated executable is preserved instead of being overwritten.",
        diagnostic: "shell namespace collision"
      },
      {
        label: "shell dual-name loss",
        path: "docs/commands/shell.md",
        oldText: "both `arashi` and `aw`",
        newText: "the canonical command",
        diagnostic: '"both `arashi` and `aw`"'
      },
      {
        label: "completion dual-name loss",
        path: "docs/commands/completion.md",
        oldText: "both `arashi` and `aw`",
        newText: "the canonical command",
        diagnostic: '"both `arashi` and `aw`"'
      },
      {
        label: "generated Markdown-only drift",
        path: "public/getting-started.md",
        oldText: "PowerShell installer provides both `arashi` and `aw`",
        newText: "PowerShell installer provides only `arashi`",
        diagnostic: "public/getting-started.md is missing"
      },
      {
        label: "llms.txt-only drift",
        path: "public/llms.txt",
        oldText: "`aw` is a shorter alias for `arashi`",
        newText: "`aw` is the primary command",
        diagnostic: "public/llms.txt is missing"
      },
      {
        label: "llms-full.txt-only drift",
        path: "public/llms-full.txt",
        oldText: "updates both `arashi` and `aw`",
        newText: "updates the canonical command",
        diagnostic: "public/llms-full.txt is missing"
      }
    ];

    for (const fixtureCase of replacementCases) {
      resetFixture();
      replaceFixtureText(fixtureCase.path, fixtureCase.oldText, fixtureCase.newText);
      expectRejected(fixtureCase.label, fixtureCase.diagnostic);
    }

    resetFixture();
    replaceFixtureText(
      "docs/getting-started/index.md",
      "no direct-installer ownership ledger",
      "an automatically adopted installer record"
    );
    replaceFixtureText(
      "docs/getting-started/index.md",
      "deliberately move or remove",
      "leave in place during migration"
    );
    expectRejected("manual-wrapper ownership and migration loss", "manual wrapper ownership and migration guidance");

    resetFixture();
    replaceFixtureText("docs/getting-started/index.md", "- `aw.bat`", "- `aw.cmd`");
    expectRejected("exact seven-file Windows manual payload loss", "exact seven-file manual Windows payload");

    resetFixture();
    const landing = path.join(fixtureRoot, "docs/index.mdx");
    writeFileSync(
      landing,
      `${readFileSync(landing, "utf8")}\nThe installer keeps a backup inventory of managed path hashes for rollback.\n`
    );
    expectRejected("landing concision/internal leakage", "must not expose installer internals");

    resetFixture();
    const shell = path.join(fixtureRoot, "docs/commands/shell.md");
    writeFileSync(shell, `${readFileSync(shell, "utf8")}\n${unsupportedAliasClaim}\n`);
    expectRejected("unsupported user-created alias guidance", "user-created shell alias");

    if (selfTestFailures.length > 0) {
      throw new Error(
        `Executable alias checker controlled mismatch self-tests failed:\n- ${selfTestFailures.join("\n- ")}`
      );
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function read(rootPath: string, relativePath: string, found: string[]): string | null {
  try {
    return readFileSync(path.join(rootPath, relativePath), "utf8");
  } catch {
    found.push(`${relativePath} is missing`);
    return null;
  }
}
