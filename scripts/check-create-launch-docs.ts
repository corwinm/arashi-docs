import { readFileSync } from "node:fs";
import path from "node:path";

const modes = ["none", "auto", "sesh", "herdr"];
const modeVocabulary = "none | auto | sesh | herdr";

const sourceRequirements = new Map<string, string[]>([
  [
    "docs/commands/create.md",
    [
      modeVocabulary,
      "launch implies switch",
      "`--sesh` or `--herdr`",
      "`--launch` selects `auto`",
      "`--no-launch` selects `none`",
      "configured launch",
      "before worktree creation",
      "preserves every successfully created worktree"
    ]
  ],
  [
    "docs/reference/configuration.md",
    [
      modeVocabulary,
      "defaults.create.switch",
      "defaults.editors.<editor>.create"
    ]
  ],
  [
    "docs/workflows/tmux-and-sesh.md",
    ["launch: \"sesh\"", "bypasses automatic context detection", "does not fall back"]
  ],
  [
    "docs/workflows/herdr.md",
    [
      "launch: \"herdr\"",
      "defaults.editors.<host>.create",
      "does not inherit",
      "--no-launch",
      "preserves every successfully created worktree"
    ]
  ],
  ["docs/workflows/cmux.md", ["\"launch\": \"auto\"", "worktrees remain created"]]
]);

const generatedRequirements = new Map<string, string[]>([
  ["public/commands/create.md", [modeVocabulary, "launch implies switch", "configured launch"]],
  ["public/reference/configuration.md", [modeVocabulary, "defaults.create.switch"]],
  ["public/workflows/tmux-and-sesh.md", ["launch: \"sesh\"", "does not fall back"]],
  ["public/workflows/herdr.md", ["launch: \"herdr\"", "does not inherit"]],
  ["public/workflows/cmux.md", ["\"launch\": \"auto\"", "worktrees remain created"]],
  [
    "public/llms.txt",
    [
      modeVocabulary,
      "An absent create launch choice means no launch",
      "Create command Markdown",
      "Configuration reference Markdown"
    ]
  ],
  [
    "public/llms-full.txt",
    [
      modeVocabulary,
      "launch implies switch",
      "launch: \"sesh\"",
      "launch: \"herdr\""
    ]
  ]
]);

const errors: string[] = [];
checkStructuredContract();
checkRequirements(sourceRequirements);
checkRequirements(generatedRequirements);
checkCanonicalGuidance();

if (errors.length > 0) {
  console.error("Unified create-launch documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Unified create-launch documentation contract passed for ${sourceRequirements.size} source pages and ${generatedRequirements.size} generated exports.`
);

function checkRequirements(requirements: Map<string, string[]>): void {
  for (const [relativePath, expectedText] of requirements) {
    const content = read(relativePath);
    if (content === null) continue;
    for (const text of expectedText) {
      if (!content.includes(text)) {
        errors.push(`${relativePath} is missing ${JSON.stringify(text)}`);
      }
    }
  }
}

function checkCanonicalGuidance(): void {
  for (const relativePath of sourceRequirements.keys()) {
    const content = read(relativePath);
    if (content !== null && /"launch"\s*:\s*(?:true|false)/.test(content)) {
      errors.push(`${relativePath} still advertises a canonical boolean create launch value`);
    }
  }

  const config = read("docs/reference/configuration.md");
  if (config !== null) {
    const migrationHeading = "## Legacy create launch migration";
    const migrationStart = config.indexOf(migrationHeading);
    const canonicalSection = migrationStart === -1 ? config : config.slice(0, migrationStart);
    if (/create[^\n`]*`?launchMode|defaults\.create\.launchMode|defaults\.editors\.<host>\.create[^\n]*launchMode/i.test(canonicalSection)) {
      errors.push("docs/reference/configuration.md still advertises canonical create launchMode guidance");
    }
  }

  for (const relativePath of [
    "docs/commands/create.md",
    "docs/workflows/tmux-and-sesh.md",
    "docs/workflows/herdr.md"
  ]) {
    const content = read(relativePath);
    if (content !== null && /defaults\.create\.launchMode|defaults\.editors\.<host>\.create[^\n]*launchMode/.test(content)) {
      errors.push(`${relativePath} still advertises canonical create launchMode guidance`);
    }
  }
}

function checkStructuredContract(): void {
  const raw = read("contracts/create-launch-config.json");
  if (raw === null) return;

  try {
    const contract = JSON.parse(raw);
    const expected = {
      schemaVersion: 1,
      canonicalField: "defaults.create.launch",
      modes,
      absentMode: "none",
      switch: {
        field: "defaults.create.switch",
        type: "boolean",
        independent: true,
        launchImpliesSwitch: true
      },
      editorHosts: ["vscode", "cursor", "kiro"],
      editorScope: "defaults.editors.<host>.create",
      editorScopeFallback: "none",
      cliPrecedence: ["explicit-launcher", "launch", "no-launch", "configured", "none"],
      legacyFields: ["launch:boolean", "launchMode", "launch_mode"],
      acceptedMigrations: [
        "launcher-without-boolean",
        "true-with-absent-or-launcher",
        "false-without-launcher",
        "canonical-with-compatible-launcher",
        "equal-launcher-aliases"
      ],
      rejectedMigrations: [
        "false-with-launcher",
        "conflicting-launcher-aliases",
        "none-with-launcher",
        "auto-with-explicit-launcher",
        "opposite-explicit-launchers",
        "invalid-values"
      ],
      jsonRestrictedModes: ["auto", "sesh", "herdr"],
      failurePreservesCreatedWorktrees: true
    };

    if (JSON.stringify(contract) !== JSON.stringify(expected)) {
      errors.push("contracts/create-launch-config.json does not match the documented create-launch contract");
    }
  } catch {
    errors.push("contracts/create-launch-config.json is not valid JSON");
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
