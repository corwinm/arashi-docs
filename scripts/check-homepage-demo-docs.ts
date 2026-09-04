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

if (!/@property --typing-progress\s*\{[^}]*syntax:\s*"<percentage>";[^}]*inherits:\s*true;[^}]*initial-value:\s*100%;[^}]*\}/s.test(theme)) {
  failures.push("typing progress must remain a responsive percentage of the rendered command width");
}
if (!/\.terminal-line \.typing\s*\{[^}]*display:\s*inline-block;[^}]*position:\s*relative;/s.test(theme)) {
  failures.push("the typing wrapper must establish the full intrinsic command width for responsive progress");
}
if (!/\.terminal-line \.typed\s*\{[^}]*display:\s*block;[^}]*clip-path:\s*inset\(0 calc\(100% - var\(--typing-progress\)\) 0 0\);/s.test(theme)) {
  failures.push("typed content must be clipped by responsive percentage progress");
}
if (!/\.terminal-line \.cursor\s*\{[^}]*position:\s*absolute;[^}]*left:\s*var\(--typing-progress\);/s.test(theme)) {
  failures.push("the cursor must follow responsive percentage progress");
}
if (!/\.demo-sequence\.typing-ready \.terminal-line \.typing\s*\{[^}]*animation-name:\s*type-command;/s.test(theme)) {
  failures.push("the initialized typing wrapper must own command typing progress");
}
if (!/@keyframes type-command\s*\{[\s\S]*?--typing-progress:\s*0%;[\s\S]*?--typing-progress:\s*100%;[\s\S]*?\}/s.test(theme)) {
  failures.push("typing progress must reveal the full responsive command width");
}
if (/--typed-width/.test(homepage) || /--typed-width/.test(theme) || /grid-template-columns:\s*(?:0fr|1fr|0px|calc\(var\(--steps\) \* 1ch\)) auto;/.test(theme)) {
  failures.push("typing distance must not use stale pixel, character-unit, or fractional track measurements");
}
if (/--chars\s*:|calc\(var\(--chars\)\s*\*\s*1ch\)/.test(theme)) {
  failures.push("cursor distance must not depend on a separately maintained command character width");
}

if (!/\.demo-toggle:not\(:checked\) ~ \.demo-terminal \.terminal-line \.typed\s*\{[^}]*display:\s*inline;[^}]*clip-path:\s*none;/s.test(theme)) {
  failures.push("the reduced-motion command must stay inline with its prompt");
}

if (/\.cmd-\d+\s*\{[^}]*--steps\s*:/s.test(theme)) {
  failures.push("command selectors must not hardcode independently maintained typing step counts");
}
if (/\.cmd-\d+\s*\{[^}]*(?:--typing-duration|--typing-delay)\s*:/s.test(theme)) {
  failures.push("command selectors must not hardcode independently maintained typing durations or delays");
}
if (/@keyframes cmd-\d+-type/.test(theme)) {
  failures.push("per-command keyframes must not hardcode independently maintained typing durations");
}
if (!/Array\.from\(typed\.textContent\s*\?\?\s*""\)\.length/.test(homepage)) {
  failures.push("the command content must provide its Unicode-safe character count");
}
if (!/style\.setProperty\("--steps",\s*String\(characterCount\)\)/.test(homepage)) {
  failures.push("the content-derived character count must supply the typing steps");
}
if (!/const typingDuration = characterCount \/ typingCadence;/.test(homepage)
  || !/style\.setProperty\("--typing-duration",\s*String\(typingDuration\)\s*\+\s*"s"\)/.test(homepage)) {
  failures.push("one shared cadence must derive each command's typing duration from its content");
}
if (!/animation-duration:\s*var\(--typing-duration\)/.test(theme)) {
  failures.push("the typing animation must use the content-derived duration");
}
if (!/animation-timing-function:\s*steps\(var\(--steps\),\s*end\)/.test(theme)) {
  failures.push("the typing animation must use the content-derived step count");
}
if (/terminal-line cmd-\d+[^>]*(?:--steps|--typing-duration)/.test(homepage)) {
  failures.push("command markup must not duplicate character counts or typing durations");
}

