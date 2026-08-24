import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const sourceRoot = process.cwd();
const checker = "check-worktree-naming-docs.ts";

type Fixture = {
  id: string;
  relativePath: string;
  mutate(content: string): string;
};

const replace = (from: string, to: string) => (content: string): string => {
  if (!content.includes(from)) throw new Error(`fixture source not found: ${JSON.stringify(from)}`);
  return content.replace(from, to);
};
const appendToSection = (heading: string, claim: string) => (content: string): string => {
  const start = content.indexOf(heading);
  if (start < 0) throw new Error(`fixture heading not found: ${heading}`);
  const next = content.indexOf("\n## ", start + heading.length);
  const insertion = next < 0 ? content.length : next;
  return `${content.slice(0, insertion).trimEnd()}\n\n${claim}\n${content.slice(insertion)}`;
};

const detailedPath = "docs/workflows/config.md";
const fixtures: Fixture[] = [];

for (const value of ["default", "branch", "repo-branch"]) {
  fixtures.push({
    id: `style-${value}-removed`,
    relativePath: detailedPath,
    mutate: replace(`\`style\`: \`default | branch | repo-branch\``, `\`style\`: \`${["default", "branch", "repo-branch"].filter((entry) => entry !== value).join(" | ")}\``),
  });
}
for (const value of ["preserve", "flatten"]) {
  fixtures.push({
    id: `branch-slashes-${value}-removed`,
    relativePath: detailedPath,
    mutate: replace(`\`branchSlashes\`: \`preserve | flatten\``, `\`branchSlashes\`: \`${value === "preserve" ? "flatten" : "preserve"}\``),
  });
}
fixtures.push(
  {
    id: "default-style-omission-mutated",
    relativePath: detailedPath,
    mutate: replace("Omitting `style` means `default`", "Omitting `style` means `branch`"),
  },
  {
    id: "preserve-slashes-omission-mutated",
    relativePath: detailedPath,
    mutate: replace("omitting `branchSlashes` means `preserve`", "omitting `branchSlashes` means `flatten`"),
  },
  {
    id: "nested-json-shape-mutated",
    relativePath: detailedPath,
    mutate: replace(
      '  "worktreeNaming": {\n    "style": "repo-branch",\n    "branchSlashes": "flatten"\n  }',
      '  "style": "repo-branch",\n  "branchSlashes": "flatten"',
    ),
  },
  {
    id: "direct-authored-scope-mutated",
    relativePath: detailedPath,
    mutate: replace("edit `.arashi/config.json` directly", "edit generated output directly"),
  },
);

const expectedRows = [
  ["Bare", "default", "preserve", "example/feature/auth"],
  ["Bare", "default", "flatten", "example/feature-auth"],
  ["Bare", "branch", "preserve", "feature/auth"],
  ["Bare", "branch", "flatten", "feature-auth"],
  ["Bare", "repo-branch", "preserve", "example-feature/auth"],
  ["Bare", "repo-branch", "flatten", "example-feature-auth"],
  ["Non-bare", "default", "preserve", "feature/auth"],
  ["Non-bare", "default", "flatten", "feature-auth"],
  ["Non-bare", "branch", "preserve", "feature/auth"],
  ["Non-bare", "branch", "flatten", "feature-auth"],
  ["Non-bare", "repo-branch", "preserve", "example-feature/auth"],
  ["Non-bare", "repo-branch", "flatten", "example-feature-auth"],
] as const;
for (const [topology, style, slashes, destination] of expectedRows) {
  const canonicalRow = `| ${topology} \`${style}\` + \`${slashes}\` | \`${destination}\` |`;
  fixtures.push({
    id: `mapping-${topology.toLowerCase()}-${style}-${slashes}-mutated`,
    relativePath: detailedPath,
    mutate(content) {
      if (!content.includes(canonicalRow)) {
        const anchor = "| Non-bare `default` + `preserve` | `feature/auth` |";
        if (!content.includes(anchor)) throw new Error(`fixture table anchor not found: ${anchor}`);
        content = content.replace(anchor, `${anchor}\n${canonicalRow}`);
      }
      return content.replace(canonicalRow, `| ${topology} \`${style}\` + \`${slashes}\` | \`wrong-${destination}\` |`);
    },
  });
}

for (const [id, from, to] of [
  ["filesystem-only", "changes only the filesystem path", "also changes the Git branch"],
  ["exact-git-branch", "Git branch remains exactly `feature/auth`", "Git branch becomes `feature-auth`"],
  ["no-suffix-collision", "fails deterministically instead of appending a suffix", "appends a suffix"],
  ["metadata-authority", "Existing worktree paths are metadata-authoritative", "Naming configuration is authoritative for existing worktree paths"],
  ["no-rename", "never renamed by this setting", "may be renamed by this setting"],
  ["coordinated-child", "Coordinated children remain under the planned parent path using their configured child paths", "Coordinated children move to independently named roots"],
  ["standalone", "Standalone `.worktrees/<branch>` placement is unchanged", "Standalone placement follows `worktreeNaming`"],
  ["no-persist", "does not auto-persist either default", "auto-persists both defaults"],
  ["no-migrate", "does not migrate existing configuration", "migrates existing configuration"],
  ["configure-exclusion", "not available in interactive `aw configure`", "available in interactive `aw configure`"],
] as const) {
  fixtures.push({ id: `${id}-mutated`, relativePath: detailedPath, mutate: replace(from, to) });
}

