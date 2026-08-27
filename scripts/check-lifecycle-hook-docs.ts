import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const hooksLink = "/workflows/hooks/";

const sourceRequirements = new Map<string, string[]>([
  [
    "docs/workflows/hooks.md",
    [
      "pre-create.<repo>",
      "After that Git worktree is created and before configured file materialization/setup",
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
      "python -m pip",
    ],
  ],
  [
    "docs/commands/create.md",
    [
      hooksLink,
      "workspace `pre-create`",
      "after Git worktree creation and before configured file materialization/setup",
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
      "JSON",
    ],
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
      "JSON",
    ],
  ],
  [
    "docs/commands/init.md",
    [
      hooksLink,
      ".arashi/setup.sh.example",
      "install -m 755",
      "native Windows",
      "one example",
    ],
  ],
  [
    "docs/workflows/config.md",
    [hooksLink],
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
      "immediate EOF",
    ],
  ],

  ["docs/commands/setup.md", [hooksLink, "not a lifecycle hook"]],
  [
    "docs/workflows/herdr.md",
    [
      hooksLink,
      "ARASHI_REMOVE_TARGETS_JSON",
      ".worktreePath",
      "exact checkout path",
    ],
  ],
  [
    "docs/contributing/validation-troubleshooting.md",
    [
      "validate:lifecycle-hook-docs",
      "generated Markdown routes",
      "llms-full.txt",
    ],
  ],
]);

const generatedRequirements = new Map<string, string[]>([
  [
    "public/workflows/hooks.md",
    sourceRequirements.get("docs/workflows/hooks.md") ?? [],
  ],
  [
    "public/commands/create.md",
    sourceRequirements.get("docs/commands/create.md") ?? [],
  ],
  [
    "public/commands/remove.md",
    sourceRequirements.get("docs/commands/remove.md") ?? [],
  ],
  [
    "public/commands/init.md",
    sourceRequirements.get("docs/commands/init.md") ?? [],
  ],
  [
    "public/workflows/config.md",
    sourceRequirements.get("docs/workflows/config.md") ?? [],
  ],
  [
    "public/workflows/standalone.md",
    sourceRequirements.get("docs/workflows/standalone.md") ?? [],
  ],
  [
    "public/workflows/herdr.md",
    sourceRequirements.get("docs/workflows/herdr.md") ?? [],
  ],

  [
    "public/commands/setup.md",
    sourceRequirements.get("docs/commands/setup.md") ?? [],
  ],
  [
    "public/llms.txt",
    [
      hooksLink,
      "ARASHI_HOOK_INPUT=tty|disabled|unavailable",
      "--no-hook-input",
      "invocation-only",
      "immediate EOF",
      "JSON",
    ],
  ],
  [
    "public/llms-full.txt",
    [
      "# Hooks",
      "After that Git worktree is created and before configured file materialization/setup",
      "ARASHI_REMOVE_TARGETS_JSON",
      "ARASHI_HOOK_INPUT",
      "--no-hook-input",
      "immediate EOF",
      "Read-Host",
      "set /p",
      "passwords, tokens, or other secrets",
      "corepack pnpm --ignore-workspace install --frozen-lockfile",
      "targeted before shared",
      ".arashi/setup.sh.example",
    ],
  ],
]);

const errors: string[] = [];
const root = path.resolve(process.cwd());
checkRequirements(sourceRequirements);
checkRequirements(generatedRequirements);
checkForbiddenAliases();
checkPackageWideHookInputPolicy(root, errors);

