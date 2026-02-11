import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { CANONICAL_DOCS_URL, DEPRECATED_DOCS_HOST_DENYLIST } from "./lib/canonical-docs-url";

const canonicalHost = new URL(CANONICAL_DOCS_URL).host;
const allowedDocsHosts = new Set([canonicalHost]);

const checks: Array<{
  path: string;
  id: string;
  required: boolean;
}> = [
  { path: path.resolve("../arashi/README.md"), id: "arashi-readme", required: false },
  { path: path.resolve("README.md"), id: "docs-readme", required: true },
  { path: path.resolve("astro.config.mjs"), id: "astro-config", required: true },
  { path: path.resolve("scripts/check-readme-link.ts"), id: "readme-link-script", required: true },
  {
    path: path.resolve("docs/contributing/validation-troubleshooting.md"),
    id: "validation-troubleshooting",
    required: true
  }
];

const failures: string[] = [];
const warnings: string[] = [];

for (const check of checks) {
  if (!existsSync(check.path)) {
    const message = `Missing in-scope file: ${relative(check.path)}`;
    if (check.required) {
      failures.push(message);
    } else {
      warnings.push(message);
    }
    continue;
  }

  const text = readFileSync(check.path, "utf8");
  assertNoDeprecatedHosts(text, check.path);
  assertCanonicalPolicy(check.id, text, check.path);
}

if (warnings.length > 0) {
  console.warn("Canonical docs domain check warnings:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (failures.length > 0) {
  console.error("Canonical docs domain policy checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Canonical docs domain policy checks passed.");

function assertNoDeprecatedHosts(text: string, filePath: string): void {
  for (const url of extractUrls(text)) {
    let host: string;
    try {
      host = new URL(url).host;
    } catch {
      continue;
    }

    if (DEPRECATED_DOCS_HOST_DENYLIST.includes(host)) {
      failures.push(
        `Deprecated docs domain host detected (${host}) in ${relative(filePath)}. Replace with ${CANONICAL_DOCS_URL}.`
      );
    }
  }
}

function assertCanonicalPolicy(id: string, text: string, filePath: string): void {
  if (id === "arashi-readme") {
    const docsLink = text.match(/\[Documentation\]\(([^\)]+)\)/);
    if (!docsLink) {
      failures.push(`Missing Documentation link in ${relative(filePath)}.`);
      return;
    }
    assertAllowedHost(docsLink[1], filePath, "README Documentation link");
    if (docsLink[1] !== CANONICAL_DOCS_URL) {
      failures.push(
        `README Documentation link must be ${CANONICAL_DOCS_URL} in ${relative(filePath)}, found ${docsLink[1]}.`
      );
    }
    return;
  }

  if (id === "docs-readme") {
    if (!text.includes(CANONICAL_DOCS_URL)) {
      failures.push(`Canonical docs URL is missing from ${relative(filePath)}.`);
    }
    return;
  }

  if (id === "astro-config") {
    const siteMatch = text.match(/site:\s*["']([^"']+)["']/);
    if (!siteMatch) {
      failures.push(`Missing Astro site URL in ${relative(filePath)}.`);
      return;
    }
    assertAllowedHost(siteMatch[1], filePath, "Astro site URL");
    if (siteMatch[1] !== CANONICAL_DOCS_URL) {
      failures.push(
        `Astro site URL must be ${CANONICAL_DOCS_URL} in ${relative(filePath)}, found ${siteMatch[1]}.`
      );
    }
    return;
  }

  if (id === "readme-link-script") {
    if (!text.includes("CANONICAL_DOCS_URL")) {
      failures.push(`Expected CANONICAL_DOCS_URL usage in ${relative(filePath)}.`);
    }
    return;
  }

  if (id === "validation-troubleshooting") {
    const inlineUrl = text.match(/`(https?:\/\/[^`]+)`/);
    if (!inlineUrl) {
      failures.push(`Expected canonical docs URL guidance in ${relative(filePath)}.`);
      return;
    }
    assertAllowedHost(inlineUrl[1], filePath, "Validation troubleshooting canonical URL");
    if (inlineUrl[1] !== CANONICAL_DOCS_URL) {
      failures.push(
        `Validation troubleshooting canonical URL must be ${CANONICAL_DOCS_URL} in ${relative(filePath)}, found ${inlineUrl[1]}.`
      );
    }
  }
}

function assertAllowedHost(url: string, filePath: string, label: string): void {
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    failures.push(`Invalid URL for ${label} in ${relative(filePath)}: ${url}`);
    return;
  }

  if (!allowedDocsHosts.has(host)) {
    failures.push(
      `${label} in ${relative(filePath)} must use allowed host ${canonicalHost}, found ${host}.`
    );
  }
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s`\)\]"'>]+/g);
  return matches ?? [];
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}
