import { readFileSync } from "node:fs";
import path from "node:path";

const sourceRequirements = new Map<string, string[]>([
  [
    "docs/getting-started/index.md",
    [
      ".git/info/exclude",
      "--ignore-scope tracked",
      "--ignore-scope none",
      "--zero-config",
      "In non-bare repositories, `init` keeps the managed `reposDir` and `worktreesDir` out of Git status",
      "Non-bare repositories default to `.arashi/worktrees`; bare repositories default to `..`.",
      "An explicit `--worktrees-dir` takes precedence",
      "persisted as `worktreesDir` in `.arashi/config.json`"
    ]
  ],
  [
    "docs/workflows/config.md",
    ["arashi.ignoreScope", "core.excludesFile", "init", "pull", "clone", "add", "create"]
  ],
  [
    "docs/commands/init.md",
    [
      "--ignore-scope <local|tracked|none>",
      ".git/info/exclude",
      "arashi.ignoreScope",
      "Non-bare repositories default to `.arashi/worktrees`; bare repositories default to `..`.",
      "An explicit `--worktrees-dir` takes precedence",
      "persisted as `worktreesDir` in `.arashi/config.json`",
      "external and unsafe",
      "non-applicable to working-tree ignore rules",
      "does not run `git check-ignore` or write ignore files",
      "`local` reports local scope",
      "`tracked` may preserve the clone-local scope preference",
      "`none` reports classifications without ignore-file changes"
    ]
  ],
  ["docs/commands/pull.md", ["reloads", "original filters", "arashi clone", "managed ignore"]],
  [
    "docs/commands/clone.md",
    ["before materializing", "repository-local default", "partial result"]
  ],
  [
    "docs/commands/add.md",
    ["before config and repository materialization", "rollback boundary", "global Git"]
  ],
  [
    "docs/commands/create.md",
    ["before creating any parent or child worktree", "--dry-run", "changed/restored"]
  ],
  ["docs/commands/doctor.md", ["managed ignore", "does not repair"]],
  ["docs/workflows/agents-and-specs.md", ["global Git", "managedIgnore"]],
  ["docs/workflows/json-automation.md", ["managedIgnore", "effective source", "restored"]]
]);

const generatedRequirements = new Map<string, string[]>([
  [
    "public/getting-started.md",
    [
      ".git/info/exclude",
      "--ignore-scope tracked",
      "Non-bare repositories default to `.arashi/worktrees`; bare repositories default to `..`.",
      "An explicit `--worktrees-dir` takes precedence",
      "persisted as `worktreesDir` in `.arashi/config.json`"
    ]
  ],
  ["public/workflows/config.md", ["arashi.ignoreScope", "core.excludesFile"]],
  ["public/workflows/json-automation.md", ["managedIgnore", "restored"]],
  [
    "public/commands/init.md",
    [
      "--ignore-scope <local|tracked|none>",
      "Non-bare repositories default to `.arashi/worktrees`; bare repositories default to `..`.",
      "An explicit `--worktrees-dir` takes precedence",
      "persisted as `worktreesDir` in `.arashi/config.json`",
      "external and unsafe",
      "non-applicable to working-tree ignore rules",
      "does not run `git check-ignore` or write ignore files",
      "`local` reports local scope",
      "`tracked` may preserve the clone-local scope preference",
      "`none` reports classifications without ignore-file changes"
    ]
  ],
  ["public/commands/pull.md", ["original filters", "managed ignore"]],
  ["public/commands/clone.md", ["repository-local default", "partial result"]],
  ["public/commands/add.md", ["rollback boundary", "global Git"]],
  ["public/commands/create.md", ["--dry-run", "changed/restored"]],
  ["public/commands/doctor.md", ["managed ignore", "does not repair"]],
  ["public/workflows/agents-and-specs.md", ["global Git", "managedIgnore"]],
  ["public/llms.txt", ["repository-local", "global Git configuration"]],
  [
    "public/llms-full.txt",
    [
      ".git/info/exclude",
      "--ignore-scope tracked",
      "--ignore-scope none",
      "managedIgnore",
      "Non-bare repositories default to `.arashi/worktrees`; bare repositories default to `..`.",
      "An explicit `--worktrees-dir` takes precedence",
      "persisted as `worktreesDir` in `.arashi/config.json`",
      "external and unsafe",
      "non-applicable to working-tree ignore rules",
      "does not run `git check-ignore` or write ignore files"
    ]
  ]
]);

const errors: string[] = [];

checkRequirements(sourceRequirements);
checkRequirements(generatedRequirements);

if (errors.length > 0) {
  console.error("Managed-ignore documentation contract failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Managed-ignore documentation contract passed for ${sourceRequirements.size} source pages and ${generatedRequirements.size} generated exports.`
);

function checkRequirements(requirements: Map<string, string[]>): void {
  for (const [relativePath, expectedText] of requirements) {
    const filePath = path.resolve(relativePath);
    let content: string;

    try {
      content = readFileSync(filePath, "utf8");
    } catch {
      errors.push(`${relativePath} is missing`);
      continue;
    }

    for (const text of expectedText) {
      if (!content.includes(text)) {
        errors.push(`${relativePath} is missing ${JSON.stringify(text)}`);
      }
    }
  }
}
