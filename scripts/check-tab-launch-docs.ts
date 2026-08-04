import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

type Requirement = { path: string; text: string[] };

const canonicalWorkflow = "docs/workflows/launch-disposition.md";
const canonicalRequirements = [
  "new terminal window or an independent managed session",
  "`--tab` is a CLI-only, one-invocation request",
  "create tab implies launch and switch",
  "wins over `--no-launch` and `--no-switch`",
  "conflicts only with explicit `--cd`",
  "compatible with `--no-cd` and `--no-default-launch`",
  "composes with explicit launcher selectors",
  "`launch` mode",
  "exit status `2`",
  "`interactive-or-launch` mode",
  "exit status `1`",
  "Ghostty + tmux",
  "tmux window",
  "Ghostty + Herdr",
  "Herdr tab",
  "cmux workspace / vertical tab",
  "active session",
  "Windows Terminal",
  "WezTerm",
  "exact pane",
  "managed Kitty",
  "tmux / sesh",
  "active-workspace Herdr",
  "Terminal.app",
  "| Terminal.app | New window | Unsupported | No supported true-tab automation |",
  "press Command-T",
  "`arashi switch --cd`",
  "requires active Arashi shell integration",
  "`arashi switch --no-cd --no-default-launch`",
  "when automatic launcher resolution selects Terminal.app",
  "iTerm2",
  "| macOS Ghostty older than 1.3 or missing supported-version evidence | New window | Unsupported | No supported tab API |",
  "macOS Ghostty 1.3+",
  "Git Bash / MinTTY",
  "unmanaged Kitty",
  "Linux Ghostty",
  "IDE workspaces",
  "generic fallback",
  "never opens a window or falls through",
  "application, profile, shell, and working directory",
  "exact path as data, never shell-interpolated",
  "before worktree mutation",
  "preserves the created worktrees",
  "Dry-run previews tab intent without requiring runtime session evidence",
  "configuration vocabulary is unchanged",
];

const sourceRequirements: Requirement[] = [
  { path: canonicalWorkflow, text: canonicalRequirements },
  {
    path: "docs/commands/switch.md",
    text: [
      "`--tab`",
      "CLI-only, one-invocation",
      "overrides configured or contextual parent-shell `cd`",
      "conflicts only with explicit `--cd`",
      "compatible with `--no-cd` and `--no-default-launch`",
      "[launch disposition workflow](/workflows/launch-disposition/)",
    ],
  },
  {
    path: "docs/commands/create.md",
    text: [
      "`--tab`",
      "CLI-only, one-invocation",
      "implies launch and switch",
      "wins over `--no-launch` and `--no-switch`",
      "[launch disposition workflow](/workflows/launch-disposition/)",
    ],
  },
  {
    path: "docs/workflows/json-automation.md",
    text: [
      "switch --json --tab",
      "`launch`",
      "exit status `2`",
      "create --json --tab",
      "`interactive-or-launch`",
      "exit status `1`",
    ],
  },
  {
    path: "docs/workflows/tmux-and-sesh.md",
    text: [
      "Ghostty containing tmux",
      "tmux window",
      "[launch disposition workflow](/workflows/launch-disposition/)",
    ],
  },
  {
    path: "docs/workflows/herdr.md",
    text: [
      "Ghostty containing Herdr",
      "active Herdr workspace",
      "Herdr tab",
      "[launch disposition workflow](/workflows/launch-disposition/)",
    ],
  },
  {
    path: "docs/workflows/cmux.md",
    text: [
      "workspace / vertical tab",
      "active cmux session",
      "[launch disposition workflow](/workflows/launch-disposition/)",
    ],
  },
  {
    path: "docs/workflows/kitty.md",
    text: [
      "managed Kitty",
      "`--tab`",
      "[launch disposition workflow](/workflows/launch-disposition/)",
    ],
  },
  {
    path: "docs/workflows/index.md",
    text: ["[Launch disposition](/workflows/launch-disposition/)"],
  },
];

