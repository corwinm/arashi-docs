import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const kittyWorkflowRequirements = [
  "Kitty 0.43 or newer",
  "`allow_remote_control`",
  "password policy",
  "after integrated IDE detection and before parent-shell `cd`",
  "exact Arashi worktree identity",
  "readable `<repo-name>: <branch-name>` label",
  "focuses and validates",
  "live only",
  "`.kitty-session`",
  "`arashi remove` does not close Kitty windows or sessions",
  "Close stale Kitty windows manually",
  "no `--kitty` flag",
  "does not add Kitty to persistent Arashi launch configuration",
  "`LAUNCH_FAILED`",
  "does not fall back",
  "created worktrees remain available"
];

const requirements = new Map<string, string[]>([
  ["docs/workflows/kitty.md", kittyWorkflowRequirements],
  [
    "docs/commands/switch.md",
    [
      "tmux → Herdr → cmux → integrated IDE → Kitty → parent-shell `cd` → terminal/platform fallback",
      "reuses and focuses the exact live worktree window",
      "[Kitty workflow guide](/workflows/kitty/)",
      "does not fall back"
    ]
  ],
  [
    "docs/commands/create.md",
    [
      "same managed Kitty reuse-or-launch flow as `arashi switch`",
      "created worktrees remain available",
      "[Kitty workflow guide](/workflows/kitty/)"
    ]
  ],
  ["docs/workflows/index.md", ["[Kitty](/workflows/kitty/)"]],
  [
    "docs/workflows/config.md",
    [
      "tmux, Herdr, cmux, integrated IDE, and Kitty",
      "Kitty remains auto-detected only",
      "[Kitty workflow guide](/workflows/kitty/)"
    ]
  ],
  ["public/workflows/kitty.md", kittyWorkflowRequirements],
  [
    "public/workflows/config.md",
    [
      "tmux, Herdr, cmux, integrated IDE, and Kitty",
      "Kitty remains auto-detected only",
      "[Kitty workflow guide](/workflows/kitty/)"
    ]
  ],
  [
    "public/commands/switch.md",
    [
      "tmux → Herdr → cmux → integrated IDE → Kitty → parent-shell `cd` → terminal/platform fallback",
      "reuses and focuses the exact live worktree window"
    ]
  ],
  ["public/commands/create.md", ["same managed Kitty reuse-or-launch flow as `arashi switch`"]],
  [
    "public/llms.txt",
    [
      "Kitty 0.43+",
      "exact live worktree window",
      "Kitty workflow",
      "https://arashi.haphazard.dev/workflows/kitty/",
      "Kitty workflow Markdown",
      "https://arashi.haphazard.dev/workflows/kitty.md"
    ]
  ],
  [
    "public/llms-full.txt",
    [
      "Source: https://arashi.haphazard.dev/workflows/kitty/",
      ...kittyWorkflowRequirements,
      "same managed Kitty reuse-or-launch flow as `arashi switch`"
    ]
  ]
]);

const root = path.resolve(process.cwd());
const errors = checkRoot(root);
if (errors.length > 0) {
  console.error("Managed Kitty session documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

runOutOfRepositoryMismatchTest(root);
console.log(`Managed Kitty session documentation contract passed for ${requirements.size} source/export surfaces and rejected a deliberate out-of-repository mismatch.`);

function checkRoot(rootPath: string): string[] {
  const found: string[] = [];

  for (const [relativePath, expectedText] of requirements) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    for (const text of expectedText) {
      if (!content.includes(text)) {
        found.push(`${relativePath} is missing ${JSON.stringify(text)}`);
      }
    }
  }

  checkStructuredContracts(rootPath, found);
  checkWorkflowCoverage(rootPath, found);
  return found;
}

function checkStructuredContracts(rootPath: string, found: string[]): void {
  const switchContract = parseJson(rootPath, "contracts/switch-config.json", found);
  if (switchContract !== null) {
    const expectedModes = ["auto", "cd", "launch", "sesh", "herdr"];
    const expectedAutoOrder = ["tmux", "herdr", "cmux", "ide", "kitty", "cd", "platform"];
    if (JSON.stringify(switchContract.modes) !== JSON.stringify(expectedModes)) {
      found.push("contracts/switch-config.json changes the persistent switch mode vocabulary for Kitty");
    }
    if (JSON.stringify(switchContract.autoOrder) !== JSON.stringify(expectedAutoOrder)) {
      found.push("contracts/switch-config.json does not place Kitty after IDE and before cd");
    }
  }

  const createContract = parseJson(rootPath, "contracts/create-launch-config.json", found);
  if (createContract !== null) {
    const expectedModes = ["none", "auto", "sesh", "herdr"];
    if (JSON.stringify(createContract.modes) !== JSON.stringify(expectedModes)) {
      found.push("contracts/create-launch-config.json changes the persistent create launch vocabulary for Kitty");
    }
  }
}

function checkWorkflowCoverage(rootPath: string, found: string[]): void {
  const workflow = read(rootPath, ".github/workflows/docs-validate.yml", found);
  if (workflow !== null && !workflow.includes("run: pnpm validate:kitty-session-docs")) {
    found.push(".github/workflows/docs-validate.yml must run pnpm validate:kitty-session-docs");
  }

  const packageJson = parseJson(rootPath, "package.json", found);
  if (packageJson !== null) {
    if (packageJson.scripts?.["validate:kitty-session-docs"] !== "pnpm sync:content && node scripts/check-kitty-session-docs.ts") {
      found.push("package.json must define validate:kitty-session-docs");
    }
    if (!packageJson.scripts?.validate?.includes("pnpm validate:kitty-session-docs")) {
      found.push("package.json validate must run validate:kitty-session-docs");
    }
  }
}

function runOutOfRepositoryMismatchTest(sourceRoot: string): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-kitty-docs-"));
  try {
    for (const relativePath of new Set([
      ...requirements.keys(),
      "contracts/switch-config.json",
      "contracts/create-launch-config.json",
      ".github/workflows/docs-validate.yml",
      "package.json"
    ])) {
      mkdirSync(path.dirname(path.join(fixtureRoot, relativePath)), { recursive: true });
      cpSync(path.join(sourceRoot, relativePath), path.join(fixtureRoot, relativePath), {
        recursive: true
      });
    }

    const workflowPath = path.join(fixtureRoot, "docs/workflows/kitty.md");
    const valid = readFileSync(workflowPath, "utf8");
    writeFileSync(workflowPath, valid.replaceAll("Kitty 0.43 or newer", "Kitty 0.42 or newer"));
    const mismatchErrors = checkRoot(fixtureRoot);
    if (!mismatchErrors.some((error) => error.includes('"Kitty 0.43 or newer"'))) {
      throw new Error("Managed Kitty session documentation checker self-test failed to reject a deliberate minimum-version mismatch.");
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function parseJson(rootPath: string, relativePath: string, found: string[]): any | null {
  const raw = read(rootPath, relativePath, found);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    found.push(`${relativePath} is not valid JSON`);
    return null;
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
