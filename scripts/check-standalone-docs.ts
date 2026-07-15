import { readFileSync } from "node:fs";
import path from "node:path";

const standaloneLink = "/workflows/standalone/";

const sourceRequirements = new Map<string, string[]>([
  ["astro.config.mjs", ["standalone repositories", "configured meta-repositories"]],
  ["docs/index.mdx", [standaloneLink, "standalone repositories", "configured meta-repositories"]],
  [
    "docs/workflows/standalone.md",
    [
      "arashi init --zero-config",
      "git rev-parse --git-path info/exclude",
      "if [ -L \"$exclude_file\" ]; then",
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
  ["docs/commands/index.md", [standaloneLink, "standalone"]],
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
  ["public/index.md", [standaloneLink, "standalone repositories", "configured meta-repositories"]],
  ["public/workflows/standalone.md", ["arashi init --zero-config", ".worktrees/<branch>"]],
  ["public/getting-started.md", [standaloneLink, "arashi init --zero-config"]],
  ["public/commands.md", [standaloneLink, "standalone"]],
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
checkGeneratedStandaloneLinks();
checkGeneratedPageOrder();

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

function checkGeneratedStandaloneLinks(): void {
  const content = read("public/llms.txt");
  if (content === null) return;

  const links = new Map(
    [...content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((match) => [match[1], match[2]])
  );
  const expectedLinks = new Map([
    ["Standalone workflow", "https://arashi.haphazard.dev/workflows/standalone/"],
    ["Standalone workflow Markdown", "https://arashi.haphazard.dev/workflows/standalone.md"]
  ]);

  for (const [label, target] of expectedLinks) {
    if (links.get(label) !== target) {
      errors.push(`public/llms.txt must link ${JSON.stringify(label)} to ${target}`);
    }
  }
}

function checkGeneratedPageOrder(): void {
  const content = read("public/llms-full.txt");
  if (content === null) return;

  const sources = [...content.matchAll(/^Source:\s+(\S+)$/gm)].map((match) => match[1]);
  const expectedOrder = [
    "https://arashi.haphazard.dev/workflows/",
    "https://arashi.haphazard.dev/workflows/standalone/",
    "https://arashi.haphazard.dev/commands/"
  ];
  const positions = expectedOrder.map((source) => sources.indexOf(source));

  if (positions.some((position) => position === -1)) {
    errors.push("public/llms-full.txt must export the workflow index, standalone workflow, and command index");
  } else if (!(positions[0] < positions[1] && positions[1] < positions[2])) {
    errors.push("public/llms-full.txt must prioritize standalone between the workflow and command indexes");
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
