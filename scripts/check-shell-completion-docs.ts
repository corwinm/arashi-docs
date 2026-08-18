import { readFileSync } from "node:fs";
import path from "node:path";

const sourceRequirements = new Map<string, string[]>([
  [
    "docs/commands/completion.md",
    [
      "aw completion <bash|zsh|fish>",
      "Static command and option completion works outside an Arashi workspace",
      "repositories, configured groups, worktrees, branches, supported shells, and constrained option values",
      "`switch [filter]` and `remove [target]`",
      "`move --from` and `move --to`",
      "branch, worktree name, or path",
      "`--path`",
      "local workspace state",
      "read-only",
      "does not perform network requests",
      "does not execute hooks",
      "does not prompt",
      "does not start child operations",
      "200 ms whole-query budget",
      "command aw",
      "Bash retains the canonical descriptions",
      "does not natively display per-candidate descriptions",
      "Zsh and Fish"
    ]
  ],
  [
    "docs/commands/shell.md",
    [
      "`aw shell init <shell>` remains wrapper-only",
      "source <(command aw completion bash)",
      "source <(command aw completion zsh)",
      "command aw completion fish | source",
      "`aw shell install` owns both activation lines",
      "managed block"
    ]
  ],
  ["docs/commands/index.md", ["[completion](/commands/completion/)"]]
]);

const generatedRequirements = new Map<string, string[]>([
  ["public/commands/completion.md", sourceRequirements.get("docs/commands/completion.md") ?? []],
  ["public/commands/shell.md", sourceRequirements.get("docs/commands/shell.md") ?? []],
  ["public/commands.md", sourceRequirements.get("docs/commands/index.md") ?? []],
  [
    "public/llms.txt",
    [
      "`aw completion bash|zsh|fish`",
      "static completion works outside workspaces",
      "local and read-only",
      "200 ms",
      "Completion command Markdown"
    ]
  ],
  [
    "public/llms-full.txt",
    [
      "Source: https://arashi.haphazard.dev/commands/completion/",
      "aw completion <bash|zsh|fish>",
      "`aw shell init <shell>` remains wrapper-only",
      "silently returns no dynamic candidates",
      "does not perform network requests or mutate workspace state"
    ]
  ]
]);

const errors: string[] = [];
checkRequirements(sourceRequirements);
checkRequirements(generatedRequirements);
checkForbiddenStaleGuidance();

if (errors.length > 0) {
  console.error("Shell completion documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  "Shell completion documentation contract passed for canonical command pages, generated Markdown routes, and agent-readable exports."
);

function checkRequirements(requirements: Map<string, string[]>): void {
  for (const [relativePath, expected] of requirements) {
    const content = read(relativePath);
    if (content === null) continue;
    for (const text of expected) {
      if (!content.toLowerCase().includes(text.toLowerCase())) {
        errors.push(`${relativePath} is missing ${JSON.stringify(text)}`);
      }
    }
  }
}

function checkForbiddenStaleGuidance(): void {
  for (const relativePath of [
    "docs/commands/index.md",
    "public/commands.md",
    "public/llms.txt",
    "public/llms-full.txt"
  ]) {
    const content = read(relativePath);
    if (content?.includes("Native shell completion is not added or claimed")) {
      errors.push(`${relativePath} still says native shell completion is unavailable`);
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