for (const [id, claim] of [
  ["style-additive-contradiction", "The style also accepts `ticket`."],
  ["slashes-additive-contradiction", "The branchSlashes setting also accepts `remove`."],
  ["defaults-additive-contradiction", "When omitted, style uses `branch` and branchSlashes uses `flatten`."],
  ["json-additive-contradiction", "The same fields may instead be authored at the JSON root."],
  ["scope-additive-contradiction", "Interactive `aw configure` can edit worktreeNaming."],
  ["branch-additive-contradiction", "For flattened paths, Arashi rewrites the Git branch to `feature-auth`."],
  ["collision-additive-contradiction", "On collision, create retries with a numeric suffix."],
  [
    "destination-matrix-prose-contradiction",
    "For bare workspaces, default plus preserve instead maps feature/auth to wrong-example-feature-auth.",
  ],
  [
    "collision-carveout-contradiction",
    "Despite the deterministic rule above, create may append a numeric suffix when a collision occurs.",
  ],
  [
    "destination-matrix-prose-contradiction-puts",
    "For bare workspaces, default plus preserve puts feature/auth at wrong-example-feature-auth.",
  ],
  [
    "destination-matrix-prose-contradiction-yields",
    "In a bare workspace, default with preserve yields wrong-example-feature-auth for feature/auth.",
  ],
  [
    "destination-matrix-prose-contradiction-copula",
    "For bare workspaces with default and preserve, the destination for feature/auth is wrong-example-feature-auth.",
  ],
  [
    "collision-carveout-falls-back",
    "Despite the deterministic rule above, a collision falls back to a numeric suffix.",
  ],
  [
    "collision-carveout-passive",
    "Despite the deterministic rule above, a collision is resolved by adding a numeric suffix.",
  ],
  [
    "collision-carveout-alternate-destination",
    "Despite the deterministic rule above, on collision create chooses another available destination.",
  ],
  ["metadata-additive-contradiction", "Changing this setting relocates existing registered worktrees."],
  ["coordinated-additive-contradiction", "Each coordinated child reapplies naming policy independently."],
  ["standalone-additive-contradiction", "Standalone create also honors worktreeNaming."],
] as const) {
  fixtures.push({
    id,
    relativePath: detailedPath,
    mutate: appendToSection("## Worktree naming", claim),
  });
}

for (const [id, relativePath, heading] of [
  ["authored-config-section-removed", "docs/workflows/config.md", "## Worktree naming"],
  ["authored-create-section-removed", "docs/commands/create.md", "## Worktree locations"],
  ["generated-config-section-removed", "public/workflows/config.md", "## Worktree naming"],
  ["generated-create-section-removed", "public/commands/create.md", "## Worktree locations"],
] as const) {
  fixtures.push({
    id,
    relativePath,
    mutate(content) {
      const start = content.indexOf(heading);
      if (start < 0) throw new Error(`fixture heading not found: ${heading}`);
      const end = content.indexOf("\n## ", start + heading.length);
      return content.slice(0, start) + content.slice(end < 0 ? content.length : end + 1);
    },
  });
}
fixtures.push(
  {
    id: "full-export-config-section-removed",
    relativePath: "public/llms-full.txt",
    mutate: replace("## Worktree naming", "## Removed naming guidance"),
  },
  {
    id: "full-export-create-section-removed",
    relativePath: "public/llms-full.txt",
    mutate: replace("## Worktree locations", "## Removed worktree locations"),
  },
  {
    id: "compact-export-contract-removed",
    relativePath: "public/llms.txt",
    mutate: replace("- Configure new worktree paths in the root `worktreeNaming` object:", "- Removed worktree naming guidance:"),
  },
  {
    id: "compact-template-contract-removed",
    relativePath: "scripts/generate-agent-exports.ts",
    mutate: replace("- Configure new worktree paths in the root \\`worktreeNaming\\` object:", "- Removed worktree naming guidance:"),
  },
);

const unexpected: string[] = [];
for (const fixture of fixtures) {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "arashi-docs-worktree-naming-"));
  try {
    cpSync(sourceRoot, fixtureRoot, {
      recursive: true,
      filter(source) {
        const relative = path.relative(sourceRoot, source);
        return relative !== ".git" && relative !== "node_modules" && relative !== "dist" && relative !== ".astro";
      },
    });
    writeFileSync(
      path.join(fixtureRoot, "scripts/semantic-doc-checks.json"),
      `${JSON.stringify([checker], null, 2)}\n`,
    );
    const target = path.join(fixtureRoot, fixture.relativePath);
    writeFileSync(target, fixture.mutate(readFileSync(target, "utf8")));

    for (const [mode, script] of [
      ["focused", checker],
      ["stable aggregate", "run-semantic-doc-checks.ts"],
    ] as const) {
      const result = spawnSync(process.execPath, [path.join(fixtureRoot, "scripts", script)], {
        cwd: fixtureRoot,
        encoding: "utf8",
        env: { ...process.env, WORKTREE_NAMING_FIXTURE_TEST: "1" },
      });
      if (result.status === 0) unexpected.push(`${fixture.id} (${mode})`);
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

if (unexpected.length > 0) {
  console.error("Worktree-naming controlled fixtures were unexpectedly accepted:");
  for (const miss of unexpected) console.error(`- ${miss}`);
  process.exit(1);
}

console.log(
  `Worktree-naming controlled fixtures passed: ${fixtures.length} drifts rejected by focused and stable aggregate validation from temporary out-of-repository copies.`,
);
