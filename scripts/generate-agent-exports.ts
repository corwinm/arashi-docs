import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import path from "node:path";

const docsRoot = path.resolve("docs");
const publicRoot = path.resolve("public");
const site = "https://arashi.haphazard.dev";

const coreOrder = [
  "index.mdx",
  "getting-started/index.md",
  "getting-started/installation.md",
  "getting-started/workspace.md",
  "getting-started/standalone.md",
  "workflows/index.md",
  "workflows/change-lifecycle.md",
  "workflows/coordinate-repositories.md",
  "workflows/setup-and-cleanup.md",
  "workflows/agents-and-specs.md",
  "workflows/automation.md",
  "workflows/environment-integrations.md",
  "workflows/herdr.md",
  "workflows/kitty.md",
  "workflows/vscode.md",
  "workflows/tmux-and-sesh.md",
  "reference/index.md",
  "reference/configuration.md",
  "reference/hooks.md",
  "reference/launching.md",
  "commands/index.md",
  "commands/status.md",
  "commands/create.md",
  "commands/move.md",
  "commands/exec.md",
  "commands/pull.md",
  "commands/push.md",
  "commands/sync.md",
  "commands/delete.md",
  "commands/remove.md",
  "commands/prune.md",
  "commands/shell.md",
  "commands/completion.md",
  "commands/list.md",
  "commands/switch.md",
  "commands/setup.md",
  "commands/init.md",
  "commands/clone.md",
  "commands/add.md",
  "commands/configure.md",
  "commands/update.md",
  "commands/uninstall.md",
  "contributing/index.md"
];

const generatedDirs = ["getting-started", "workflows", "reference", "commands", "contributing"];
const requiredRoutes = [
  "llms.txt",
  "llms-full.txt",
  "getting-started.md",
  "getting-started/installation.md",
  "getting-started/workspace.md",
  "getting-started/standalone.md",
  "workflows.md",
  "workflows/change-lifecycle.md",
  "workflows/coordinate-repositories.md",
  "workflows/setup-and-cleanup.md",
  "workflows/agents-and-specs.md",
  "workflows/automation.md",
  "workflows/environment-integrations.md",
  "workflows/herdr.md",
  "workflows/kitty.md",
  "reference.md",
  "reference/configuration.md",
  "reference/hooks.md",
  "reference/launching.md",
  "commands.md",
  "commands/exec.md",
  "commands/status.md",
  "commands/configure.md",
  "commands/delete.md",
  "commands/completion.md",
  "commands/uninstall.md",
  "contributing.md"
];

type Frontmatter = {
  title?: string;
  description?: string;
  draft?: boolean;
  hidden?: boolean;
};

type Page = {
  sourcePath: string;
  relativePath: string;
  markdownPath: string;
  canonicalPath: string;
  title: string;
  description?: string;
  body: string;
};

if (!existsSync(docsRoot)) {
  console.error(`Docs source directory not found: ${docsRoot}`);
  process.exit(1);
}

mkdirSync(publicRoot, { recursive: true });
for (const dir of generatedDirs) {
  rmSync(path.join(publicRoot, dir), { recursive: true, force: true });
}
for (const file of ["llms.txt", "llms-full.txt", "index.md", ...generatedDirs.map((dir) => `${dir}.md`)]) {
  rmSync(path.join(publicRoot, file), { force: true });
}

const pages = walk(docsRoot)
  .filter((file) => /\.mdx?$/.test(file))
  .map(loadPage)
  .filter((page): page is Page => page !== null);

const pageByRelativePath = new Map(pages.map((page) => [page.relativePath, page]));
const orderedPages = [
  ...coreOrder.map((relativePath) => pageByRelativePath.get(relativePath)).filter(Boolean),
  ...pages
    .filter((page) => !coreOrder.includes(page.relativePath))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
] as Page[];

