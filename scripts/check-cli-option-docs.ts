import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(process.cwd());
const errors: string[] = [];

const aliasRequirements = new Map<string, string[]>([
  ["docs/commands/add.md", ["`-f, --force`", "`-j, --json`", "`-n, --name <name>`"]],
  ["docs/commands/clone.md", ["`-j, --json`"]],
  ["docs/commands/create.md", ["`-g, --group", "`-j, --json`", "`-n, --dry-run`", "`-o, --only"]],
  ["docs/commands/doctor.md", ["`-j, --json`"]],
  ["docs/commands/exec.md", ["`-g, --group", "`-j, --json`", "`-o, --only", "`--jobs <positive-int>` remains long-only"]],
  ["docs/commands/handoff.md", ["`-j, --json`"]],
  ["docs/commands/init.md", ["`-f, --force`", "`-j, --json`", "`-n, --dry-run`", "`-v, --verbose`"]],
  ["docs/commands/list.md", ["`-j, --json`", "`-v, --verbose`"]],
  ["docs/commands/move.md", ["`-j, --json`"]],
  ["docs/commands/prune.md", ["`-j, --json`", "`-n, --dry-run`"]],
  ["docs/commands/pull.md", ["`-g, --group", "`-j, --json`", "`-o, --only", "`-v, --verbose`"]],
  ["docs/commands/push.md", ["`-g, --group", "`-j, --json`", "`-n, --dry-run`", "`-o, --only"]],
  ["docs/commands/remove.md", ["`-f, --force`", "`-j, --json`", "`-n, --dry-run`"]],
  ["docs/commands/setup.md", ["`-g, --group", "`-j, --json`", "`-o, --only", "`-v, --verbose`"]],
  ["docs/commands/shell.md", ["`-j, --json`"]],
  ["docs/commands/status.md", ["`-g, --group", "`-j, --json`", "`-o, --only", "`-v, --verbose`"]],
  ["docs/commands/switch.md", ["`-j, --json`"]],
  ["docs/commands/sync.md", ["`-g, --group", "`-j, --json`", "`-o, --only", "`-v, --verbose`"]],
  ["docs/commands/update.md", ["`-j, --json`", "`-n, --dry-run`"]],
  ["docs/getting-started/index.md", ["`arashi install -j`", "`arashi install --json`"]]
]);

const semanticRequirements = new Map<string, string[]>([
  [
    "docs/commands/switch.md",
    [
      "`--launch` force launch behavior while preserving a configured named launcher",
      "`--ignore-configured-launcher` ignore a configured named launcher without erasing configured or contextual launch behavior",
      "`--launch --ignore-configured-launcher` requests generic automatic launch",
      "`--launch` preserves configured `sesh` or `herdr`",
      "configured `auto`, `cd`, or `launch` behavior remains unchanged",
      "configured `sesh` or `herdr` keeps launch behavior but uses automatic launcher resolution",
      "`--cd` conflicts with `--launch`, `--tab`, and every explicit launcher selector",
      "Deprecated compatibility spellings",
      "`--no-cd` maps to `--launch`",
      "`--no-default-launch` maps to `--ignore-configured-launcher`",
      "throughout Arashi 1.x",
      "no earlier than Arashi 2.0",
      "separately approved breaking-change issue"
    ]
  ],
  [
    "docs/workflows/launch-disposition.md",
    [
      "`--launch --ignore-configured-launcher`",
      "configured behavior and named-launcher defaults",
      "explicit launcher supplied with `--tab` remains authoritative"
    ]
  ],
  [
    "docs/workflows/config.md",
    [
      "`switch --launch` preserves a configured `sesh` or `herdr` launcher",
      "`switch --ignore-configured-launcher`",
      "`switch --launch --ignore-configured-launcher`",
      "Repeated and comma-separated selectors",
      "flattened in encounter order",
      "trimmed",
      "blank segments beside valid values are ignored",
      "deduplicated by first occurrence",
      "supplied selector that normalizes empty",
      "unknown repository or group",
      "empty intersection",
      "before repository inspection, hooks, fetches, or mutation",
      "omitted selectors retain the command default"
    ]
  ],
  [
    "docs/commands/status.md",
    [
      "configured child repositories",
      "repeated, comma-separated, or mixed",
      "intersect",
      "unselected child repositories are not fetched or inspected",
      "parent repository reporting remains unchanged",
      "`data.filters` reports the effective normalized `only` and `groups` values",
      "`data.repositories` contains the selected child set plus the unchanged parent record",
      "standalone mode rejects `--only` and `--group`"
    ]
  ],
  [
    "docs/commands/update.md",
    [
      "`--check` conflicts with `--dry-run` and `-n`",
      "before release lookup, installer planning, or mutation",
      "exactly one structured error envelope",
      "npm wrapper and direct binary",
      "Bare `--json` is inspection-only",
      "never prompts or applies an update",
      "`--json --yes` returns `JSON_UNSUPPORTED_FOR_MODE`"
    ]
  ],
  [
    "docs/commands/handoff.md",
    [
      "Markdown is the default human output",
      "Deprecated compatibility",
      "omit `--markdown`",
      "throughout Arashi 1.x",
      "no earlier than Arashi 2.0",
      "separately approved breaking-change issue"
    ]
  ],
  [
    "docs/workflows/json-automation.md",
    [
      "Every command that supports `--json` also accepts `-j`",
      "`update --check --dry-run`",
      "Bare `update --json` is inspection-only",
      "one structured error envelope",
      "`status -o arashi-docs -j`"
    ]
  ],
  [
    "docs/commands/index.md",
    ["Native shell completion is not added or claimed by this option-rationalization change"]
  ]
]);

