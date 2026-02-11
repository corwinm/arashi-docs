import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { CANONICAL_DOCS_URL } from "./lib/canonical-docs-url";

const canonicalUrl = process.env.CANONICAL_DOCS_URL ?? CANONICAL_DOCS_URL;
const projectReadmePath = path.resolve("../arashi/README.md");

const failures: string[] = [];

const health = await fetchUrl(canonicalUrl);
if (!health.ok && health.reason !== "status 404") {
  failures.push(`Canonical docs URL is unreachable: ${canonicalUrl} (${health.reason})`);
} else if (!health.ok && health.reason === "status 404") {
  console.warn(
    `Canonical docs URL currently returns 404: ${canonicalUrl}. This is allowed before first production publish.`
  );
}

if (existsSync(projectReadmePath)) {
  const readmeText = readFileSync(projectReadmePath, "utf8");
  if (!readmeText.includes(canonicalUrl)) {
    failures.push(
      `Main project README does not include canonical URL ${canonicalUrl}: ${relative(projectReadmePath)}`
    );
  }
  const docsLink = readmeText.match(/\[Documentation\]\(([^\)]+)\)/);
  if (!docsLink) {
    failures.push(
      `Main project README is missing a visible Documentation link: ${relative(projectReadmePath)}`
    );
  } else if (docsLink[1] !== canonicalUrl) {
    failures.push(
      `Main project README Documentation link must target ${canonicalUrl}, found ${docsLink[1]}: ${relative(projectReadmePath)}`
    );
  }
} else {
  console.log(
    `Skipped cross-repository README check; file not found at ${relative(projectReadmePath)}.`
  );
}

if (failures.length > 0) {
  console.error("README link health checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("README documentation link health checks passed.");

async function fetchUrl(url: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15000)
    });
    if (head.status >= 200 && head.status < 400) {
      return { ok: true };
    }
    const get = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15000)
    });
    if (get.status >= 200 && get.status < 400) {
      return { ok: true };
    }
    return { ok: false, reason: `status ${get.status}` };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, reason: error.message };
    }
    return { ok: false, reason: "unknown error" };
  }
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}
