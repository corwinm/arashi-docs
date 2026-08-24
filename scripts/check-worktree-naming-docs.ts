import { readFileSync } from "node:fs";
import path from "node:path";

type Requirement = [label: string, text: string];

const root = process.cwd();
const checkerName = "check-worktree-naming-docs.ts";
const failures: string[] = [];

const closedConfiguration: Requirement[] = [
  ["root worktreeNaming object", 'root `worktreeNaming` object'],
  ["closed style vocabulary", '`style`: `default | branch | repo-branch`'],
  ["closed branchSlashes vocabulary", '`branchSlashes`: `preserve | flatten`'],
  ["default style omission", 'Omitting `style` means `default`'],
  ["preserve slash omission", 'omitting `branchSlashes` means `preserve`'],
  ["no automatic persistence", 'does not auto-persist either default'],
  ["no automatic migration", 'does not migrate existing configuration'],
  ["direct edit workflow", 'edit `.arashi/config.json` directly'],
  ["configure exclusion", 'not available in interactive `aw configure`'],
];

const examples: Requirement[] = [
  ["default preserve example", 'Bare `default` + `preserve` | `example/feature/auth`'],
  ["default flatten example", 'Bare `default` + `flatten` | `example/feature-auth`'],
  ["branch preserve example", 'Bare `branch` + `preserve` | `feature/auth`'],
  ["branch flatten example", 'Bare `branch` + `flatten` | `feature-auth`'],
  ["repo-branch preserve example", 'Bare `repo-branch` + `preserve` | `example-feature/auth`'],
  ["repo-branch flatten example", 'Bare `repo-branch` + `flatten` | `example-feature-auth`'],
  ["non-bare default example", 'Non-bare `default` + `preserve` | `feature/auth`'],
];

const safetyBoundaries: Requirement[] = [
  ["filesystem-only mapping", 'changes only the filesystem path'],
  ["exact Git branch", 'Git branch remains exactly `feature/auth`'],
  ["deterministic collision failure", 'fails deterministically instead of appending a suffix'],
  ["metadata-authoritative existing paths", 'Existing worktree paths are metadata-authoritative'],
  ["no rename", 'never renamed by this setting'],
  ["coordinated child placement", 'Coordinated children remain under the planned parent path using their configured child paths'],
  ["standalone unchanged", 'Standalone `.worktrees/<branch>` placement is unchanged'],
];

const surfaces = new Map<string, Requirement[]>([
  ["docs/workflows/config.md", [...closedConfiguration, ...examples, ...safetyBoundaries]],
  ["docs/commands/create.md", [...closedConfiguration, ...examples, ...safetyBoundaries]],
  ["public/workflows/config.md", [...closedConfiguration, ...examples, ...safetyBoundaries]],
  ["public/commands/create.md", [...closedConfiguration, ...examples, ...safetyBoundaries]],
  ["public/llms.txt", [...closedConfiguration, ...examples, ...safetyBoundaries]],
  ["public/llms-full.txt", [...closedConfiguration, ...examples, ...safetyBoundaries]],
  ["scripts/generate-agent-exports.ts", [...closedConfiguration, ...examples, ...safetyBoundaries]],
]);

for (const [relativePath, requirements] of surfaces) {
  let content: string;
  try {
    content = readFileSync(path.join(root, relativePath), "utf8").replaceAll("\\`", "`");
  } catch {
    failures.push(`${relativePath} is missing`);
    continue;
  }

  for (const [label, text] of requirements) {
    if (!content.toLowerCase().includes(text.toLowerCase())) {
      failures.push(`${relativePath} is missing ${label}`);
    }
  }
}

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};
const focused = `pnpm sync:content && node scripts/${checkerName}`;
if (packageJson.scripts?.["validate:worktree-naming-docs"] !== focused) {
  failures.push("package.json must define validate:worktree-naming-docs");
}
if (!packageJson.scripts?.validate?.includes("pnpm validate:semantic-docs")) {
  failures.push("package.json validate must retain the stable semantic docs aggregate");
}

const manifest = JSON.parse(
  readFileSync(path.join(root, "scripts/semantic-doc-checks.json"), "utf8"),
) as unknown;
if (!Array.isArray(manifest) || !manifest.includes(checkerName)) {
  failures.push(`scripts/semantic-doc-checks.json must register ${checkerName}`);
}

const workflow = readFileSync(
  path.join(root, ".github/workflows/docs-validate.yml"),
  "utf8",
);
if (!/^\s*run:\s*pnpm validate\s*$/m.test(workflow)) {
  failures.push("docs workflow must execute the stable pnpm validate aggregate");
}
if (workflow.includes(checkerName)) {
  failures.push("docs workflow must not name the focused worktree naming checker");
}

if (failures.length > 0) {
  console.error("Worktree-naming documentation contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Worktree-naming documentation contract passed for ${surfaces.size} canonical/generated surfaces.`,
);
