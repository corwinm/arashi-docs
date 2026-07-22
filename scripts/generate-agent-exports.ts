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
  "workflows/index.md",
  "workflows/agents-and-specs.md",
  "workflows/json-automation.md",
  "workflows/config.md",
  "workflows/hooks.md",
  "workflows/herdr.md",
  "workflows/vscode.md",
  "workflows/tmux-and-sesh.md",
  "workflows/standalone.md",
  "commands/index.md",
  "commands/status.md",
  "commands/create.md",
  "commands/move.md",
  "commands/exec.md",
  "commands/pull.md",
  "commands/push.md",
  "commands/sync.md",
  "commands/remove.md",
  "commands/prune.md",
  "commands/shell.md",
  "commands/list.md",
  "commands/switch.md",
  "commands/setup.md",
  "commands/init.md",
  "commands/clone.md",
  "commands/add.md",
  "commands/update.md",
  "contributing/index.md"
];

const generatedDirs = ["getting-started", "workflows", "commands", "contributing"];
const requiredRoutes = [
  "llms.txt",
  "llms-full.txt",
  "getting-started.md",
  "workflows.md",
  "workflows/standalone.md",
  "workflows/agents-and-specs.md",
  "workflows/json-automation.md",
  "workflows/herdr.md",
  "commands.md",
  "commands/exec.md",
  "commands/status.md",
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

- Start by inspecting workspace state with \`arashi status\`.
- In a single repository, use \`arashi init --zero-config\` and the root \`.worktrees/<branch>\` convention; use ordinary \`arashi init\` for configured coordination.
- Use the meta-repo for shared context, OpenSpec proposals, planning, and cross-repo coordination.
- Put implementation, tests, and repo-specific docs in the owning child repository under \`repos/<project>/\`.
- Prefer machine-readable command output such as \`arashi status --json\` when automating decisions.
- Use \`arashi exec --json -- <command>\` for repeated multi-repo inspection or validation commands, with explicit \`--only\` filters for mutating or expensive commands.
- Expect configured lifecycle commands to reconcile safe managed paths with repository-local rules by default; inspect \`managedIgnore\` in JSON results.
- Preserve explicit clone-local \`tracked\` or \`none\` preferences and never modify global Git configuration or a global excludes file to silence a warning.
- Configure switching with one \`defaults.switch.mode\`: \`auto | cd | launch | sesh | herdr\`. An absent mode preserves automatic launch; configured \`auto\` prefers managed contexts before parent-shell \`cd\`.
- For persistent Herdr launch, use \`arashi switch --herdr\` or \`arashi create --herdr\`; Arashi owns Git worktree creation/removal, and Herdr only opens, focuses, and reuses the existing checkout.
- Validate every affected repository before handing work back for review.
- Use focused PRs and cross-link related PRs when work spans multiple repositories.

## Core Docs

- [Getting started](${site}/getting-started/) - install and configured meta-repository workflow.
- [Agents workflow](${site}/workflows/agents-and-specs/) - bootstrap guidance for coding agents in Arashi meta-repos.
- [Configuration workflow](${site}/workflows/config/) - managed path ignore scope and command defaults.
- [Herdr workflow](${site}/workflows/herdr/) - explicit, configured, and automatic workspace launch, reuse, ownership, and troubleshooting.
- [JSON automation](${site}/workflows/json-automation/) - machine-readable output contract, examples, and command support matrix.
- [Standalone workflow](${site}/workflows/standalone/) - ad hoc lifecycle and safety guidance for projects that have not adopted Arashi configuration.
- [Commands](${site}/commands/) - command reference.
- [Contributing](${site}/contributing/) - contribution flow for Arashi projects.
- [Full Markdown export](${site}/llms-full.txt) - consolidated public docs context.

## Useful Markdown Routes

- [Agents workflow Markdown](${site}/workflows/agents-and-specs.md)
- [JSON automation Markdown](${site}/workflows/json-automation.md)
- [Getting started Markdown](${site}/getting-started.md)
- [Status command Markdown](${site}/commands/status.md)
- [Standalone workflow Markdown](${site}/workflows/standalone.md)
- [Configuration workflow Markdown](${site}/workflows/config.md)
- [Herdr workflow Markdown](${site}/workflows/herdr.md)
- [Switch command Markdown](${site}/commands/switch.md)
- [Create command Markdown](${site}/commands/create.md)
- [Exec command Markdown](${site}/commands/exec.md)
- [Contributing Markdown](${site}/contributing.md)

## Optional

- [Configuration workflow](${site}/workflows/config/)
- [Hooks workflow](${site}/workflows/hooks/)
- [Herdr workflow](${site}/workflows/herdr/)
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
