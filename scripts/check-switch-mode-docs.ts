import { readFileSync } from "node:fs";
import path from "node:path";

const modeVocabulary = "auto | cd | launch | sesh | herdr";
const autoOrder = "tmux → Herdr → cmux → integrated IDE → parent-shell `cd` → terminal/platform fallback";

const sourceRequirements = new Map<string, string[]>([
  [
    "docs/commands/switch.md",
    [
      modeVocabulary,
      autoOrder,
      "An absent mode preserves automatic launch",
      "--no-cd",
      "--no-default-launch",
      "`--tmux` conflicts with `--cd`, `--sesh`, `--herdr`, `--vscode`, `--cursor`, and `--kiro`"
    ]
  ],
  [
    "docs/workflows/config.md",
    [
      modeVocabulary,
      "An absent `defaults.switch.mode` preserves automatic launch",
      "Legacy switch mode migration",
      "launchMode",
      "launch_mode",
      "`cd` + `sesh` / `herdr`",
      "Unsupported values are rejected",
      "reject",
      "defaults.create.launch",
      "defaults.editors.<host>.create"
    ]
  ],
  ["docs/commands/shell.md", ["managed context", "parent-shell `cd`"]],
  ["docs/workflows/tmux-and-sesh.md", ["mode: \"auto\"", "mode: \"sesh\""]],
  ["docs/workflows/herdr.md", ["mode: \"herdr\"", "--no-default-launch", "--no-cd"]],
  ["docs/workflows/cmux.md", ["mode: \"auto\"", "mode: \"cd\"", "--herdr"]]
]);

const generatedRequirements = new Map<string, string[]>([
  ["public/commands/switch.md", [modeVocabulary, autoOrder]],
  ["public/workflows/config.md", ["Legacy switch mode migration", "launch_mode"]],
  ["public/workflows/tmux-and-sesh.md", ["mode: \"auto\"", "mode: \"sesh\""]],
  ["public/workflows/herdr.md", ["mode: \"herdr\""]],
  ["public/workflows/cmux.md", ["mode: \"auto\"", "mode: \"cd\""]],
  ["public/llms.txt", [modeVocabulary, "Switch command Markdown", "Configuration workflow Markdown"]],
  ["public/llms-full.txt", [modeVocabulary, autoOrder, "Legacy switch mode migration"]]
]);

const staleSwitchLaunchModePages = [
  "docs/commands/switch.md",
  "docs/workflows/tmux-and-sesh.md",
  "docs/workflows/herdr.md",
  "docs/workflows/cmux.md"
];

const errors: string[] = [];
checkStructuredContract();
checkWorkflowCoverage();
checkRequirements(sourceRequirements);
checkRequirements(generatedRequirements);

for (const relativePath of staleSwitchLaunchModePages) {
  const content = read(relativePath);
  if (content?.includes("defaults.switch.launchMode")) {
    errors.push(`${relativePath} still advertises defaults.switch.launchMode`);
  }
}

const switchPage = read("docs/commands/switch.md");
if (switchPage?.includes("prefers parent-shell switching only when shell integration is active")) {
  errors.push("docs/commands/switch.md still documents inverted auto precedence");
}

if (errors.length > 0) {
  console.error("Unified switch-mode documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Unified switch-mode documentation contract passed for ${sourceRequirements.size} source pages and ${generatedRequirements.size} generated exports.`
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

function checkWorkflowCoverage(): void {
  const workflow = read(".github/workflows/docs-validate.yml");
  if (workflow === null) return;

  const contractPathFilter = '- "contracts/**"';
  const pathFilterCount = workflow.split(contractPathFilter).length - 1;
  if (pathFilterCount !== 2) {
    errors.push(
      ".github/workflows/docs-validate.yml must include contracts/** in pull_request and push path filters"
    );
  }

  if (!workflow.includes("run: pnpm validate:switch-mode-docs")) {
    errors.push(
      ".github/workflows/docs-validate.yml must run pnpm validate:switch-mode-docs"
    );
  }
}

function checkStructuredContract(): void {
  const raw = read("contracts/switch-config.json");
  if (raw === null) return;
  try {
    const contract = JSON.parse(raw);
    const expected = {
      schemaVersion: 1,
      canonicalField: "defaults.switch.mode",
      modes: ["auto", "cd", "launch", "sesh", "herdr"],
      absentMode: "launch",
      autoOrder: ["tmux", "herdr", "cmux", "ide", "cd", "platform"],
      legacyFields: [
        "defaults.switch.launchMode",
        "defaults.switch.launch_mode"
      ]
    };
    if (JSON.stringify(contract) !== JSON.stringify(expected)) {
      errors.push("contracts/switch-config.json does not match the documented unified-mode contract");
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