checkRequirements(aliasRequirements);
checkRequirements(semanticRequirements);
checkGeneratedParity();
checkUpdateJsonPolicy();
checkDeprecatedGuidance();
checkContract();
checkReachability();
checkDeterministicExports();

if (errors.length > 0) {
  console.error("CLI option documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `CLI option documentation contract passed for ${aliasRequirements.size} alias surfaces, canonical and generated semantic exports, the versioned contract, and deterministic regeneration.`
);

function checkRequirements(requirements: Map<string, string[]>): void {
  for (const [relativePath, expected] of requirements) {
    const content = read(relativePath);
    if (content === null) continue;
    for (const text of expected) {
      if (!content.toLowerCase().includes(text.toLowerCase())) errors.push(`${relativePath} is missing ${JSON.stringify(text)}`);
    }
  }
}

function checkGeneratedParity(): void {
  for (const [sourcePath, expected] of [...aliasRequirements, ...semanticRequirements]) {
    const generatedPath = sourcePath
      .replace(/^docs\/getting-started\/index\.md$/, "public/getting-started.md")
      .replace(/^docs\//, "public/");
    const content = read(generatedPath);
    if (content === null) continue;
    for (const text of expected) {
      if (!content.toLowerCase().includes(text.toLowerCase())) errors.push(`${generatedPath} is missing ${JSON.stringify(text)}`);
    }
  }

  const full = read("public/llms-full.txt");
  if (full !== null) {
    for (const text of [
      "`--launch --ignore-configured-launcher` requests generic automatic launch",
      "Repeated and comma-separated selectors",
      "standalone mode rejects `--only` and `--group`",
      "`--check` conflicts with `--dry-run` and `-n`",
      "omit `--markdown`"
    ]) {
      if (!full.includes(text)) errors.push(`public/llms-full.txt is missing ${JSON.stringify(text)}`);
    }
  }

  const curated = read("public/llms.txt");
  if (curated !== null) {
    for (const text of [
      "`arashi switch --launch --ignore-configured-launcher`",
      "`-v/-f/-j/-o/-g/-n`",
      "repeated and comma-separated `--only`/`--group`",
      "`status --only`",
      "`update --check` conflicts with `--dry-run`/`-n`",
      "Markdown is the default for `handoff`",
      "Native shell completion is not added or claimed"
    ]) {
      if (!curated.includes(text)) errors.push(`public/llms.txt is missing ${JSON.stringify(text)}`);
    }
  }
}

function checkUpdateJsonPolicy(): void {
  for (const relativePath of ["docs/commands/update.md", "public/commands/update.md"]) {
    const content = read(relativePath);
    if (content !== null) errors.push(...updateJsonPolicyErrors(relativePath, content));
  }

  const canonical = read("docs/commands/update.md");
  if (canonical === null) return;
  const deliberateDrifts = [
    [
      "native-only",
      canonical.replace(
        "behaves identically in the npm wrapper and direct binary",
        "behaves in the direct binary only",
      ),
      "bare update JSON must bind inspection-only behavior to both the npm wrapper and direct binary",
    ],
    [
      "after-mutation",
      canonical.replace("before update mutation", "after update mutation"),
      "JSON apply rejection must occur before mutation",
    ],
  ] as const;
  for (const [name, fixture, expectedFinding] of deliberateDrifts) {
    const findings = updateJsonPolicyErrors(`deliberate-${name}.md`, fixture);
    if (findings.length !== 1 || !findings[0]?.includes(expectedFinding)) {
      errors.push(`update-JSON checker accepted deliberate ${name} semantic drift`);
    }
  }
}

function updateJsonPolicyErrors(relativePath: string, content: string): string[] {
  const findings: string[] = [];
  const barePolicy =
    "Bare `--json` is inspection-only: it reports the available update and selected plan in one envelope, never prompts or applies an update, and behaves identically in the npm wrapper and direct binary.";
  const applyPolicy =
    "`--json --yes` returns `JSON_UNSUPPORTED_FOR_MODE` for `installer-apply` before update mutation.";
  if (!content.includes(barePolicy)) {
    findings.push(
      `${relativePath}: bare update JSON must bind inspection-only behavior to both the npm wrapper and direct binary`,
    );
  }
  if (!content.includes(applyPolicy)) {
    findings.push(`${relativePath}: JSON apply rejection must occur before mutation`);
  }
  return findings;
}

function checkDeprecatedGuidance(): void {
  for (const relativePath of walk(path.join(root, "docs")).filter((file) => /\.mdx?$/.test(file))) {
    const content = read(relativePath);
    if (content === null) continue;
    errors.push(...deprecatedGuidanceErrors(relativePath, content));
  }

  const afterSectionMismatch = [
    "## Deprecated compatibility spellings",
    "The old spelling is deprecated compatibility metadata.",
    "## Preferred workflow",
    "Run `arashi switch --no-cd` for normal use."
  ].join("\n");
  const sameLineMismatch = [
    "## Deprecated compatibility spellings",
    "For deprecated compatibility, run `arashi switch --no-cd`."
  ].join("\n");
  for (const [name, fixture] of [
    ["after-section", afterSectionMismatch],
    ["same-line-actionable", sameLineMismatch]
  ] as const) {
    const mismatchErrors = deprecatedGuidanceErrors(`deliberate-${name}.md`, fixture);
    if (mismatchErrors.length !== 1 || !mismatchErrors[0]?.includes("--no-cd")) {
      errors.push(`deprecated-guidance checker accepted ${name} actionable syntax`);
    }
  }
}

function deprecatedGuidanceErrors(relativePath: string, content: string): string[] {
  const findings: string[] = [];
  const deprecated = ["--no-cd", "--no-default-launch", "--markdown"];
  let compatibilityHeadingDepth: number | null = null;
  let inCodeFence = false;

  for (const [index, line] of content.split("\n").entries()) {
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const depth = heading[1]?.length ?? 0;
      if (/deprecated compatibility/i.test(heading[2] ?? "")) {
        compatibilityHeadingDepth = depth;
      } else if (compatibilityHeadingDepth !== null && depth <= compatibilityHeadingDepth) {
        compatibilityHeadingDepth = null;
      }
    }

    for (const spelling of deprecated) {
      if (!line.includes(spelling)) continue;
      const inCompatibilitySection = compatibilityHeadingDepth !== null;
      const actionableCommand = inCodeFence || /\barashi\s+[^`\n]*\s--?[\w-]*\b/.test(line);
      if (!inCompatibilitySection || actionableCommand) {
        findings.push(
          `${relativePath}:${index + 1} teaches deprecated ${spelling} outside bounded non-actionable compatibility metadata`
        );
      }
    }

    if (/^\s*```/.test(line)) inCodeFence = !inCodeFence;
  }
  return findings;
}

function checkContract(): void {
  const contract = parseJson("contracts/cli-options.json");
  if (contract === null) return;
  const expected = {
    schemaVersion: 1,
    aliases: {
      verbose: "-v",
      force: "-f",
      json: "-j",
      only: "-o",
      group: "-g",
      dryRun: "-n",
      exceptions: { addName: "-n", execJobs: "long-only" },
      npmWrapper: { installJson: "-j", updateJson: "-j", updateDryRun: "-n" }
    },
    switch: {
      canonical: { launch: "--launch", ignoreConfiguredLauncher: "--ignore-configured-launcher" },
      compatibility: {
        "--no-cd": "--launch",
        "--no-default-launch": "--ignore-configured-launcher"
      },
      compatibilityBoundary: { supportedThrough: "1.x", earliestRemovalMajor: 2, requiresApprovedBreakingChange: true },
      persisted: false,
      combinedCanonicalIntent: "generic-automatic-launch",
      launchPreservesConfiguredLauncher: true,
      ignoreConfiguredLauncher: {
        preserveBehaviorModes: ["auto", "cd", "launch"],
        namedLaunchModesBecomeAutomatic: ["sesh", "herdr"]
      },
      cdConflicts: ["launch", "tab", "explicit-launcher"],
      explicitLauncherWithTabAuthoritative: true,
      jsonGuardPrecedenceUnchanged: true,
      noFallbackUnchanged: true
    },
    selectors: {
      options: ["--only", "--group"],
      inputForms: ["repeated", "comma-separated", "mixed"],
      flatten: "encounter-order",
      trim: true,
      blankSegments: "ignored-beside-values",
      deduplicate: "first-occurrence",
      omitted: "default-selection",
      suppliedEmpty: "error",
      unknown: "error",
      combination: "intersection",
      emptyIntersection: "error",
      validationPrecedence: "before-repository-work"
    },
    status: {
      only: "configured-child-selection",
      standaloneSelectors: "unsupported",
      parentReporting: "unchanged",
      jsonSelection: {
        repositories: "selected-children-plus-parent",
        effectiveFilters: "normalized-only-and-groups",
        agree: true
      }
    },
    handoff: {
      defaultFormat: "markdown",
      preferredMarkdownOption: "omitted",
      compatibilityOption: "--markdown",
      compatibilityBoundary: { supportedThrough: "1.x", earliestRemovalMajor: 2, requiresApprovedBreakingChange: true }
    },
    update: {
      conflict: ["--check", "--dry-run"],
      dryRunAlias: "-n",
      precedence: "before-lookup-or-mutation",
      humanJsonParity: true,
      bareJson: "inspection-only",
      jsonApply: "unsupported",
      jsonPrompt: false,
      jsonMutation: false
    },
    nativeCompletion: "out-of-scope"
  };
  if (JSON.stringify(contract) !== JSON.stringify(expected)) {
    errors.push("contracts/cli-options.json does not match the normalized CLI option documentation contract");
  }
}

function checkReachability(): void {
  const packageJson = parseJson("package.json");
  if (packageJson !== null) {
    if (packageJson.scripts?.["validate:cli-option-docs"] !== "pnpm sync:content && node scripts/check-cli-option-docs.ts") {
      errors.push("package.json must define validate:cli-option-docs");
    }
    if (!packageJson.scripts?.validate?.includes("pnpm validate:cli-option-docs")) {
      errors.push("package.json validate must run validate:cli-option-docs");
    }
  }
  const workflow = read(".github/workflows/docs-validate.yml");
  if (workflow !== null && !workflow.includes("run: pnpm validate:cli-option-docs")) {
    errors.push(".github/workflows/docs-validate.yml must explicitly run pnpm validate:cli-option-docs");
  }
}

function checkDeterministicExports(): void {
  const before = snapshotPublicExports();
  const result = spawnSync(process.execPath, ["scripts/generate-agent-exports.ts"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    errors.push(`agent export regeneration failed: ${(result.stderr || result.stdout).trim()}`);
    return;
  }
  const after = snapshotPublicExports();
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    errors.push("agent-readable exports are not deterministic across consecutive generation runs");
  }
}

function snapshotPublicExports(): Record<string, string> {
  const snapshot: Record<string, string> = {};
  for (const relativePath of walk(path.join(root, "public")).filter((file) => file.endsWith(".md") || file.endsWith("llms.txt") || file.endsWith("llms-full.txt"))) {
    snapshot[relativePath] = readFileSync(path.join(root, relativePath), "utf8");
  }
  return snapshot;
}

function walk(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(path.relative(root, full).replaceAll(path.sep, "/"));
  }
  return files.sort();
}

function parseJson(relativePath: string): any | null {
  const raw = read(relativePath);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    errors.push(`${relativePath} is not valid JSON`);
    return null;
  }
}

function read(relativePath: string): string | null {
  try {
    return readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    errors.push(`${relativePath} is missing`);
    return null;
  }
}
