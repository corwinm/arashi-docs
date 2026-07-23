import { readFileSync } from "node:fs";
import path from "node:path";

type Requirement = {
  path: string;
  text: string[];
};

const sourceRequirements: Requirement[] = [
  {
    path: "docs/commands/switch.md",
    text: [
      "arashi switch --tmux feature-auth",
      "plain tmux window",
      "non-empty `TMUX`",
      "per-invocation-only",
      "auto | cd | launch | sesh | herdr",
      "`--tmux` + `--no-cd`",
      "`--tmux` + `--no-default-launch`",
      "`--tmux` conflicts with `--cd`, `--sesh`, `--herdr`, `--vscode`, `--cursor`, and `--kiro`",
      "does not fall back",
      "`launch` mode label",
      "one JSON document",
      "zero-config standalone",
      "single argument after `tmux new-window -c`"
    ]
  },
  {
    path: "docs/commands/create.md",
    text: [
      "arashi create feature-auth-refresh --tmux",
      "plain tmux window",
      "non-empty `TMUX`",
      "per-invocation-only",
      "auto | sesh | herdr",
      "`--tmux` + `--no-launch`",
      "`--tmux` + `--no-switch`",
      "`--tmux` conflicts with `--sesh` and `--herdr`",
      "before creating worktrees or running create hooks",
      "does not fall back",
      "preserves the successfully created worktrees",
      "`interactive-or-launch` mode label",
      "one JSON document",
      "zero-config standalone",
      "single argument after `tmux new-window -c`"
    ]
  },
  {
    path: "docs/workflows/tmux-and-sesh.md",
    text: [
      "arashi switch --tmux feature-auth",
      "arashi create feature-auth --tmux",
      "plain tmux window",
      "requires the `sesh` binary",
      "non-empty `TMUX`",
      "per-invocation-only",
      "configured `auto`",
      "zero-config standalone",
      "does not fall back",
      "JSON_UNSUPPORTED_FOR_MODE"
    ]
  }
];

const generatedRequirements: Requirement[] = [
  ...sourceRequirements.map(({ path: sourcePath, text }) => ({
    path: sourcePath.replace(/^docs\//, "public/"),
    text
  })),
  {
    path: "public/llms.txt",
    text: [
      "`arashi switch --tmux`",
      "`arashi create --tmux`",
      "per-invocation",
      "configured `auto`",
      "[tmux and sesh workflow Markdown](https://arashi.haphazard.dev/workflows/tmux-and-sesh.md)"
    ]
  },
  {
    path: "public/llms-full.txt",
    text: [
      "arashi switch --tmux feature-auth",
      "arashi create feature-auth-refresh --tmux",
      "requires the `sesh` binary",
      "`interactive-or-launch` mode label"
    ]
  }
];

const errors: string[] = [];
checkRequirements(sourceRequirements);
checkRequirements(generatedRequirements);
checkConfigurationContract();

if (errors.length > 0) {
  console.error("Explicit tmux launch documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Explicit tmux launch documentation contract passed for ${sourceRequirements.length} canonical pages and ${generatedRequirements.length} generated exports.`
);

function checkRequirements(requirements: Requirement[]): void {
  for (const requirement of requirements) {
    const content = read(requirement.path);
    if (content === null) continue;
    for (const expected of requirement.text) {
      if (!content.includes(expected)) {
        errors.push(`${requirement.path} is missing ${JSON.stringify(expected)}`);
      }
    }
  }
}

function checkConfigurationContract(): void {
  const raw = read("contracts/switch-config.json");
  if (raw === null) return;

  try {
    const contract = JSON.parse(raw) as { modes?: unknown };
    const expectedModes = ["auto", "cd", "launch", "sesh", "herdr"];
    if (JSON.stringify(contract.modes) !== JSON.stringify(expectedModes)) {
      errors.push("contracts/switch-config.json must keep the switch mode vocabulary unchanged");
    }
  } catch {
    errors.push("contracts/switch-config.json is not valid JSON");
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
