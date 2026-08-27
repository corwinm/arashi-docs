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
      "Non-bare workspaces keep managed worktrees inside the workspace by default, while bare workspaces place them alongside the bare repository.",
      "[init command reference](/commands/init/)"
    ]
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
      "Existing configurations are not migrated automatically",
      "`.arashi/worktrees` remains its compatibility fallback",
      "external and unsafe",
      "non-applicable to working-tree ignore rules",
      "does not run `git check-ignore` or write ignore files",
      "`local` reports local scope",
      "`tracked` may preserve the clone-local scope preference",
      "`none` reports classifications without ignore-file changes"
    ]
  ],
  ["docs/commands/pull.md", ["reloads", "original filters", "aw clone", "managed ignore"]],
  [
    "docs/commands/clone.md",
    [
      "before materializing",
      "repository-local default",
      "partial result",
      ".arashi/worktrees/feature/auth-refresh"
    ]
  ],
  [
    "docs/commands/add.md",
    ["before config and repository materialization", "global Git", "linked parent worktree", "canonical clone", "active child worktree", "single active-workspace clone", "Do not clone the child twice manually"]
  ],
  [
    "docs/commands/create.md",
    ["before creating any parent or child worktree", "--dry-run", "changed/restored"]
  ],
  ["docs/commands/doctor.md", ["managed ignore", "does not repair"]]
]);

const generatedRequirements = new Map<string, string[]>([
  [
    "public/getting-started.md",
    [
      ".git/info/exclude",
      "--ignore-scope tracked",
      "Non-bare workspaces keep managed worktrees inside the workspace by default, while bare workspaces place them alongside the bare repository.",
      "[init command reference](/commands/init/)"
    ]
  ],

  [
    "public/commands/init.md",
    [
      "--ignore-scope <local|tracked|none>",
      "Non-bare repositories default to `.arashi/worktrees`; bare repositories default to `..`.",
      "An explicit `--worktrees-dir` takes precedence",
      "persisted as `worktreesDir` in `.arashi/config.json`",
      "Existing configurations are not migrated automatically",
      "`.arashi/worktrees` remains its compatibility fallback",
      "external and unsafe",
      "non-applicable to working-tree ignore rules",
      "does not run `git check-ignore` or write ignore files",
      "`local` reports local scope",
      "`tracked` may preserve the clone-local scope preference",
      "`none` reports classifications without ignore-file changes"
    ]
  ],
  ["public/commands/pull.md", ["original filters", "managed ignore"]],
  [
    "public/commands/clone.md",
    ["repository-local default", "partial result", ".arashi/worktrees/feature/auth-refresh"]
  ],
  [
    "public/commands/add.md",
    ["global Git", "linked parent worktree", "canonical clone", "active child worktree", "single active-workspace clone", "Do not clone the child twice manually"]
  ],
  ["public/commands/create.md", ["--dry-run", "changed/restored"]],
  ["public/commands/doctor.md", ["managed ignore", "does not repair"]],
  [
    "public/llms.txt",
    ["repository-local", "global Git configuration", "linked parent worktree", "[Add command Markdown](https://arashi.haphazard.dev/commands/add.md)"]
  ],
  [
    "public/llms-full.txt",
    [
      ".git/info/exclude",
      "--ignore-scope tracked",
      "--ignore-scope none",
      "Non-bare repositories default to `.arashi/worktrees`; bare repositories default to `..`.",
      "An explicit `--worktrees-dir` takes precedence",
      "persisted as `worktreesDir` in `.arashi/config.json`",
      "Existing configurations are not migrated automatically",
      "`.arashi/worktrees` remains its compatibility fallback",
      "external and unsafe",
      "non-applicable to working-tree ignore rules",
      "does not run `git check-ignore` or write ignore files",
      "linked parent worktree",
      "canonical clone",
      "active child worktree",
      "single active-workspace clone",
      "Do not clone the child twice manually",
      ".arashi/worktrees/feature/auth-refresh"
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