const cadence = Number(homepage.match(/const typingCadence = ([\d.]+);/)?.[1]);
const completionHold = Number(homepage.match(/const completionHold = ([\d.]+);/)?.[1]);
const demoCycle = Number(theme.match(/--demo-cycle:\s*([\d.]+)s;/)?.[1]);
const outputStarts = [...theme.matchAll(/\.cmd-(\d+)\s*\{[^}]*--output-start:\s*([\d.]+);/gs)]
  .sort((left, right) => Number(left[1]) - Number(right[1]))
  .map((match) => Number(match[2]));

if (cadence !== 24) {
  failures.push("the homepage demo must use the shared 24 characters-per-second cadence");
}
if (completionHold !== 0.18) {
  failures.push("the homepage demo must use one shared 0.18-second completion hold");
}
if (outputStarts.length !== commandLines.length) {
  failures.push("every command must expose one output boundary for shared schedule derivation");
}
if (!/outputStart \* demoCycle - typingDuration - completionHold/.test(homepage)) {
  failures.push("typing delays must be derived from output timing, content duration, and one completion hold");
}

if (!/const treeReplayAnimations = new Set\(\["tree-root-window", "tree-root-window-safari"\]\);/.test(homepage)) {
  failures.push("typing replay must recognize both standard and Safari tree animation names");
}
if (!/treeReplayAnimations\.has\(event\.animationName\)/.test(homepage)) {
  failures.push("typing replay must restart from either supported tree animation variant");
}

const outputKeyframes = [
  "reveal-step-1",
  "reveal-step-2",
  "reveal-step-3",
  "reveal-step-4",
  "reveal-step-5",
  "focus-auth-window",
  "focus-logs-window",
  "tree-root-window",
];

let previousOutputTime = -Infinity;

for (const [index, match] of commandLines.entries()) {
  const command = match[1].match(/<span class="typed">([^<]+)<\/span>/)?.[1] ?? "";
  const outputStart = outputStarts[index];
  const typingDuration = Array.from(command).length / cadence;
  const outputTime = outputStart * demoCycle;
  const typingDelay = outputTime - typingDuration - completionHold;
  const completionTime = typingDelay + typingDuration;
  if (!Number.isFinite(typingDelay) || typingDelay < 0) {
    failures.push(`terminal demo command ${index + 1} must start early enough to finish before its output`);
  }
  if (Math.abs(outputTime - completionTime - completionHold) > 1e-9) {
    failures.push(`terminal demo command ${index + 1} must complete exactly one shared hold before its output`);
  }
  if (typingDelay <= previousOutputTime) {
    failures.push(`terminal demo command ${index + 1} must start after the preceding output begins`);
  }
  if (!Number.isFinite(outputTime) || outputTime <= previousOutputTime || outputTime >= demoCycle) {
    failures.push(`terminal demo command ${index + 1} output must stay ordered within the demo cycle`);
  }
  previousOutputTime = outputTime;

  const keyframeStart = theme.indexOf(`@keyframes ${outputKeyframes[index]}`);
  const nextKeyframe = theme.indexOf("@keyframes ", keyframeStart + 1);
  const keyframe = theme.slice(keyframeStart, nextKeyframe === -1 ? undefined : nextKeyframe);
  const outputPercent = (outputStart * 100).toFixed(6).replace(/\.?0+$/, "");
  if (keyframeStart === -1 || !new RegExp(`(?:^|\\s)${outputPercent}%`).test(keyframe)) {
    failures.push(`terminal demo command ${index + 1} output timing must match its shared output boundary`);
  }
}

if (failures.length > 0) {
  console.error("Homepage terminal demo contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Homepage terminal demo contract passed for ${commandLines.length} content-driven command lines.`,
);
