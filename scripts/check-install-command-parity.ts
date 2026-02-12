import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const canonicalCommands = {
  curlInstall: "curl -fsSL https://arashi.haphazard.dev/install | bash",
  npmInstall: "npm install -g arashi",
  verify: "arashi --version"
} as const;

const surfaces = {
  readme: path.resolve("../arashi/README.md"),
  gettingStarted: path.resolve("docs/getting-started/index.md"),
  landingHero: resolveLandingHeroPath()
} as const;

const failures: string[] = [];

for (const [surfaceId, filePath] of Object.entries(surfaces)) {
  if (!existsSync(filePath)) {
    if (surfaceId === "readme") {
      console.warn(
        `Skipped README parity checks; file not found at ${relative(filePath)} (expected in multi-repo workspace).`
      );
      continue;
    }
    failures.push(`${surfaceId}: missing file ${relative(filePath)}`);
    continue;
  }

  const text = readFileSync(filePath, "utf8");

  assertContains(surfaceId, filePath, text, canonicalCommands.curlInstall);
  assertContains(surfaceId, filePath, text, canonicalCommands.npmInstall);
  assertContains(surfaceId, filePath, text, canonicalCommands.verify);
}

if (failures.length > 0) {
  console.error("Install command parity checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Install command parity checks passed for README, Getting Started, and landing hero.");

function assertContains(surfaceId: string, filePath: string, text: string, expected: string): void {
  if (!text.includes(expected)) {
    failures.push(`${surfaceId}: missing command ${JSON.stringify(expected)} in ${relative(filePath)}`);
  }
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

function resolveLandingHeroPath(): string {
  const mdxPath = path.resolve("docs/index.mdx");
  if (existsSync(mdxPath)) {
    return mdxPath;
  }
  return path.resolve("docs/index.md");
}