if (errors.length > 0) {
  console.error("Lifecycle-hook documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

runControlledDriftSelfTest();
console.log(
  `Lifecycle-hook documentation contract passed for ${sourceRequirements.size} canonical pages and ${generatedRequirements.size} generated exports, with package-wide controlled-drift self-tests.`,
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
  for (const relativePath of [
    "docs/workflows/hooks.md",
    "public/workflows/hooks.md",
  ]) {
    const content = read(relativePath);
    if (content === null) continue;
    for (const alias of ["ARASHI_BRANCH", "ARASHI_BASE_BRANCH"]) {
      const pattern = new RegExp(`\\b${alias}\\b(?!_NAME)`, "g");
      if (pattern.test(content)) {
        errors.push(
          `${relativePath} must not advertise stale runtime alias ${alias}`,
        );
      }
    }
  }
}

function checkPackageWideHookInputPolicy(
  rootPath: string,
  found: string[],
): void {
  for (const relativePath of maintainedGuidanceFiles(rootPath)) {
    const content = readAt(rootPath, relativePath, found);
    if (content === null) continue;
    if (
      /hooks\.input/i.test(content) ||
      hasDirectObjectProperty(content, "hooks", "input")
    ) {
      found.push(
        `${relativePath} must not publish persistent hooks.input configuration`,
      );
    }
    if (/-NonInteractive\b/i.test(content)) {
      found.push(
        `${relativePath} must not publish PowerShell -NonInteractive hook invocation`,
      );
    }
    for (const command of unsupportedHookInputCommands(content)) {
      found.push(
        `${relativePath} must not advertise unsupported ${command} --no-hook-input guidance; the option belongs only to create and remove`,
      );
    }
  }
}

function hasDirectObjectProperty(
  content: string,
  objectName: string,
  propertyName: string,
): boolean {
  const objectPattern = new RegExp(`["']${objectName}["']\\s*:\\s*\\{`, "gi");
  for (const match of content.matchAll(objectPattern)) {
    const objectStart = (match.index ?? 0) + match[0].lastIndexOf("{");
    let depth = 0;
    for (let index = objectStart; index < content.length; index += 1) {
      const character = content[index];
      if (character === '"' || character === "'") {
        const quote = character;
        const valueStart = index + 1;
        index += 1;
        while (index < content.length) {
          if (content[index] === "\\") index += 2;
          else if (content[index] === quote) break;
          else index += 1;
        }
        if (depth === 1 && content.slice(valueStart, index) === propertyName) {
          let cursor = index + 1;
          while (/\s/.test(content[cursor] ?? "")) cursor += 1;
          if (content[cursor] === ":") return true;
        }
        continue;
      }
      if (character === "{") depth += 1;
      else if (character === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
  }
  return false;
}

function unsupportedHookInputCommands(content: string): string[] {
  const unsupported = new Set<string>();
  const actionableContent = content.replace(/\\\r?\n[\t ]*/g, " ");
  const actionablePatterns = [
    /\barashi\s+([a-z][a-z0-9-]*)\b[^\n]*?--no-hook-input\b/gi,
    /\b(add|clone|completion|config|doctor|exec|handoff|init|install|list|move|prune|pull|push|setup|shell|status|switch|sync|update)\s+--no-hook-input\b/gi,
  ];
  for (const pattern of actionablePatterns) {
    for (const match of actionableContent.matchAll(pattern)) {
      const command = match[1].toLowerCase();
      if (command !== "create" && command !== "remove")
        unsupported.add(command);
    }
  }
  return [...unsupported];
}

function maintainedGuidanceFiles(rootPath: string): string[] {
  return [
    ...walk(
      rootPath,
      "docs",
      (relativePath) =>
        relativePath.endsWith(".md") || relativePath.endsWith(".mdx"),
    ),
    ...walk(
      rootPath,
      "public",
      (relativePath) =>
        relativePath.endsWith(".md") || relativePath.endsWith(".txt"),
    ),
  ];
}

function walk(
  rootPath: string,
  relativeRoot: string,
  include: (relativePath: string) => boolean,
): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(path.resolve(rootPath, relativeRoot), {
    withFileTypes: true,
  })) {
    const relativePath = path.posix.join(relativeRoot, entry.name);
    if (entry.isDirectory())
      files.push(...walk(rootPath, relativePath, include));
    else if (include(relativePath)) files.push(relativePath);
  }
  return files;
}

function runControlledDriftSelfTest(): void {
  const fixtureRoot = mkdtempSync(
    path.join(os.tmpdir(), "arashi-lifecycle-hook-docs-"),
  );
  const driftPath = "docs/workflows/hooks.md";
  const absoluteDriftPath = path.join(fixtureRoot, driftPath);
  try {
    mkdirSync(path.dirname(absoluteDriftPath), { recursive: true });
    mkdirSync(path.join(fixtureRoot, "public"), { recursive: true });

    writeFileSync(
      absoluteDriftPath,
      "Run PowerShell with -NonInteractive for lifecycle hooks.\n",
    );
    const nonInteractiveErrors: string[] = [];
    checkPackageWideHookInputPolicy(fixtureRoot, nonInteractiveErrors);
    if (
      !nonInteractiveErrors.some((error) =>
        error.includes("-NonInteractive hook invocation"),
      )
    ) {
      throw new Error(
        "Lifecycle-hook documentation checker self-test did not reject stale -NonInteractive guidance in maintained MDX.",
      );
    }

    writeFileSync(
      absoluteDriftPath,
      "Set persistent hooks.input to never in configuration.\n",
    );
    const persistentInputErrors: string[] = [];
    checkPackageWideHookInputPolicy(fixtureRoot, persistentInputErrors);
    if (
      !persistentInputErrors.some((error) =>
        error.includes("persistent hooks.input configuration"),
      )
    ) {
      throw new Error(
        "Lifecycle-hook documentation checker self-test did not reject persistent hooks.input guidance in maintained MDX.",
      );
    }

    writeFileSync(absoluteDriftPath, '{ "hooks": { "input": "disabled" } }\n');
    const nestedPersistentInputErrors: string[] = [];
    checkPackageWideHookInputPolicy(fixtureRoot, nestedPersistentInputErrors);
    if (
      !nestedPersistentInputErrors.some((entry) =>
        entry.includes("persistent hooks.input"),
      )
    ) {
      throw new Error(
        "self-test did not reject nested persistent hooks input configuration",
      );
    }

    writeFileSync(
      absoluteDriftPath,
      '{ "hooks": { "commands": { "pre-create": "echo ok" }, "input": "disabled" } }\n',
    );
    const nestedCommandsPersistentInputErrors: string[] = [];
    checkPackageWideHookInputPolicy(
      fixtureRoot,
      nestedCommandsPersistentInputErrors,
    );
    if (
      !nestedCommandsPersistentInputErrors.some((entry) =>
        entry.includes("persistent hooks.input"),
      )
    ) {
      throw new Error(
        "self-test did not reject persistent hooks input after a nested hooks property",
      );
    }

    writeFileSync(
      absoluteDriftPath,
      '{ "hooks": { "timeout": 30 } }\n{ "input": "unrelated sibling example" }\n',
    );
    const siblingInputErrors: string[] = [];
    checkPackageWideHookInputPolicy(fixtureRoot, siblingInputErrors);
    if (
      siblingInputErrors.some((entry) =>
        entry.includes("persistent hooks.input"),
      )
    ) {
      throw new Error(
        "self-test rejected an input property that is a sibling of hooks",
      );
    }

    writeFileSync(
      absoluteDriftPath,
      "Run status --no-hook-input to inspect the workspace.\n",
    );
    const unsupportedCommandErrors: string[] = [];
    checkPackageWideHookInputPolicy(fixtureRoot, unsupportedCommandErrors);
    if (
      !unsupportedCommandErrors.some((entry) =>
        entry.includes("status --no-hook-input"),
      )
    ) {
      throw new Error(
        "self-test did not reject unsupported status --no-hook-input guidance in a canonical file",
      );
    }

    writeFileSync(
      absoluteDriftPath,
      "Run aw status \\\n  --no-hook-input to inspect the workspace.\n",
    );
    const continuedUnsupportedCommandErrors: string[] = [];
    checkPackageWideHookInputPolicy(fixtureRoot, continuedUnsupportedCommandErrors);
    if (
      !continuedUnsupportedCommandErrors.some((entry) =>
        entry.includes("status --no-hook-input"),
      )
    ) {
      throw new Error(
        "self-test did not reject a continued unsupported status --no-hook-input command",
      );
    }

    writeFileSync(
      absoluteDriftPath,
      '{ "hooks": { "timeout": 300000 } }\n\n```json\n{ "input": "unrelated" }\n```\n',
    );
    const unrelatedInputErrors: string[] = [];
    checkPackageWideHookInputPolicy(fixtureRoot, unrelatedInputErrors);
    if (
      unrelatedInputErrors.some((error) =>
        error.includes("persistent hooks.input configuration"),
      )
    ) {
      throw new Error(
        "Lifecycle-hook documentation checker self-test rejected an unrelated input property outside the hooks object.",
      );
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function read(relativePath: string): string | null {
  return readAt(root, relativePath, errors);
}

function readAt(
  rootPath: string,
  relativePath: string,
  found: string[],
): string | null {
  try {
    return readFileSync(path.resolve(rootPath, relativePath), "utf8");
  } catch {
    found.push(`${relativePath} is missing`);
    return null;
  }
}