const generatedRequirements: Requirement[] = [
  ...sourceRequirements.map(({ path: sourcePath, text }) => ({
    path: sourcePath.replace(/^docs\//, "public/"),
    text,
  })),
  {
    path: "public/llms.txt",
    text: [
      "default new window or independent managed session",
      "`--tab` is CLI-only",
      "[Launch disposition workflow]",
      "https://arashi.haphazard.dev/workflows/launch-disposition.md",
    ],
  },
  {
    path: "public/llms-full.txt",
    text: [
      "Source: https://arashi.haphazard.dev/workflows/launch-disposition/",
      ...canonicalRequirements,
    ],
  },
];

const root = path.resolve(process.cwd());
const errors = checkRoot(root);
if (errors.length > 0) {
  console.error("Tab launch-disposition documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

runDeliberateMismatchSelfTest(root);
console.log(
  `Tab launch-disposition documentation contract passed for ${sourceRequirements.length} canonical surfaces and ${generatedRequirements.length} generated exports, with unchanged configuration vocabularies and a deliberate-mismatch self-test.`,
);

function checkRoot(rootPath: string): string[] {
  const found: string[] = [];
  checkRequirements(rootPath, sourceRequirements, found);
  checkRequirements(rootPath, generatedRequirements, found);
  checkConfigurationVocabulary(rootPath, found);
  checkReachability(rootPath, found);
  return found;
}

function checkRequirements(
  rootPath: string,
  requirements: Requirement[],
  found: string[],
): void {
  for (const requirement of requirements) {
    const content = read(rootPath, requirement.path, found);
    if (content === null) continue;
    for (const expected of requirement.text) {
      if (!content.includes(expected)) {
        found.push(
          `${requirement.path} is missing ${JSON.stringify(expected)}`,
        );
      }
    }
  }
}

function checkConfigurationVocabulary(rootPath: string, found: string[]): void {
  const switchContract = parseJson(
    rootPath,
    "contracts/switch-config.json",
    found,
  );
  const createContract = parseJson(
    rootPath,
    "contracts/create-launch-config.json",
    found,
  );
  const expectedSwitch = {
    schemaVersion: 1,
    canonicalField: "defaults.switch.mode",
    modes: ["auto", "cd", "launch", "sesh", "herdr"],
    absentMode: "launch",
    autoOrder: ["tmux", "herdr", "cmux", "ide", "kitty", "cd", "platform"],
    legacyFields: ["defaults.switch.launchMode", "defaults.switch.launch_mode"],
  };
  const expectedCreate = {
    schemaVersion: 1,
    canonicalField: "defaults.create.launch",
    modes: ["none", "auto", "sesh", "herdr"],
    absentMode: "none",
    switch: {
      field: "defaults.create.switch",
      type: "boolean",
      independent: true,
      launchImpliesSwitch: true,
    },
    editorHosts: ["vscode", "cursor", "kiro"],
    editorScope: "defaults.editors.<host>.create",
    editorScopeFallback: "none",
    cliPrecedence: [
      "explicit-launcher",
      "launch",
      "no-launch",
      "configured",
      "none",
    ],
    legacyFields: ["launch:boolean", "launchMode", "launch_mode"],
    acceptedMigrations: [
      "launcher-without-boolean",
      "true-with-absent-or-launcher",
      "false-without-launcher",
      "canonical-with-compatible-launcher",
      "equal-launcher-aliases",
    ],
    rejectedMigrations: [
      "false-with-launcher",
      "conflicting-launcher-aliases",
      "none-with-launcher",
      "auto-with-explicit-launcher",
      "opposite-explicit-launchers",
      "invalid-values",
    ],
    jsonRestrictedModes: ["auto", "sesh", "herdr"],
    failurePreservesCreatedWorktrees: true,
  };

  if (
    switchContract !== null &&
    JSON.stringify(switchContract) !== JSON.stringify(expectedSwitch)
  ) {
    found.push(
      "contracts/switch-config.json must keep the complete switch configuration vocabulary unchanged",
    );
  }
  if (
    createContract !== null &&
    JSON.stringify(createContract) !== JSON.stringify(expectedCreate)
  ) {
    found.push(
      "contracts/create-launch-config.json must keep the complete create configuration vocabulary unchanged",
    );
  }
}

function checkReachability(rootPath: string, found: string[]): void {
  const packageJson = parseJson(rootPath, "package.json", found);
  if (packageJson !== null) {
    if (
      packageJson.scripts?.["validate:tab-launch-docs"] !==
      "pnpm sync:content && node scripts/check-tab-launch-docs.ts"
    ) {
      found.push("package.json must define validate:tab-launch-docs");
    }
    if (
      !packageJson.scripts?.validate?.includes("pnpm validate:tab-launch-docs")
    ) {
      found.push("package.json validate must run validate:tab-launch-docs");
    }
  }

  const workflow = read(rootPath, ".github/workflows/docs-validate.yml", found);
  if (
    workflow !== null &&
    !workflow.includes("run: pnpm validate:tab-launch-docs")
  ) {
    found.push(
      ".github/workflows/docs-validate.yml must run pnpm validate:tab-launch-docs",
    );
  }
}

function runDeliberateMismatchSelfTest(sourceRoot: string): void {
  const fixtureRoot = mkdtempSync(
    path.join(os.tmpdir(), "arashi-tab-launch-docs-"),
  );
  try {
    for (const relativePath of new Set([
      ...sourceRequirements.map(({ path: relativePath }) => relativePath),
      ...generatedRequirements.map(({ path: relativePath }) => relativePath),
      "contracts/switch-config.json",
      "contracts/create-launch-config.json",
      "package.json",
      ".github/workflows/docs-validate.yml",
    ])) {
      const destination = path.join(fixtureRoot, relativePath);
      mkdirSync(path.dirname(destination), { recursive: true });
      cpSync(path.join(sourceRoot, relativePath), destination, {
        recursive: true,
      });
    }

    const workflowPath = path.join(fixtureRoot, canonicalWorkflow);
    const valid = readFileSync(workflowPath, "utf8");
    writeFileSync(
      workflowPath,
      valid.replaceAll(
        "never opens a window or falls through",
        "may fall back to a window",
      ),
    );
    const mismatchErrors = checkRoot(fixtureRoot);
    if (
      !mismatchErrors.some((error) =>
        error.includes('"never opens a window or falls through"'),
      )
    ) {
      throw new Error(
        "Tab launch-disposition checker self-test did not reject the no-fallback mismatch.",
      );
    }

    writeFileSync(
      workflowPath,
      valid.replace(
        "| macOS Ghostty older than 1.3 or missing supported-version evidence | New window | Unsupported | No supported tab API |",
        "| macOS Ghostty older than 1.3 or missing supported-version evidence | New window | True tab | Current Ghostty window |",
      ),
    );
    const oldGhosttyErrors = checkRoot(fixtureRoot);
    if (
      !oldGhosttyErrors.some((error) =>
        error.includes("macOS Ghostty older than 1.3"),
      )
    ) {
      throw new Error(
        "Tab launch-disposition checker self-test did not reject the old-Ghostty mapping mismatch.",
      );
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function parseJson(
  rootPath: string,
  relativePath: string,
  found: string[],
): any | null {
  const raw = read(rootPath, relativePath, found);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    found.push(`${relativePath} is not valid JSON`);
    return null;
  }
}

function read(
  rootPath: string,
  relativePath: string,
  found: string[],
): string | null {
  try {
    return readFileSync(path.join(rootPath, relativePath), "utf8");
  } catch {
    found.push(`${relativePath} is missing`);
    return null;
  }
}