for (const page of pages) {
  const markdown = renderPageMarkdown(page);
  writePublicFile(page.markdownPath, markdown);
  for (const aliasPath of markdownAliasRoutesFor(page.relativePath)) {
    writePublicFile(aliasPath, markdown);
  }
}

writePublicFile("llms.txt", renderLlmsTxt());
writePublicFile("llms-full.txt", renderLlmsFullTxt(orderedPages));

for (const route of requiredRoutes) {
  const outputPath = path.join(publicRoot, route);
  if (!existsSync(outputPath)) {
    console.error(`Required agent-readable export was not generated: /${route}`);
    process.exit(1);
  }
}

console.log(
  `Generated ${pages.length} Markdown page routes plus /llms.txt and /llms-full.txt for agent-readable docs.`
);

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    files.push(full);
  }

  return files;
}

function loadPage(sourcePath: string): Page | null {
  const relativePath = path.relative(docsRoot, sourcePath).replaceAll(path.sep, "/");
  const raw = readFileSync(sourcePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);

  if (frontmatter.draft || frontmatter.hidden) {
    return null;
  }

  const title = frontmatter.title ?? titleFromPath(relativePath);
  return {
    sourcePath,
    relativePath,
    markdownPath: markdownRouteFor(relativePath),
    canonicalPath: canonicalRouteFor(relativePath),
    title,
    description: frontmatter.description,
    body: normalizeBody(body)
  };
}

function splitFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: {}, body: raw };
  }

  const end = raw.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: {}, body: raw };
  }

  const block = raw.slice(4, end);
  const body = raw.slice(end + "\n---".length).replace(/^\r?\n/, "");
  return { frontmatter: parseFrontmatter(block), body };
}

function parseFrontmatter(block: string): Frontmatter {
  const frontmatter: Frontmatter = {};
  const lines = block.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const title = line.match(/^title:\s*(.+)$/);
    if (title) {
      frontmatter.title = unquote(title[1].trim());
      continue;
    }

    const description = line.match(/^description:\s*(.+)$/);
    if (description) {
      frontmatter.description = unquote(description[1].trim());
      continue;
    }

    const draft = line.match(/^draft:\s*(true|false)$/);
    if (draft) {
      frontmatter.draft = draft[1] === "true";
      continue;
    }

    if (/^sidebar:\s*$/.test(line)) {
      for (let nested = index + 1; nested < lines.length; nested += 1) {
        if (!/^\s+/.test(lines[nested])) {
          break;
        }
        const hidden = lines[nested].match(/^\s+hidden:\s*(true|false)$/);
        if (hidden) {
          frontmatter.hidden = hidden[1] === "true";
        }
      }
    }
  }

  return frontmatter;
}

