import { readFileSync } from "node:fs";
import path from "node:path";

const hooksLink = "/workflows/hooks/";

const sourceRequirements = new Map<string, string[]>([
  [
    "docs/workflows/hooks.md",
    [
      "pre-create.<repo>",
      "after that repository worktree is materialized",
      "before move-changes or switch/launch handling",
      "repository → workspace → global-targeted → global-shared",
      "once per target repository",
      "ARASHI_HOOK_EXECUTION_PATH",
      "ARASHI_HOOK_TARGET_REPOSITORY",
      "ARASHI_HOOK_TARGET_REPO_PATH",
      "ARASHI_HOOK_TARGET_WORKTREE_PATH",
      "ARASHI_REMOVE_TARGETS_JSON",
      "lossy and non-canonical",
      "supported throughout 1.x",
      "no earlier than 2.0",
      "300000",
      ".ps1",
      ".cmd",
      ".bat",
      "does not discover `.sh`",
      "ARASHI_HOOK_INPUT",
      "tty",
      "disabled",
      "unavailable",
      "immediate EOF",
      "--no-hook-input",
      "--no-hooks",
      "--interactive",
      "invocation-only",
      "attribution",
      "sequentially",
      "without adding a prefix or newline",
      "Ctrl-C",
      "read",
      "Read-Host",
      "set /p",
      "passwords, tokens, or other secrets",
      "install -m 755",
      "corepack pnpm --ignore-workspace install --frozen-lockfile",
      "python -m pip"
    ]
  ],
  [
    "docs/commands/create.md",
    [
      hooksLink,
      "workspace `pre-create`",
      "post-materialization",
      "rollback",
      "hook outcome",
      "--no-hook-input",
      "invocation only",
      "does not skip hooks",
      "--interactive",
      "--no-hooks",
      "immediate EOF",
      "ARASHI_HOOK_INPUT",
      "tty",
      "disabled",
      "unavailable",
      "JSON"
    ]
  ],
  [
    "docs/commands/remove.md",
    [
      hooksLink,
      "once per target repository",
      "ARASHI_REMOVE_TARGETS_JSON",
      "dry-run",
      "post-remove",
      "--no-hook-input",
      "does not skip hooks",
      "immediate EOF",
      "ARASHI_HOOK_INPUT",
      "tty",
      "disabled",
      "unavailable",
      "JSON"
    ]
  ],
  [
    "docs/commands/init.md",
    [
      hooksLink,
      ".arashi/setup.sh.example",
      "install -m 755",
      "native Windows",
      "one example"
    ]
  ],
  [
    "docs/workflows/config.md",
    [hooksLink, "hooks.timeout", "300000", "1 through 2147483647"]
  ],
  [
    "docs/workflows/standalone.md",
    [
      hooksLink,
      "targeted before shared",
      "main-root basename",
      "configless repository-local and workspace hooks remain inactive",
      "ARASHI_HOOK_INPUT",
      "--no-hook-input",
      "JSON",
      "immediate EOF"
    ]
  ],
  [
    "docs/workflows/json-automation.md",
    [
      hooksLink,
      "ARASHI_HOOK_INPUT=disabled",
      "immediate EOF",
      "even when stdin is a TTY",
      "exactly one JSON document",
      "no prompt text or interactive attribution"
    ]
  ],
  ["docs/commands/setup.md", [hooksLink, "not a lifecycle hook"]],
  [
    "docs/workflows/herdr.md",
    [hooksLink, "ARASHI_REMOVE_TARGETS_JSON", ".worktreePath", "exact checkout path"]
  ],
  [
    "docs/contributing/validation-troubleshooting.md",
    ["validate:lifecycle-hook-docs", "generated Markdown routes", "llms-full.txt"]
  ]
]);

