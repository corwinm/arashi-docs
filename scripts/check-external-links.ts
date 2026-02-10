import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const docsRoot = path.resolve("docs");
const markdownFiles = walk(docsRoot).filter((filePath) => filePath.endsWith(".md"));
const linkMap = new Map<string, Set<string>>();

for (const filePath of markdownFiles) {
  const content = readFileSync(filePath, "utf8");
  for (const target of extractExternalTargets(content)) {
    const files = linkMap.get(target) ?? new Set<string>();
    files.add(path.relative(process.cwd(), filePath));
    linkMap.set(target, files);
  }
}

const uniqueLinks = [...linkMap.keys()];
const failures: string[] = [];

for (const url of uniqueLinks) {
  const result = await checkUrl(url);
  if (!result.ok) {
    const sources = [...(linkMap.get(url) ?? new Set<string>())].join(", ");
    failures.push(`${url} (${result.reason}) [${sources}]`);
  }
}

if (failures.length > 0) {
  console.error("External link validation found failures:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`External link validation passed for ${uniqueLinks.length} links.`);

async function checkUrl(url: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15000)
    });

    if (head.status >= 200 && head.status < 400) {
      return { ok: true };
    }

    if (head.status === 405 || head.status === 501) {
      return await checkWithGet(url);
    }

    return { ok: false, reason: `status ${head.status}` };
  } catch (error) {
    return { ok: false, reason: formatError(error) };
  }
}

async function checkWithGet(
  url: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15000)
    });
    if (response.status >= 200 && response.status < 400) {
      return { ok: true };
    }
    return { ok: false, reason: `status ${response.status}` };
  } catch (error) {
    return { ok: false, reason: formatError(error) };
  }
}

function extractExternalTargets(content: string): string[] {
  const regex = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const urls: string[] = [];
  let match: RegExpExecArray | null = regex.exec(content);

  while (match !== null) {
    const fullMatch = match[0];
    const rawTarget = normalizeTarget(match[1]);
    if (!fullMatch.startsWith("!") && /^https?:\/\//i.test(rawTarget)) {
      urls.push(rawTarget);
    }
    match = regex.exec(content);
  }

  return urls;
}

function normalizeTarget(raw: string): string {
  const trimmed = raw.trim();
  const noTitle = trimmed.startsWith("<") && trimmed.endsWith(">")
    ? trimmed.slice(1, -1)
    : trimmed.split(/\s+['"]/)[0];
  return noTitle;
}

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function formatError(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  return "unknown error";
}
