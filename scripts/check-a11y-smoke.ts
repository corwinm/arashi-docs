import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const criticalPages = [
  "dist/index.html",
  "dist/getting-started/index.html",
  "dist/commands/index.html",
  "dist/contributing/index.html"
].map((relativePath) => path.resolve(relativePath));

const issues: string[] = [];

for (const pagePath of criticalPages) {
  if (!existsSync(pagePath)) {
    issues.push(`Missing built page: ${rel(pagePath)}`);
    continue;
  }

  const html = readFileSync(pagePath, "utf8");
  if (!/<html[^>]*\slang=/.test(html)) {
    issues.push(`${rel(pagePath)} missing html lang attribute`);
  }
  if (!/<main[\s>]/.test(html)) {
    issues.push(`${rel(pagePath)} missing main landmark`);
  }
  if (!/<h1[\s>]/.test(html)) {
    issues.push(`${rel(pagePath)} missing top-level h1`);
  }
  if (!/<title>.+<\/title>/.test(html)) {
    issues.push(`${rel(pagePath)} missing document title`);
  }
}

if (issues.length > 0) {
  console.error("Accessibility smoke checks failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Accessibility smoke checks passed for ${criticalPages.length} pages.`);

function rel(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}
