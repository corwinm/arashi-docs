import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface CheckFailure {
  ok: false;
  reason: string;
}

interface CheckSuccess {
  ok: true;
}

type CheckResult = CheckSuccess | CheckFailure;

if (isMainModule()) {
  await main();
}

async function main(): Promise<void> {
  const docsRoot = path.resolve("docs");
  const markdownFiles = walk(docsRoot).filter((filePath) =>
    /\.mdx?$/.test(filePath),
  );
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
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `External link validation passed for ${uniqueLinks.length} links.`,
  );
}

export async function checkUrl(url: string): Promise<CheckResult> {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (isSuccessful(head.status)) return { ok: true };
    return await checkWithGet(url);
  } catch {
    return await checkWithGet(url);
  }
}

async function checkWithGet(url: string): Promise<CheckResult> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (isSuccessful(response.status)) return { ok: true };
    return { ok: false, reason: `status ${response.status}` };
  } catch (error) {
    return { ok: false, reason: formatError(error) };
  }
}

function isSuccessful(status: number): boolean {
  return status >= 200 && status < 400;
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
  return trimmed.startsWith("<") && trimmed.endsWith(">")
    ? trimmed.slice(1, -1)
    : trimmed.split(/\s+['"]/)[0];
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
  return value instanceof Error ? value.message : "unknown error";
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return (
    Boolean(entry) &&
    existsSync(entry) &&
    path.resolve(entry) === fileURLToPath(import.meta.url)
  );
}
