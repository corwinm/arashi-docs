import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const sourceRequirements = new Map<string, string[]>([
  [
    "docs/index.mdx",
    [
      "`aw` means “Arashi Workspace”",
      "`arashi` remains the canonical command",
      "supported installations provide both names"
    ]
  ],
  [
    "docs/getting-started/index.md",
    [
      "`aw` means “Arashi Workspace”",
      "`arashi` remains the canonical command",
      "macOS/Linux installer provides both `arashi` and `aw`",
      "PowerShell installer provides both `arashi` and `aw`",
      "npm installs provide both `arashi` and `aw`",
      "aw status",
      "unrelated existing `aw` command",
      "unsupported interim workaround for older releases"
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
  ["public/index.md", sourceRequirements.get("docs/index.mdx") ?? []],
  ["public/getting-started.md", sourceRequirements.get("docs/getting-started/index.md") ?? []],
  ["public/commands/shell.md", sourceRequirements.get("docs/commands/shell.md") ?? []],
  ["public/commands/completion.md", sourceRequirements.get("docs/commands/completion.md") ?? []],
  ["public/commands/update.md", sourceRequirements.get("docs/commands/update.md") ?? []],
  [
    "public/llms.txt",
    [
      "`aw` means “Arashi Workspace”",
      "`arashi` remains canonical",
      "supported npm, macOS/Linux, and Windows installations provide both names",
      "Getting started"
    ]
  ],
  [
    "public/llms-full.txt",
    [
      "`aw` means “Arashi Workspace”",
      "`arashi` remains the canonical command",
      "macOS/Linux installer provides both `arashi` and `aw`",
      "PowerShell installer provides both `arashi` and `aw`",
      "npm installs provide both `arashi` and `aw`",
      "both `arashi` and `aw`",
      "updates both `arashi` and `aw`"
    ]
  ]
]);

const landingForbidden = ["ownership ledger", "transaction rollback", "payload transaction"];
const unsupportedAliasClaim = "A manual shell alias is equivalent to the supported `aw` executable.";
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
  try {
    for (const relativePath of requiredFiles) {
      const destination = path.join(fixtureRoot, relativePath);
      mkdirSync(path.dirname(destination), { recursive: true });
      cpSync(path.join(sourceRoot, relativePath), destination);
    }

    const gettingStarted = path.join(fixtureRoot, "docs/getting-started/index.md");
    writeFileSync(
      gettingStarted,
      readFileSync(gettingStarted, "utf8").replaceAll(
        "npm installs provide both `arashi` and `aw`",
        "npm installs provide only the canonical command"
      )
    );
    const channelErrors = checkRoot(fixtureRoot);
    if (!channelErrors.some((error) => error.includes('"npm installs provide both `arashi` and `aw`"'))) {
      throw new Error("Executable alias checker self-test did not reject channel drift.");
    }

    const landing = path.join(fixtureRoot, "docs/index.mdx");
    writeFileSync(landing, `${readFileSync(landing, "utf8")}\n${landingForbidden[0]}\n`);
    const landingErrors = checkRoot(fixtureRoot);
    if (!landingErrors.some((error) => error.includes("must not expose installer internals"))) {
      throw new Error("Executable alias checker self-test did not reject landing-page internals.");
    }

    const shell = path.join(fixtureRoot, "docs/commands/shell.md");
    writeFileSync(shell, `${readFileSync(shell, "utf8")}\n${unsupportedAliasClaim}\n`);
    const shellErrors = checkRoot(fixtureRoot);
    if (!shellErrors.some((error) => error.includes("user-created shell alias"))) {
      throw new Error("Executable alias checker self-test did not reject unsupported alias guidance.");
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