function unquote(value: string): string {
  return value.replace(/^['"]|['"]$/g, "");
}

function normalizeBody(body: string): string {
  return body.trim().replace(/\n{3,}/g, "\n\n");
}

function markdownRouteFor(relativePath: string): string {
  const parsed = path.posix.parse(relativePath);
  if (parsed.name === "index") {
    return parsed.dir ? `${parsed.dir}/index.md` : "index.md";
  }
  return `${path.posix.join(parsed.dir, parsed.name)}.md`;
}

function markdownAliasRoutesFor(relativePath: string): string[] {
  const parsed = path.posix.parse(relativePath);
  if (parsed.name !== "index" || !parsed.dir) {
    return [];
  }
  return [`${parsed.dir}.md`];
}

function canonicalRouteFor(relativePath: string): string {
  const parsed = path.posix.parse(relativePath);
  if (parsed.name === "index") {
    return parsed.dir ? `/${parsed.dir}/` : "/";
  }
  return `/${path.posix.join(parsed.dir, parsed.name)}/`;
}

function titleFromPath(relativePath: string): string {
  const parsed = path.posix.parse(relativePath);
  const name = parsed.name === "index" ? path.posix.basename(parsed.dir) || "Arashi" : parsed.name;
  return name
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function renderPageMarkdown(page: Page): string {
  const parts = [`# ${page.title}`, `Canonical: ${site}${page.canonicalPath}`];
  if (page.description) {
    parts.push(`Description: ${page.description}`);
  }
  parts.push("", page.body, "");
  return parts.join("\n");
}

function renderLlmsTxt(): string {
  return `# Arashi

> Arashi is a Git worktree manager for standalone repositories and configured meta-repositories. It keeps worktrees organized for one repository or aligns related repositories across a shared workspace.

## Agent Guidance

- Start by inspecting workspace state with \`aw status\`.
- The \`arashi\` executable remains supported for existing scripts and workflows. See [Getting started](${site}/getting-started/) for installation and collision guidance.
- In a single repository, use \`aw init --zero-config\` and the root \`.worktrees/<branch>\` convention; use ordinary \`aw init\` for configured coordination.
- Use the meta-repo for shared context, OpenSpec proposals, planning, and cross-repo coordination.
- Put implementation, tests, and repo-specific docs in the owning child repository under \`repos/<project>/\`.
- Prefer machine-readable command output such as \`aw status --json\` when automating decisions.
- Use \`aw exec --json -- <command>\` for repeated multi-repo inspection or validation commands, with explicit \`--only\` filters for mutating or expensive commands.
- Expect configured lifecycle commands to reconcile safe managed paths with repository-local rules by default; inspect \`managedIgnore\` in JSON results.
- When \`aw add\` runs from a linked parent worktree, use its reported canonical and active paths instead of cloning the child twice.
- SSH aliases are machine-local. Arashi preserves configured SSH URLs exactly, never maps them to HTTPS automatically, and leaves resolution, authentication, and SSH configuration to Git/OpenSSH. See [SSH remote troubleshooting](${site}/commands/clone/#troubleshooting-ssh-remotes).
- Treat [Hooks](${site}/reference/hooks/) as the lifecycle contract: configured create scopes have different mutation points, configured remove evaluates every scope per target, standalone uses targeted-then-shared user-global hooks only, and aggregate cleanup parses \`ARASHI_REMOVE_TARGETS_JSON\`.
- Configured inline hooks use \`hooks.scripts.<lifecycle>\` for workspace ownership and \`repos.<name>.hooks.<lifecycle>\` for repository ownership. The four keys are \`pre-create\`, \`post-create\`, \`pre-remove\`, and \`post-remove\`; a string is Bash shorthand, while a closed interpreter map accepts only \`bash\`, \`powershell\`, and \`cmd\`.
- Prefer short reviewable inline commands and substantial reusable native files. Configured create discovers either inline configuration or native files as alternatives at workspace and repository-specific logical locations. Inline snippets are non-portable unless compatible interpreter variants are supplied. Inline and file sources at the same logical location produce an inline/file ambiguity and neither runs. On POSIX, configured Bash resolves from the first executable \`bash\` in \`PATH\` order. On Windows, configured selection is PowerShell, then cmd, then Bash. \`SystemRoot\` supplies the fixed PowerShell and cmd paths, while \`PATH\` selects \`bash.exe\`. No compatible executable fails as \`interpreter_unavailable\`.
- For configured repository remove, \`repos.<repo>.hooks.<lifecycle>\`, workspace-owned \`<configurationRoot>/.arashi/hooks/<lifecycle>.<repo><ext>\`, and compatible child-local \`<activeRepo>/.arashi/hooks/<lifecycle><ext>\` are three aliases for one repository slot. The qualified paths are \`<configurationRoot>/.arashi/hooks/pre-remove.<repo><ext>\` and \`<configurationRoot>/.arashi/hooks/post-remove.<repo><ext>\`. More than one claim fails before hook execution or removal mutation; aliases never compose and have no precedence. A selected source retains repository scope and a plain lifecycle hook name, reports its exact source path, and uses the active target checkout as cwd. Scope order remains repository → workspace → global-targeted → global-shared.
- Direct, bare, and linked topology keeps configuration authority storage for the qualified file while remove cwd remains the active target child checkout. On Windows, \`.ps1\`, \`.cmd\`, and \`.bat\` candidates across extensions or aliases are ambiguous and fail. Doctor and dry-run use the same runtime candidate resolver and report selection or ambiguity without mutation or execution.
- Repository file onboarding in \`aw add\` and \`aw configure\` creates \`.arashi/hooks/<lifecycle>.<repo><ext>\` under the configuration root; an existing child-local \`<activeRepo>/.arashi/hooks/<lifecycle><ext>\` blocks the duplicate. Delete owns only exact \`pre-remove.<repo><ext>\` and \`post-remove.<repo><ext>\` files and their \`.example\` templates; it preserves lookalikes, shared hooks, user-global hooks, and child-local policy outside clone ownership.
- \`--no-hooks\` is create-only; \`--no-hook-input\` is shared by create and remove. Remove dry-run returns source-aware previews. Configured-create dry-run performs no hook discovery, has an empty hook ledger, and no hook preview. Public metadata uses \`sourceKind: "inline-config"\`, \`sourceOwnerKind\`, and \`sourceOwnerName\`; \`sourceScriptPath\` is null or omitted. Outcomes, previews, diagnostics, and logs never reveal snippet command text.
- Keep inline commands fail-fast so later success cannot mask an earlier failure. Use shell-native environment forms such as \`$ARASHI_HOOK_TARGET_REPOSITORY\`, \`$env:ARASHI_HOOK_TARGET_REPOSITORY\`, and \`%ARASHI_HOOK_TARGET_REPOSITORY%\`. Inline snippets must not contain secrets. Standalone hooks remain native files only, as do user-global hooks.
- Hook input uses \`ARASHI_HOOK_INPUT=tty|disabled|unavailable\`. Human terminal create/remove can inherit stdin; the invocation-only \`--no-hook-input\`, JSON, and non-TTY automation provide immediate EOF as documented, with JSON authoritative. Before a tty hook reads, its attribution banner identifies inline source kind and owner or the native file's absolute script path. No persistent input policy is added.
- Preserve explicit clone-local \`tracked\` or \`none\` preferences and never modify global Git configuration or a global excludes file to silence a warning.
- The finite product-owned \`aw configure\` descriptor path set is exact and is never generated from the schema: \`reposDir\`, \`worktreesDir\`, \`baseBranch\`, \`sync.timeoutSeconds\`, \`hooks.timeout\`, \`hooks.scripts.pre-create\`, \`hooks.scripts.post-create\`, \`hooks.scripts.pre-remove\`, \`hooks.scripts.post-remove\`, \`defaults.create.switch\`, \`defaults.create.launch\`, \`defaults.switch.mode\`, \`defaults.editors.vscode.create.switch\`, \`defaults.editors.vscode.create.launch\`, \`defaults.editors.cursor.create.switch\`, \`defaults.editors.cursor.create.launch\`, \`defaults.editors.kiro.create.switch\`, \`defaults.editors.kiro.create.launch\`, \`meta.baseBranch\`, \`repos.<name>.groups\`, \`repos.<name>.baseBranch\`, \`repos.<name>.copy\`, \`repos.<name>.symlink\`, \`repos.<name>.hooks.pre-create\`, \`repos.<name>.hooks.post-create\`, \`repos.<name>.hooks.pre-remove\`, and \`repos.<name>.hooks.post-remove\`. \`repos.<name>.path\` and \`repos.<name>.gitUrl\` identify the repository and are not editable.
- Configured means a persisted field is present; Not configured means the field is absent or not persisted. Effective is shown separately for inherited or built-in values and never persists a value implicitly. These state labels are not runtime health; use \`aw doctor\` for diagnostics. Keep preserves the persisted field; Edit validates and replaces it; Clear removes an optional persisted field. Required \`reposDir\` cannot be cleared, and empty input is not clear.
- Existing active native files are external state: configure never clears, deletes, or overwrites them and offers keep/skip. At final confirmation, the exact serialized candidate JSON contains the same bytes that save will persist. A separate active-file plan lists lifecycle, exact path, safe-no-op state, and runtime readiness, and does not show contents. When serialized bytes are unchanged and there is no active-file plan, configure exits before final confirmation or save.
- Human and JSON modes both require a configured valid workspace. Missing configuration, standalone context, and invalid configuration fail before prompt or inspection; configure does not initialize or repair configuration. Human editing requires stdin and stdout TTY; \`aw configure --json\` never prompts and never mutates. Visible plaintext command entry and the exact final preview are the only views that include inline command bodies. Selection screens, setting lists, ordinary views, diagnostics, cancellation, JSON, and the generated active-file plan remain body-free without inline command bodies.
- Directly edit \`.arashi/config.json\` for unsupported fields because configure is not a schema editor and has no broad non-interactive mutation flags. See [Configuration reference Markdown](${site}/reference/configuration.md).
- Delete removes configured repository dependencies, while remove deletes branch worktrees. \`aw delete <repository>\` targets one exact configured repository key. With \`aw delete\` omitted, a human TTY opens a checkbox to select one or more keys. Non-TTY and JSON use with the target omitted fails selection-required and requires an explicit key; force and dry-run never invent a target.
- Arashi prepares all selected repository plans before mutation and presents the complete selected plans in one combined preview followed by one default-no confirmation. Run \`--dry-run\` before \`--force\`; \`--force\` skips confirmation and bypasses confirmation and Git data-loss guards only. Path containment, symlink, topology, identity, hook ambiguity, and concurrent-config checks remain mandatory.
- Delete removes the canonical clone, owned linked worktrees, local refs, exact config entry, and repository-targeted hook files/templates. It preserves unrelated configuration, managed-ignore policy, shared hooks, user-global hooks, remote repositories, and remote branches. Hook logical identity, path, or status may appear without file contents or inline command bodies. For a human multi-repository deletion, earlier repositories may be completed, the failing repository is failed, and later repositories are not started; inspect the phase ledger and surviving state, then retry the exact command only when reported safe. There is no atomic rollback.
- \`aw delete <repository> --dry-run --json\` returns \`data.plan\` and \`data.result: null\`; \`aw delete <repository> --force --json\` never prompts. Partial failures retain the accepted scope and phase ledger at \`error.details.plan\` and \`error.details.result\`. An explicit-key JSON partial failure reports items and phases within its one selected repository, never earlier, failing, or later batch repositories; inspect the phase ledger and surviving state, then retry the exact command only when reported safe. There is no atomic rollback. See [Delete command Markdown](${site}/commands/delete.md).
- Configure new worktree paths in the root \`worktreeNaming\` object: edit \`.arashi/config.json\` directly. This initial slice is not available in interactive \`aw configure\`. The closed values are \`style\`: \`default | branch | repo-branch\` and \`branchSlashes\`: \`preserve | flatten\`. Omitting \`style\` means \`default\`, and omitting \`branchSlashes\` means \`preserve\`; Arashi does not auto-persist either default and does not migrate existing configuration.
- \`maxPathLength\` is an optional positive integer from 1 through 2,147,483,647. It limits each full absolute newly planned configured-worktree destination in UTF-16 code units. Omitting \`maxPathLength\` preserves current path bytes; Arashi does not persist or migrate a default.
- For repository \`example\` and branch \`feature/auth\`, mappings are: bare \`default\` + \`preserve\` | \`example/feature/auth\`; bare \`default\` + \`flatten\` | \`example/feature-auth\`; bare \`branch\` + \`preserve\` | \`feature/auth\`; bare \`branch\` + \`flatten\` | \`feature-auth\`; bare \`repo-branch\` + \`preserve\` | \`example-feature/auth\`; bare \`repo-branch\` + \`flatten\` | \`example-feature-auth\`; Non-bare \`default\` + \`preserve\` | \`feature/auth\`; Non-bare \`default\` + \`flatten\` | \`feature-auth\`; Non-bare \`branch\` + \`preserve\` | \`feature/auth\`; Non-bare \`branch\` + \`flatten\` | \`feature-auth\`; Non-bare \`repo-branch\` + \`preserve\` | \`example-feature/auth\`; Non-bare \`repo-branch\` + \`flatten\` | \`example-feature-auth\`.
- Worktree naming changes only the filesystem path; the Git branch remains exactly \`feature/auth\`. Only newly planned configured paths may shorten. When needed, Arashi shortens the generated parent namespace to a readable prefix followed by \`-\` and the first eight lowercase SHA-256 hex characters of the portable ordinary namespace. A destination collision fails deterministically instead of appending a suffix.
- Arashi sizes one parent against all selected coordinated child paths; child-relative paths remain unchanged. Coordinated children remain under the planned parent path using their configured child paths. An impossible fixed topology reports \`WORKTREE_PATH_LENGTH_EXCEEDED\` before mutation. Existing worktree paths are metadata-authoritative and are never renamed by this setting. Standalone \`.worktrees/<branch>\` placement is unchanged. The budget reserves space only for each worktree root and cannot guarantee repository-internal files fit.
- Configure switching with one \`defaults.switch.mode\`: \`auto | cd | launch | sesh | herdr\`. An absent mode preserves automatic launch; configured \`auto\` prefers managed contexts before parent-shell \`cd\`.
- Prefer canonical \`aw switch --launch --ignore-configured-launcher\` for generic automatic launch. Common command-local aliases are \`-v/-f/-j/-o/-g/-n\`; \`add -n\` remains name and \`exec --jobs\` remains long-only.
- Repository selectors accept repeated and comma-separated \`--only\`/\`--group\`, flatten in order, trim, ignore blank segments beside values, and deduplicate first occurrences. Empty, unknown, or no-match filters fail closed; \`status --only\` is configured-only.
- \`update --check\` conflicts with \`--dry-run\`/\`-n\` before lookup or mutation. Markdown is the default for \`handoff\`; omit its deprecated explicit Markdown option in preferred guidance.
- Use \`aw completion bash|zsh|fish|powershell\` for native completion. Static completion works outside workspaces; dynamic repositories, groups, worktrees, branches, paths, shells, and constrained values are local and read-only with a 200 ms whole-query budget. Use \`command aw\` in POSIX activation code to bypass wrappers.
- Use \`aw switch --tmux\` or \`aw create --tmux\` for a per-invocation plain tmux override. Configured \`auto\` remains the persistent contextual choice inside tmux; \`tmux\` is not added to configuration vocabularies.
- Configure create with one \`defaults.create.launch\`: \`none | auto | sesh | herdr\`, plus an independent \`switch\` boolean. An absent create launch choice means no launch; any requested launch selects the new primary worktree. Explicit \`--tmux\`, \`--sesh\`, or \`--herdr\` wins, then \`--tab\` or \`--launch\`, \`--no-launch\`, matching-scope configuration, and built-in \`none\`.
- In configured workspaces only, \`repos.<name>.copy\` is a direct array and \`repos.<name>.symlink\` is a direct array. Entries use the same relative path from the Git-primary child checkout into each new worktree. Choose \`copy\` for an independent, isolated file and \`symlink\` only to share intentional state or dependencies. Prefer package-manager content-addressed stores and per-worktree installs for dependency isolation. Globs are not supported, path remapping is not supported, and standalone mode is not supported. Use lifecycle hooks for globs, remapping, external sources, interpolation, required entries, generated files, or conditional behavior. \`aw doctor\` non-mutatively diagnoses materialization source availability and destination safety without repair or mutation.
- Configured child construction runs \`pre-create\`, \`copy\`, \`symlink\`, then \`post-create\`; \`--no-hooks\` does not disable materialization. Missing sources are skipped, Arashi never overwrites an existing destination, and every destination must remain inside the worktree. A native \`symlink\` fails when platform policy or the filesystem rejects it, with no copy, hard-link, or junction fallback. Materialization does not fall back to the caller's checkout or another source repository. \`aw create --dry-run\` previews the ordered materialization plan in declaration order before any worktree or file mutation.
- Use the shared configured base policy for long-running ancestry: root \`baseBranch\` is the workspace fallback, \`meta.baseBranch\` owns the meta override, and \`repos.<name>.baseBranch\` owns child overrides. Configured create, clone, status, pull, no-upstream push comparison, handoff, and doctor use this policy. For create, the primary form is \`aw create <target> --base <branch>\`; for create and clone, use \`--base <branch>\` invocation-wide and repeatable \`--repo-base <repository=branch>\` per repository; \`@meta\` selects the configured meta repository rather than a child. Their precedence is repository CLI > invocation CLI > repository config > workspace config. The removed \`defaults.create.baseBranch\` property fails validation before hooks or mutation; migrate it to root or repository-specific configuration. See [Create command Markdown](${site}/commands/create.md), [Clone command Markdown](${site}/commands/clone.md), and [Configuration workflow](${site}/reference/configuration/).
- Status preserves upstream and remote-default roles while adding configured-base state and de-duplicating a shared target. Pull merges the refreshed configured remote base. Without persisted base policy, pull preserves its existing current-upstream behavior. Push uses configured base only for no-upstream publishability and never as the destination. Handoff and doctor report configured-base lag/unavailability. Standalone behavior is unchanged.
- Configured clone from the main workspace checks out an effective base, while coordinated clone keeps the coordinated target branch checked out and only seeds a missing target from the child's effective base. Existing targets retain their ancestry; omitted policy preserves remote-default clone behavior.
- Standalone create base selection is CLI-only and invocation-only: it does not load root or repository base configuration, rejects \`--repo-base\`, and creates no \`.arashi\` state.
- Dry-run reports every selected repository and adds resolved bases/actions only when a base applies. Create JSON success entries are at \`data.base.repositories\`; clone policy records are at \`data.base\` only when an effective policy applies. Create resolution failures include attempted refs; clone preflight failures include \`gitUrl\` and reason. Both use \`error.details.repositories\` with affected repositories only in selected-set order.
- \`REUSE_EXISTING\` does not repair or validate ancestry.
- Launch defaults to a default new window or independent managed session. \`--tab\` is CLI-only for one \`switch\` or \`create\` invocation and bypasses configured switch and create launch defaults, while explicit launcher selectors remain authoritative. Tab disposition never falls back to a window when unsupported and does not change configuration vocabularies.
- For persistent Herdr launch, use \`aw switch --herdr\` or \`aw create --herdr\`; Arashi owns Git worktree creation/removal, and Herdr only opens, focuses, and reuses the existing checkout.
- In Kitty 0.43+, automatic launch uses remote control to reuse and focus the exact live worktree window. Kitty remains auto-detected and live-only; review the Kitty workflow before enabling remote control.
- On Windows, use the canonical PowerShell installer. It installs Git Bash support through the extensionless \`arashi\` wrapper; open a new Git Bash window so it inherits the persistent user PATH. See [Install Arashi](${site}/getting-started/installation/) for the verified manual payload and no-profile-edit guidance.
- Validate every affected repository before handing work back for review.
- Use focused PRs and cross-link related PRs when work spans multiple repositories.

## Core Docs

- [Quickstart](${site}/getting-started/) - shortest path to a configured workspace and first change.
- [Install Arashi](${site}/getting-started/installation/) - supported installation methods and troubleshooting.
- [Change lifecycle](${site}/workflows/change-lifecycle/) - start, resume, publish, hand off, and clean up work.
- [Coding agents](${site}/workflows/agents-and-specs/) - repository ownership, validation, and handoffs for agent-assisted work.
- [Scripts and CI](${site}/workflows/automation/) - JSON envelopes, explicit selection, and non-interactive execution.
- [Configuration reference](${site}/reference/configuration/) - workspace layout, repositories, worktree behavior, and command defaults.
- [SSH remote troubleshooting](${site}/commands/clone/#troubleshooting-ssh-remotes) - exact remote preservation and Git/OpenSSH ownership.
- [Lifecycle-hook reference](${site}/reference/hooks/) - lifecycle timing, scope, environment, platform, timeout, and failure behavior.
- [Launch reference](${site}/reference/launching/) - default independent launch, one-invocation tabs, precedence, support matrix, and no-fallback safety.
- [Environment integrations](${site}/workflows/environment-integrations/) - choose an editor, terminal, or workspace manager.
- [Use Arashi in one repository](${site}/getting-started/standalone/) - ad hoc lifecycle and safety guidance for projects that have not adopted Arashi configuration.
- [Commands](${site}/commands/) - command reference.
- [Contributing](${site}/contributing/) - contribution flow for Arashi projects.
- [Full Markdown export](${site}/llms-full.txt) - consolidated public docs context.

## Useful Markdown Routes

- [Agents workflow Markdown](${site}/workflows/agents-and-specs.md)
- [Quickstart Markdown](${site}/getting-started.md)
- [Installation Markdown](${site}/getting-started/installation.md)
- [Status command Markdown](${site}/commands/status.md)
- [Standalone workflow Markdown](${site}/getting-started/standalone.md)
- [Configuration reference Markdown](${site}/reference/configuration.md)
- [Lifecycle-hook reference Markdown](${site}/reference/hooks.md)
- [Launch reference Markdown](${site}/reference/launching.md)
- [Herdr workflow Markdown](${site}/workflows/herdr.md)
- [Kitty workflow Markdown](${site}/workflows/kitty.md)
- [tmux and sesh workflow Markdown](${site}/workflows/tmux-and-sesh.md)
- [Switch command Markdown](${site}/commands/switch.md)
- [Create command Markdown](${site}/commands/create.md)
- [Delete command Markdown](${site}/commands/delete.md)
- [Exec command Markdown](${site}/commands/exec.md)
- [Add command Markdown](${site}/commands/add.md)
- [Completion command Markdown](${site}/commands/completion.md)
- [Contributing Markdown](${site}/contributing.md)

## Optional

- [Configuration workflow](${site}/reference/configuration/)
- [Lifecycle Hooks reference](${site}/reference/hooks/)
- [Launch disposition workflow](${site}/reference/launching/)
- [Herdr workflow](${site}/workflows/herdr/)
- [Kitty workflow](${site}/workflows/kitty/)
- [VS Code workflow](${site}/workflows/vscode/)
- [tmux and sesh workflow](${site}/workflows/tmux-and-sesh/)
`;
}

function renderLlmsFullTxt(exportPages: Page[]): string {
  const chunks = [
    "# Arashi Full Documentation Export",
    "",
    `Generated from public Arashi docs pages. Canonical site: ${site}`,
    "",
    "Use this as broad agent context. For a shorter curated entrypoint, fetch `/llms.txt`.",
    ""
  ];

  for (const page of exportPages) {
    chunks.push("---", "", `# ${page.title}`, "", `Source: ${site}${page.canonicalPath}`);
    if (page.description) {
      chunks.push(`Description: ${page.description}`);
    }
    chunks.push("", page.body, "");
  }

  return `${chunks.join("\n").trim()}\n`;
}

function writePublicFile(relativePath: string, content: string): void {
  const outputPath = path.join(publicRoot, relativePath);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, "utf8");
}