const generatedRequirements = new Map<string, string[]>([
  [
    "public/workflows/hooks.md",
    sourceRequirements.get("docs/workflows/hooks.md") ?? []
  ],
  ["public/commands/create.md", sourceRequirements.get("docs/commands/create.md") ?? []],
  ["public/commands/remove.md", sourceRequirements.get("docs/commands/remove.md") ?? []],
  ["public/commands/init.md", sourceRequirements.get("docs/commands/init.md") ?? []],
  ["public/workflows/config.md", sourceRequirements.get("docs/workflows/config.md") ?? []],
  [
    "public/workflows/standalone.md",
    sourceRequirements.get("docs/workflows/standalone.md") ?? []
  ],
  ["public/workflows/herdr.md", sourceRequirements.get("docs/workflows/herdr.md") ?? []],
  [
    "public/workflows/json-automation.md",
    sourceRequirements.get("docs/workflows/json-automation.md") ?? []
  ],
  ["public/commands/setup.md", sourceRequirements.get("docs/commands/setup.md") ?? []],
  [
    "public/llms.txt",
    [
      hooksLink,
      "ARASHI_HOOK_INPUT=tty|disabled|unavailable",
      "--no-hook-input",
      "invocation-only",
      "immediate EOF",
      "JSON"
    ]
  ],
  [
    "public/llms-full.txt",
    [
      "# Hooks",
      "after that repository worktree is materialized",
      "ARASHI_REMOVE_TARGETS_JSON",
      "ARASHI_HOOK_INPUT",
      "--no-hook-input",
      "immediate EOF",
      "Read-Host",
      "set /p",
      "passwords, tokens, or other secrets",
      "corepack pnpm --ignore-workspace install --frozen-lockfile",
      "targeted before shared",
      ".arashi/setup.sh.example"
    ]
  ]
]);

const errors: string[] = [];
checkRequirements(sourceRequirements);
checkRequirements(generatedRequirements);
checkForbiddenAliases();
checkNoPersistentHookInputPolicy();
checkWiring();

if (errors.length > 0) {
  console.error("Lifecycle-hook documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Lifecycle-hook documentation contract passed for ${sourceRequirements.size} canonical pages and ${generatedRequirements.size} generated exports.`
);

function checkRequirements(requirements: Map<string, string[]>): void {
  for (const [relativePath, expectedText] of requirements) {
    const content = read(relativePath);
    if (content === null) continue;
    for (const text of expectedText) {
      const normalizedContent = content.toLowerCase().replaceAll("`", "");
      const normalizedText = text.toLowerCase().replaceAll("`", "");
      if (!normalizedContent.includes(normalizedText)) {
        errors.push(`${relativePath} is missing ${JSON.stringify(text)}`);
      }
    }
  }
}

function checkForbiddenAliases(): void {
  for (const relativePath of ["docs/workflows/hooks.md", "public/workflows/hooks.md"]) {
    const content = read(relativePath);
    if (content === null) continue;
    for (const alias of ["ARASHI_BRANCH", "ARASHI_BASE_BRANCH"]) {
      const pattern = new RegExp(`\\b${alias}\\b(?!_NAME)`, "g");
      if (pattern.test(content)) {
        errors.push(`${relativePath} must not advertise stale runtime alias ${alias}`);
      }
    }
  }
}

function checkNoPersistentHookInputPolicy(): void {
  for (const relativePath of [
    "docs/workflows/hooks.md",
    "docs/workflows/config.md",
    "docs/commands/create.md",
    "docs/commands/remove.md",
    "public/workflows/hooks.md",
    "public/workflows/config.md",
    "public/commands/create.md",
    "public/commands/remove.md",
    "public/llms.txt",
    "public/llms-full.txt"
  ]) {
    const content = read(relativePath);
    if (content?.includes("hooks.input")) {
      errors.push(`${relativePath} must not publish persistent hooks.input configuration`);
    }
  }
}

function checkWiring(): void {
  const packageJson = read("package.json");
  if (packageJson !== null) {
    const scripts = JSON.parse(packageJson).scripts as Record<string, string>;
    if (scripts["validate:lifecycle-hook-docs"] !== "pnpm sync:content && node scripts/check-lifecycle-hook-docs.ts") {
      errors.push("package.json must expose validate:lifecycle-hook-docs with export regeneration");
    }
    if (!scripts.validate?.includes("validate:lifecycle-hook-docs")) {
      errors.push("package.json validate must run validate:lifecycle-hook-docs");
    }
  }

  const workflow = read(".github/workflows/docs-validate.yml");
  if (workflow !== null && !workflow.includes("pnpm validate:lifecycle-hook-docs")) {
    errors.push("docs-validate workflow must run validate:lifecycle-hook-docs explicitly");
  }
}

function read(relativePath: string): string | null {
  try {
    return readFileSync(path.resolve(relativePath), "utf8");
  } catch {
    errors.push(`${relativePath} is missing`);
    return null;
  }
}
