import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const homepage = readFileSync(path.join(root, "docs/index.mdx"), "utf8");
const theme = readFileSync(path.join(root, "src/styles/theme.css"), "utf8");
const failures: string[] = [];

const commandLines = [...homepage.matchAll(
  /<div class="terminal-line cmd-\d+">([\s\S]*?)<\/div>/g,
)];

if (commandLines.length === 0) {
  failures.push("docs/index.mdx must contain terminal demo command lines");
}

for (const [index, match] of commandLines.entries()) {
  const line = match[1];
  if (!/<span class="typing"><span class="typed">[^<]+<\/span><span class="cursor"><\/span><\/span>/.test(line)) {
    failures.push(
      `terminal demo command ${index + 1} must colocate its cursor with the intrinsic-width typed content`,
    );
  }
}

if (!/\.terminal-line \.typing\s*\{[^}]*display:\s*inline-grid;[^}]*grid-template-columns:\s*0fr auto;/s.test(theme)) {
  failures.push("the typing wrapper must size its reveal track from intrinsic command content");
}
if (!/\.terminal-line \.typed\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;/s.test(theme)) {
  failures.push("typed content must be clipped by the shared reveal track");
}
if (!/\.cmd-1 \.typing\s*\{[^}]*animation-name:\s*cmd-1-type;/s.test(theme)) {
  failures.push("the colocated typing wrapper must own command typing progress");
}
if (!/@keyframes cmd-1-type\s*\{[\s\S]*?grid-template-columns:\s*0fr auto;[\s\S]*?grid-template-columns:\s*1fr auto;[\s\S]*?\}/s.test(theme)) {
  failures.push("typing progress must move the cursor with the intrinsic typed-content track");
}
if (/--chars\s*:|calc\(var\(--chars\)\s*\*\s*1ch\)/.test(theme)) {
  failures.push("cursor distance must not depend on a separately maintained command character width");
}

if (failures.length > 0) {
  console.error("Homepage terminal demo contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Homepage terminal demo contract passed for ${commandLines.length} content-driven command lines.`,
);
