import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures: string[] = [];
const manifestPath = path.join(root, "scripts/semantic-doc-checks.json");
const checkerPattern = /^check-.+-docs\.ts$/;
const discoveredCheckers = readdirSync(path.join(root, "scripts"))
  .filter((entry) => checkerPattern.test(entry))
  .sort();

let registeredCheckers: string[] = [];
if (!existsSync(manifestPath)) {
  failures.push("scripts/semantic-doc-checks.json is missing");
} else {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!Array.isArray(manifest) || !manifest.every((entry) => typeof entry === "string")) {
      failures.push("scripts/semantic-doc-checks.json must be an array of checker filenames");
    } else {
      registeredCheckers = manifest;
    }
  } catch (error) {
    failures.push(`scripts/semantic-doc-checks.json is invalid JSON: ${String(error)}`);
  }
}

const sortedUnique = [...new Set(registeredCheckers)].sort();
if (JSON.stringify(registeredCheckers) !== JSON.stringify(sortedUnique)) {
  failures.push("semantic checker registration must be sorted and contain no duplicates");
}

const omitted = discoveredCheckers.filter((checker) => !registeredCheckers.includes(checker));
const stale = registeredCheckers.filter((checker) => !discoveredCheckers.includes(checker));
if (omitted.length > 0) {
  failures.push(`unregistered semantic checker(s): ${omitted.join(", ")}`);
}
if (stale.length > 0) {
  failures.push(`registered semantic checker(s) missing from scripts/: ${stale.join(", ")}`);
}

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};
const scripts = packageJson.scripts ?? {};
const expectedAggregate =
  "pnpm validate:semantic-docs:registration && pnpm sync:content && node scripts/run-semantic-doc-checks.ts";
if (
  scripts["validate:semantic-docs:registration"] !==
  "node scripts/check-semantic-docs-registration.ts"
) {
  failures.push(
    "package.json validate:semantic-docs:registration must run the registration checker",
  );
}
if (scripts["validate:semantic-docs"] !== expectedAggregate) {
  failures.push(`package.json validate:semantic-docs must be ${JSON.stringify(expectedAggregate)}`);
}

for (const checker of discoveredCheckers) {
  const name = checker.slice("check-".length, -".ts".length);
  const expected = `pnpm sync:content && node scripts/${checker}`;
  if (scripts[`validate:${name}`] !== expected) {
    failures.push(`package.json must preserve focused command validate:${name}`);
  }
}

const validate = scripts.validate ?? "";
const expectedValidate =
  "pnpm lint && pnpm validate:semantic-docs && pnpm validate:build:prepared && pnpm validate:links:internal && pnpm validate:a11y:prepared && pnpm validate:docs-domain && pnpm validate:readme-link";
if (validate !== expectedValidate) {
  failures.push(`package.json validate must be ${JSON.stringify(expectedValidate)}`);
}
for (const checker of discoveredCheckers) {
  const name = checker.slice("check-".length, -".ts".length);
  if (validate.includes(`validate:${name}`)) {
    failures.push(`package.json validate must not run focused semantic command validate:${name}`);
  }
}
if (scripts["validate:build"] !== "pnpm sync:content && astro check && astro build") {
  failures.push("package.json validate:build must remain safe from a clean checkout");
}
if (scripts["validate:build:prepared"] !== "astro check && astro build") {
  failures.push("package.json validate:build:prepared must build pre-generated content once");
}
if (scripts["validate:a11y"] !== "pnpm validate:build && node scripts/check-a11y-smoke.ts") {
  failures.push("package.json validate:a11y must remain safe from a clean checkout");
}
if (scripts["validate:a11y:prepared"] !== "node scripts/check-a11y-smoke.ts") {
  failures.push("package.json validate:a11y:prepared must check the existing aggregate build");
}

const workflow = readFileSync(path.join(root, ".github/workflows/docs-validate.yml"), "utf8");
const validationRuns = [...workflow.matchAll(/^\s*run:\s+pnpm\s+(validate(?::\S+)?)/gm)].map(
  (match) => match[1],
);
if (
  JSON.stringify(validationRuns) !==
  JSON.stringify(["validate:semantic-docs:registration", "validate"])
) {
  failures.push(
    "docs-validate workflow must invoke the registration guard before the stable pnpm validate entrypoint",
  );
}
if (!/pull_request:\n    branches: \[main\]\n  push:/.test(workflow)) {
  failures.push("docs-validate workflow must run for every pull request into main");
}
for (const requiredPath of ["scripts/**", "contracts/**", "docs/**", "package.json"]) {
  const count = workflow.split(`- \"${requiredPath}\"`).length - 1;
  if (count !== 1) {
    failures.push(`docs-validate workflow must include ${requiredPath} in push path filters`);
  }
}

if (failures.length > 0) {
  console.error("Semantic validation registration checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Semantic validation registration checks passed for ${registeredCheckers.length} explicitly registered checkers.`,
);
