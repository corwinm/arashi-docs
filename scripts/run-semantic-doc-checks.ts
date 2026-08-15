import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "scripts/semantic-doc-checks.json");
const checkers = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;

if (!Array.isArray(checkers) || !checkers.every((checker) => typeof checker === "string")) {
  console.error("Semantic docs checker manifest must be an array of checker filenames.");
  process.exit(1);
}

const sortedUnique = [...new Set(checkers)].sort();
if (JSON.stringify(checkers) !== JSON.stringify(sortedUnique)) {
  console.error("Semantic docs checker manifest must be sorted and contain no duplicates.");
  process.exit(1);
}

for (const checker of checkers) {
  if (!/^check-.+-docs\.ts$/.test(checker)) {
    console.error(`Invalid semantic docs checker registration: ${checker}`);
    process.exit(1);
  }

  const checkerPath = path.join(root, "scripts", checker);
  if (!existsSync(checkerPath)) {
    console.error(`Registered semantic docs checker is missing: scripts/${checker}`);
    process.exit(1);
  }

  console.log(`\n=== Semantic docs: ${checker} ===`);
  const result = spawnSync(process.execPath, [checkerPath], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`Semantic docs checker could not start: ${checker}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Semantic docs checker failed: ${checker} (exit ${result.status ?? "unknown"})`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\nAll ${checkers.length} registered semantic docs checkers passed.`);
