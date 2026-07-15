import { readFileSync } from "node:fs";
import path from "node:path";

const standaloneLink = "/workflows/standalone/";

const sourceRequirements = new Map<string, string[]>([
  [
    "docs/workflows/standalone.md",
    [
      "arashi init --zero-config",
      "git rev-parse --git-path info/exclude",
      ".worktrees/<branch>",
      "arashi create",
      "arashi list",
      "arashi status",
      "arashi switch",
      "arashi remove",
      "arashi init",
      "user-global",
      "--json"
    ]
  ],
  ["docs/getting-started/index.md", [standaloneLink, "arashi init --zero-config"]],
  ["docs/workflows/index.md", [standaloneLink, "Standalone"]],
  ["docs/commands/init.md", [standaloneLink, "--zero-config"]],
  ...[
    "create",
    "list",
    "status",
    "switch",
    "remove",
    "prune",
    "doctor",
    "move",
    "handoff"
  ].map(
    (command): [string, string[]] => [
      `docs/commands/${command}.md`,
      [standaloneLink, "standalone"]
    ]
  ),
  ...["add", "clone", "sync", "pull", "push", "exec", "setup"].map(
    (command): [string, string[]] => [
      `docs/commands/${command}.md`,
      [standaloneLink, "configured mode", "arashi init"]
    ]
  )
]);

const generatedRequirements = new Map<string, string[]>([
  ["public/workflows/standalone.md", ["arashi init --zero-config", ".worktrees/<branch>"]],
  ["public/getting-started.md", [standaloneLink, "arashi init --zero-config"]],
  ["public/llms.txt", ["Standalone workflow", "/workflows/standalone.md"]],
  [
    "public/llms-full.txt",
    ["# Standalone Repository Workflow", "arashi init --zero-config", ".worktrees/<branch>"]
  ],
  ...[
    "create",
    "list",
    "status",
    "switch",
    "remove",
    "prune",
    "doctor",
    "move",
    "handoff"
  ].map(
    (command): [string, string[]] => [
      `public/commands/${command}.md`,
      [standaloneLink, "standalone"]
    ]
  ),
  ...["add", "clone", "sync", "pull", "push", "exec", "setup"].map(
    (command): [string, string[]] => [
      `public/commands/${command}.md`,
      [standaloneLink, "configured mode", "arashi init"]
    ]
  )
]);

const errors: string[] = [];
checkRequirements(sourceRequirements);
checkRequirements(generatedRequirements);

const generator = read("scripts/generate-agent-exports.ts");
if (generator !== null) {
  const standaloneEntries = generator.match(/^\s*"workflows\/standalone\.md",?$/gm) ?? [];
  if (standaloneEntries.length < 2) {
    errors.push(
      "scripts/generate-agent-exports.ts must include workflows/standalone.md in coreOrder and requiredRoutes"
    );
  }
  const standalonePosition = generator.indexOf('"workflows/standalone.md",');
  const workflowIndexPosition = generator.indexOf('"workflows/index.md",');
  const commandsPosition = generator.indexOf('"commands/index.md",');
  if (
    standalonePosition === -1 ||
    workflowIndexPosition === -1 ||
    commandsPosition === -1 ||
    standalonePosition < workflowIndexPosition ||
    standalonePosition > commandsPosition
  ) {
    errors.push("standalone workflow is not prioritized between the workflow and command indexes");
  }
}

if (errors.length > 0) {
  console.error("Standalone documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Standalone documentation contract passed for ${sourceRequirements.size} source pages and ${generatedRequirements.size} generated exports.`
);

function checkRequirements(requirements: Map<string, string[]>): void {
  for (const [relativePath, expectedText] of requirements) {
    const content = read(relativePath);
    if (content === null) continue;
    for (const text of expectedText) {
      if (!content.toLowerCase().includes(text.toLowerCase())) {
        errors.push(`${relativePath} is missing ${JSON.stringify(text)}`);
      }
    }
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