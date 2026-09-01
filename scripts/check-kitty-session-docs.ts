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
  "`aw remove` does not close Kitty windows or sessions",
  "Close stale Kitty windows manually",
  "no `--kitty` flag",
  "not added to persistent launch configuration",
  "`LAUNCH_FAILED`",
  "does not fall back",
  "created worktrees remain available",
  "[Kitty identity lock](/reference/launching/#kitty-identity-lock)"
];

const kittyLockRequirements = [
  "cross-process identity lock",
  "10 seconds",
  "live owner",
  "dead owner",
  "30 seconds",
  "Ownership-safe release"
];

const requirements = new Map<string, string[]>([
  ["docs/workflows/kitty.md", kittyWorkflowRequirements],
  ["docs/reference/launching.md", kittyLockRequirements],
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
      "same managed Kitty reuse-or-launch flow as `aw switch`",
      "created worktrees remain available",
      "[Kitty workflow guide](/workflows/kitty/)"
    ]
  ],
  ["docs/workflows/index.md", ["[Kitty](/workflows/kitty/)"]],

  ["public/workflows/kitty.md", kittyWorkflowRequirements],
  ["public/reference/launching.md", kittyLockRequirements],

  [
    "public/commands/switch.md",
    [
      "tmux → Herdr → cmux → integrated IDE → Kitty → parent-shell `cd` → terminal/platform fallback",
      "reuses and focuses the exact live worktree window"
    ]
  ],
  ["public/commands/create.md", ["same managed Kitty reuse-or-launch flow as `aw switch`"]],
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
      ...kittyLockRequirements,
      "same managed Kitty reuse-or-launch flow as `aw switch`"
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

function runOutOfRepositoryMismatchTest(sourceRoot: string): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-kitty-docs-"));
  try {
    for (const relativePath of new Set([
      ...requirements.keys(),
      "contracts/switch-config.json",
      "contracts/create-launch-config.json"
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
