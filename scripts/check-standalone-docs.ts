import { readFileSync } from "node:fs";
import path from "node:path";

const standaloneLink = "/getting-started/standalone/";

const sourceRequirements = new Map<string, string[]>([
  ["astro.config.mjs", ["configured meta-repositories", "ad hoc support"]],
  [
    "docs/index.mdx",
    [standaloneLink, "configured meta-repositories", "one unconfigured project"]
  ],
  [
    "docs/getting-started/standalone.md",
    [
      "aw init --zero-config",
      "Configured mode is preferred",
      ".worktrees/<branch>",
      "aw create",
      "aw list",
      "aw status",
      "aw switch",
      "aw remove",
      "aw init",
      "user-global"
    ]
  ],
  [
    "docs/getting-started/index.md",
    [standaloneLink, "one repository"]
  ],
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
  [
    "docs/commands/list.md",
    [standaloneLink, "standalone", "--max-depth", "not supported"]
  ],
  ...["add", "clone", "sync", "pull", "push", "exec", "setup"].map(
    (command): [string, string[]] => [
      `docs/commands/${command}.md`,
      [standaloneLink, "configured mode", "aw init"]
    ]
  )
]);

const generatedRequirements = new Map<string, string[]>([
  ["public/index.md", [standaloneLink, "configured meta-repositories", "run ad hoc"]],
  ["public/getting-started/standalone.md", ["aw init --zero-config", ".worktrees/<branch>"]],
  ["public/getting-started.md", [standaloneLink, "one repository"]],
  ["public/commands.md", [standaloneLink, "standalone"]],
  ["public/llms.txt", ["Use Arashi in one repository", "/getting-started/standalone.md"]],
  [
    "public/llms-full.txt",
    ["# One Repository", "aw init --zero-config", ".worktrees/<branch>"]
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
  [
    "public/commands/list.md",
    [standaloneLink, "standalone", "--max-depth", "not supported"]
  ],
  ...["add", "clone", "sync", "pull", "push", "exec", "setup"].map(
    (command): [string, string[]] => [
      `public/commands/${command}.md`,
      [standaloneLink, "configured mode", "aw init"]
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
    ["Use Arashi in one repository", "https://arashi.haphazard.dev/getting-started/standalone/"],
    ["Standalone workflow Markdown", "https://arashi.haphazard.dev/getting-started/standalone.md"]
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
    "https://arashi.haphazard.dev/getting-started/workspace/",
    "https://arashi.haphazard.dev/getting-started/standalone/",
    "https://arashi.haphazard.dev/workflows/",
    "https://arashi.haphazard.dev/workflows/agents-and-specs/",
    "https://arashi.haphazard.dev/reference/configuration/",
    "https://arashi.haphazard.dev/commands/"
  ];
  const positions = expectedOrder.map((source) => sources.indexOf(source));

  if (positions.some((position) => position === -1)) {
    errors.push("public/llms-full.txt must export primary configured workflows, standalone, and commands");
  } else if (!positions.every((position, index) => index === 0 || positions[index - 1] < position)) {
    errors.push("public/llms-full.txt must present configured onboarding before standalone guidance and task workflows");
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
