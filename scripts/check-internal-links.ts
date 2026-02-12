import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const docsRoot = path.resolve("docs");

if (!existsSync(docsRoot)) {
  console.error(`Missing docs directory: ${docsRoot}`);
  process.exit(1);
}

const markdownFiles = walk(docsRoot).filter((file) => /\.mdx?$/.test(file));
const anchorCache = new Map<string, Set<string>>();
const errors: string[] = [];

for (const filePath of markdownFiles) {
  const content = readFileSync(filePath, "utf8");
  const links = extractLinks(content);

  for (const link of links) {
    if (isExternal(link.target) || link.target.startsWith("#")) {
      if (link.target.startsWith("#")) {
        const localAnchor = normalizeAnchor(link.target.slice(1));
        if (!anchorsFor(filePath).has(localAnchor)) {
          errors.push(`${rel(filePath)}:${link.line} missing anchor #${localAnchor}`);
        }
      }
      continue;
    }

    const [rawPath, rawFragment = ""] = splitTarget(link.target);
    const resolved = resolveDocPath(filePath, rawPath);

    if (!resolved) {
      errors.push(
        `${rel(filePath)}:${link.line} missing target path ${JSON.stringify(link.target)}`
      );
      continue;
    }

    if (rawFragment.length > 0) {
      const wantedAnchor = normalizeAnchor(rawFragment);
      if (!anchorsFor(resolved).has(wantedAnchor)) {
        errors.push(
          `${rel(filePath)}:${link.line} missing anchor #${wantedAnchor} in ${rel(resolved)}`
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Internal link validation failed:");
  for (const message of errors) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log(`Internal link validation passed for ${markdownFiles.length} files.`);

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

function extractLinks(content: string): Array<{ target: string; line: number }> {
  const sanitized = content.replace(/```[\s\S]*?```/g, "");
  const regex = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const links: Array<{ target: string; line: number }> = [];
  let match: RegExpExecArray | null = regex.exec(sanitized);

  while (match !== null) {
    const fullMatch = match[0];
    if (!fullMatch.startsWith("!")) {
      const raw = stripTitle(match[1].trim());
      links.push({ target: unwrap(raw), line: lineFromIndex(sanitized, match.index) });
    }
    match = regex.exec(sanitized);
  }

  return links;
}

function stripTitle(target: string): string {
  if (target.startsWith("<") && target.endsWith(">")) {
    return target;
  }
  const quoteIndex = target.search(/\s+['"]/);
  if (quoteIndex === -1) {
    return target;
  }
  return target.slice(0, quoteIndex).trim();
}

function unwrap(target: string): string {
  if (target.startsWith("<") && target.endsWith(">")) {
    return target.slice(1, -1);
  }
  return target;
}

function isExternal(target: string): boolean {
  return /^(https?:|mailto:|tel:|data:)/i.test(target);
}

function splitTarget(target: string): [string, string] {
  const [pathPart, fragmentPart = ""] = target.split("#", 2);
  return [pathPart.split("?")[0], fragmentPart];
}

function resolveDocPath(sourceFile: string, targetPath: string): string | null {
  const normalizedTarget = targetPath !== "/" ? targetPath.replace(/\/+$/, "") : targetPath;
  const base = normalizedTarget.startsWith("/")
    ? path.join(docsRoot, normalizedTarget.slice(1))
    : path.resolve(path.dirname(sourceFile), normalizedTarget);

  const candidates = new Set<string>();
  candidates.add(base);

  if (!path.extname(base)) {
    candidates.add(`${base}.md`);
    candidates.add(path.join(base, "index.md"));
  }

  if (base.endsWith(path.sep)) {
    candidates.add(path.join(base, "index.md"));
  }

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (!normalized.startsWith(docsRoot)) {
      continue;
    }
    if (existsSync(normalized) && statSync(normalized).isFile()) {
      return normalized;
    }
  }

  return null;
}

function anchorsFor(filePath: string): Set<string> {
  const cached = anchorCache.get(filePath);
  if (cached) {
    return cached;
  }

  const content = readFileSync(filePath, "utf8");
  const anchors = new Set<string>();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (!headingMatch) {
      continue;
    }

    const headingText = headingMatch[1].trim();
    const explicitId = headingText.match(/\{#([^}]+)\}\s*$/);
    if (explicitId) {
      anchors.add(normalizeAnchor(explicitId[1]));
    }
    anchors.add(slugify(headingText.replace(/\{#([^}]+)\}\s*$/, "")));
  }

  anchorCache.set(filePath, anchors);
  return anchors;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeAnchor(value: string): string {
  const decoded = decodeSafe(value).trim();
  return slugify(decoded);
}

function decodeSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function lineFromIndex(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function rel(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}
