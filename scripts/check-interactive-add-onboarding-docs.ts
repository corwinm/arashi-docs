import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

type Requirement = [label: string, pattern: RegExp];

const eligibilityContract: Requirement[] = [
  ["human stdin/stdout TTY eligibility", /stdin[^.\n]{0,80}stdout[^.\n]{0,80}TTY/i],
  ["JSON, force, and non-TTY suppression", /(?:--json[^.\n]{0,100}--force[^.\n]{0,100}non-TTY|non-TTY[^.\n]{0,100}--json[^.\n]{0,100}--force)[^.\n]{0,120}(?:minimal|skip|suppress|without)/i],
  ["default-no top-level choice", /(?:first|top-level|setup|onboarding)[^.\n]{0,100}default(?:s)? to no/i],
  ["decline preserves minimal add", /declin[^.\n]{0,100}(?:minimal|path[^.\n]{0,50}gitUrl)/i],
];

const fieldContract: Requirement[] = [
  ["repository-owned scope", /repository[- ]owned/i],
  ["copy, symlink, and four lifecycle hooks only", /copy[^.\n]{0,100}symlink[^.\n]{0,140}(?:four|pre-create)[^.\n]{0,160}(?:post-remove|lifecycle)/i],
  ["unselected suggestions", /suggest(?:ions?|ed paths?)[^.\n]{0,100}(?:remain )?unselected/i],
  ["bounded root-only suggestions", /(?:bounded[^.\n]{0,100}root|root-only[^.\n]{0,100}bounded)[^.\n]{0,100}suggest/i],
  ["content-free discovery", /(?:never|does not|without)[^.\n]{0,80}(?:read|open|display|print)[^.\n]{0,80}(?:contents?|bodies)/i],
  ["manual canonical validation", /manual[^.\n]{0,100}(?:canonical )?(?:path )?validation/i],
  ["dependency warning", /dependenc[^.\n]{0,100}warn/i],
  ["no setup-script hook inference", /setup-script[^.\n]{0,120}(?:never|does not)[^.\n]{0,80}(?:infer|prefill)/i],
];

const hookContract: Requirement[] = [
  ["exclusive inline or editable active script", /(?:exclusive|exactly one|either)[^.\n]{0,80}inline[^.\n]{0,80}(?:editable )?(?:active |native )?(?:script|file)/i],
  ["user-supplied inline commands", /(?:inline[^.\n]{0,100}user[- ]supplied|user[- ]supplied[^.\n]{0,100}inline)/i],
  ["create active path", /\.arashi\/hooks\/<lifecycle>\.<repo><ext>/i],
  ["remove active path", /\.arashi\/hooks\/<lifecycle><ext>/i],
  ["create configuration-root ownership", /create[^.\n]{0,140}active configuration root/i],
  ["remove runtime-resolved target ownership", /remove[^.\n]{0,160}runtime-resolved[^.\n]{0,100}(?:target|repository)/i],
  ["linked remove uses active child", /linked[^.\n]{0,140}remove[^.\n]{0,140}active child/i],
  ["POSIX executable mode", /POSIX[^.\n]{0,100}\.sh[^.\n]{0,100}0755/i],
  ["Windows runtime-ready PowerShell file", /Windows[^.\n]{0,120}(?:one|single)[^.\n]{0,80}\.ps1[^.\n]{0,100}runtime-ready/i],
  ["safe silent no-op", /safe[^.\n]{0,80}silent[^.\n]{0,80}no-op/i],
  ["no manual activation", /(?:no|without)[^.\n]{0,80}(?:rename|chmod)[^.\n]{0,80}activation/i],
  ["never overwrite", /never[^.\n]{0,80}overwrite/i],
  ["sanitized summary secrecy", /sanitized[^.\n]{0,100}(?:never|without)[^.\n]{0,80}(?:bodies|contents|command text)/i],
];

const transactionContract: Requirement[] = [
  ["one final sanitized confirmation", /one final sanitized confirmation/i],
  ["no prompt-time writes", /no prompt-time writes/i],
  ["single config save plus scripts", /one config save[^.\n]{0,120}transaction-owned scripts/i],
  ["cancellation and rollback safety", /cancell[^.\n]{0,120}rollback/i],
  ["existing-entry follow-up issue", /existing[^.\n]{0,120}(?:#316|issue #316)/i],
  ["pure Node/Bun private complete-file preparation", /pure Node\/Bun[^.\n]{0,120}private[^.\n]{0,80}complete[- ]file[^.\n]{0,80}prepar/i],
  ["atomic no-replace publication", /atomic[^.\n]{0,80}no-replace[^.\n]{0,80}publi/i],
  ["symlink rejection and pre/post path validation", /reject[^.\n]{0,80}symlink[^.\n]{0,120}(?:pre[^.\n]{0,40}post|before[^.\n]{0,40}after)[^.\n]{0,100}(?:path|ancestor)[^.\n]{0,80}(?:validat|identit)/i],
  ["narrow residual local ancestor-substitution race", /narrow residual race[^.\n]{0,160}(?:local process|another local process)[^.\n]{0,120}workspace write access[^.\n]{0,160}substitut[^.\n]{0,100}ancestor[^.\n]{0,160}(?:validation and publication|validation[^.\n]{0,60}publication)/i],
];

const addContract = [...eligibilityContract, ...fieldContract, ...hookContract, ...transactionContract];
const gettingStartedContract = [...eligibilityContract, ...fieldContract.slice(0, 2), transactionContract[4]];
const configContract = [...fieldContract.slice(0, 2), transactionContract[4]];
const surfaces = new Map<string, Requirement[]>([
  ["docs/commands/add.md", addContract],
  ["docs/getting-started/index.md", gettingStartedContract],
  ["docs/workflows/config.md", configContract],
  ["docs/workflows/hooks.md", hookContract],
  ["public/commands/add.md", addContract],
  ["public/getting-started.md", gettingStartedContract],
  ["public/workflows/config.md", configContract],
  ["public/workflows/hooks.md", hookContract],
  ["public/llms.txt", addContract],
  ["public/llms-full.txt", addContract],
  ["scripts/generate-agent-exports.ts", addContract],
]);

const checkerName = "check-interactive-add-onboarding-docs.ts";
const root = path.resolve(process.cwd());
const forbiddenCanaries = [
  Buffer.from("SE9PS19CT0RZX0NBTkFSWV9PTkU=", "base64").toString("utf8"),
  Buffer.from("R0VORVJBVEVEX1NDUklQVF9DQU5BUllfVFdP", "base64").toString("utf8"),
];

runGuidanceSelfTest();
runReachabilitySelfTest();
if (process.argv.includes("--self-test-only")) {
  console.log("Interactive add-onboarding documentation checker self-tests passed.");
  process.exit(0);
}

const errors = checkRoot(root);
if (errors.length > 0) {
  console.error("Interactive add-onboarding documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Interactive add-onboarding documentation contract passed for ${surfaces.size} canonical/generated surfaces.`);

function normalize(content: string): string {
  return content.replaceAll("\\`", "").replaceAll("`", "").replaceAll("\\/", "/").replace(/\s+/g, " ");
}

function checkRoot(rootPath: string): string[] {
  const found: string[] = [];
  for (const [relativePath, requirements] of surfaces) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    checkGuidance(relativePath, content, requirements, found);
  }
  checkReachability(rootPath, found);
  return found;
}

function checkGuidance(relativePath: string, content: string, requirements: Requirement[], found: string[]): void {
  const normalized = normalize(content);
  for (const [label, pattern] of requirements) {
    if (!pattern.test(normalized)) found.push(`${relativePath} is missing ${label}`);
  }
  for (const canary of forbiddenCanaries) {
    if (content.includes(canary)) found.push(`${relativePath} exposes protected hook or generated content`);
  }
  const contradictions: Array<[string, RegExp]> = [
    ["must not offer onboarding in suppressed modes", /(?:--json|--force|non-TTY)[^.\n]{0,80}(?:offers? onboarding|prompts? for onboarding|runs? onboarding)/i],
    ["must not auto-select suggestions", /suggestions?[^.\n]{0,100}(?:automatically selected|selected by default|auto-selected)/i],
    ["must not inspect candidate contents", /(?:Arashi|onboarding|discovery) (?:reads?|opens?|previews?|prints?|displays?)[^.\n]{0,80}(?:candidate )?(?:contents?|bodies)/i],
    ["must not expose generic or workspace fields", /onboarding[^.\n]{0,140}(?:all schema fields|generic schema|workspace-root fields?)/i],
    ["must not configure workspace hooks", /(?:\bonboarding\s+(?:(?:may|can|will)\s+)?(?:also\s+)?configures?\s+workspace hooks\b|\bonboarding\s+(?:does not|doesn't|doesn’t)\s+configure\s+workspace hooks[^.\n]{0,100}\b(?:but|however|yet)\b[^.\n]{0,40}\b(?:may|can|will)?\s*(?:also\s+)?configure(?:s)?\s+(?:them|workspace hooks)\b)/i],
    ["must not claim existing-entry editing", /aw add[^.\n]{0,140}(?:edits?|updates?|configures?)[^.\n]{0,80}(?:existing|already registered)/i],
    ["must not allow both hook sources", /inline[^.\n]{0,80}(?:and|plus)[^.\n]{0,80}(?:active |native )?(?:script|file)[^.\n]{0,80}(?:same lifecycle|together|both run)/i],
    ["must not require manual activation", /(?:(?:users?|you) (?:must|need to) (?:rename|chmod)|(?:rename|chmod) is required)[^.\n]{0,100}(?:activate|activation|file)?/i],
    ["must not overwrite active files", /(?:Arashi (?:overwrites?|replaces?)[^.\n]{0,80}(?:existing|active)[^.\n]{0,80}(?:hook|script|file)|existing hook paths?\s+(?:are|is)\s+not overwritten[^.\n]{0,100}\b(?:but|however|yet)\b[^.\n]{0,40}\b(?:are|is)\s+overwritten)/i],
    ["must not request another final confirmation", /\b(?:add|onboarding)\s+(?:does not|doesn't|doesn’t)\s+(?:request|prompt for)\s+(?:a\s+)?second(?:\s+final)?\s+confirmation[^.\n]{0,100}\b(?:but|however|yet)\b[^.\n]{0,40}\b(?:requests?|prompts? for)\s+(?:one|a second(?:\s+final)?\s+confirmation)\b/i],
    ["must not save configuration twice", /\b(?:add|onboarding)\s+(?:does not|doesn't|doesn’t)\s+(?:save|write)\s+(?:the\s+)?configuration\s+(?:a\s+)?second time[^.\n]{0,100}\b(?:but|however|yet)\b[^.\n]{0,40}\b(?:saves?|writes?)\s+(?:it|the configuration)\s+(?:again|a second time)\b/i],
    ["must not carve out candidate content inspection", /(?:Arashi|onboarding|discovery)[^.\n]{0,60}(?:never|does not|doesn't|doesn’t|without)[^.\n]{0,80}(?:read|open|preview|print|display)[^.\n]{0,80}(?:candidate )?(?:contents?|bodies)[^.\n]{0,100}(?:except(?: when)?|unless|but|however|\()[^.\n]{0,100}(?:reads?|opens?|previews?|prints?|displays?)[^.\n]{0,80}(?:contents?|bodies|them)/i],
    ["must not carve out active-file replacement", /Arashi[^.\n]{0,60}(?:never|does not|doesn't|doesn’t)[^.\n]{0,80}(?:overwrite|replace)[^.\n]{0,100}(?:existing|active)[^.\n]{0,80}(?:hook|script|file)[^.\n]{0,100}(?:except(?: when)?|unless|but|however|\()[^.\n]{0,100}(?:overwrites?|replaces?|permits? replacement|allows? replacement)/i],
    ["must not carve out setup-script hook inference", /setup-script[^.\n]{0,100}(?:never|does not|doesn't|doesn’t)[^.\n]{0,80}(?:infer|prefill)[^.\n]{0,100}(?:except(?: when)?|unless|but|however|\()[^.\n]{0,100}(?:infers?|prefills?)/i],
    ["must not carve out sanitized-summary secrecy", /sanitized summary[^.\n]{0,100}(?:never|does not|doesn't|doesn’t|without)[^.\n]{0,80}(?:include|expose|print|display)[^.\n]{0,80}(?:bodies|contents|command text)[^.\n]{0,100}(?:except(?: when)?|unless|but|however|\()[^.\n]{0,100}(?:includes?|exposes?|prints?|displays?)[^.\n]{0,80}(?:bodies|contents|command text)/i],
    ["must not persist partial prompt state", /(?:save|write)[^.\n]{0,80}(?:after each|per section|during prompts?)/i],
    ["must not claim absolute local race freedom", /(?:(?:installer|installation|publication|Arashi)[^.\n]{0,100}(?:is (?:completely |fully )?race[- ]free|eliminates? (?:all|every) races?|prevents? (?:all|every) local races?|guarantees? no local process can substitute an ancestor)|\b(?:publication|installation)\s+(?:does not|doesn't|doesn’t)\s+guarantee\s+absolute race freedom[^.\n]{0,100}\b(?:but|however|yet)\b[^.\n]{0,40}\bguarantees?\s+(?:it|absolute race freedom)\b)/i],
    ["must not require a native installer helper", /(?:(?:installer|installation|publication|Arashi)[^.\n]{0,120}(?:requires|must (?:use|add|include)|needs)[^.\n]{0,80}(?:Rust|native (?:code|helper|addon))|\b(?:installation|installer|publication|Arashi)\s+(?:does not|doesn't|doesn’t)\s+(?:use|require)\s+(?:a\s+)?native helper[^.\n]{0,100}\b(?:but|however|yet)\b[^.\n]{0,40}\buses?\s+(?:one|a native helper)\b)/i],
  ];
  for (const [label, pattern] of contradictions) {
    if (pattern.test(normalized)) found.push(`${relativePath} ${label}`);
  }
}

function checkReachability(rootPath: string, found: string[]): void {
  const packageJson = parseJson(rootPath, "package.json", found) as { scripts?: Record<string, string> } | null;
  const focused = `pnpm sync:content && node scripts/${checkerName}`;
  if (packageJson?.scripts?.["validate:interactive-add-onboarding-docs"] !== focused) {
    found.push("package.json must define validate:interactive-add-onboarding-docs");
  }
  if (!packageJson?.scripts?.validate?.includes("pnpm validate:semantic-docs")) {
    found.push("package.json validate must retain the stable semantic docs aggregate");
  }
  const manifest = parseJson(rootPath, "scripts/semantic-doc-checks.json", found);
  if (!Array.isArray(manifest) || !manifest.includes(checkerName)) {
    found.push(`scripts/semantic-doc-checks.json must register ${checkerName}`);
  }
  const workflow = read(rootPath, ".github/workflows/docs-validate.yml", found);
  if (workflow !== null && !/^\s*run:\s*pnpm validate\s*$/m.test(workflow)) {
    found.push("docs workflow must execute the stable pnpm validate aggregate");
  }
  if (workflow !== null && workflow.includes(checkerName)) {
    found.push("docs workflow must not name the focused onboarding checker");
  }
}

function runGuidanceSelfTest(): void {
  const valid = [
    "Onboarding requires human stdin and stdout TTY eligibility.",
    "--json, --force, and non-TTY runs preserve minimal add without onboarding.",
    "The top-level setup prompt defaults to no; declining preserves the minimal path and gitUrl entry.",
    "Repository-owned setup covers copy, symlink, and four hooks: pre-create, post-create, pre-remove, post-remove.",
    "Suggestions remain unselected; a bounded root-only scan provides suggestions, and Arashi never reads candidate contents.",
    "Manual entries receive canonical path validation and dependency directories produce a warning.",
    "Setup-script context never prefills a hook command.",
    "Choose exactly one inline source or editable active script; inline commands are user-supplied.",
    "Create uses the active configuration root .arashi/hooks/<lifecycle>.<repo><ext>.",
    "Remove uses the runtime-resolved target repository .arashi/hooks/<lifecycle><ext>; linked remove uses the active child.",
    "POSIX .sh uses 0755. Windows creates one .ps1 that is runtime-ready.",
    "The scaffold is a safe silent no-op with no rename/chmod activation, and Arashi never overwrites files.",
    "A sanitized summary never includes bodies. One final sanitized confirmation has no prompt-time writes.",
    "There is one config save plus transaction-owned scripts; cancellation uses rollback. Existing entry editing is issue #316.",
    "Pure Node/Bun installation uses private complete-file preparation and atomic no-replace publication.",
    "It rejects observable symlinks with pre/post ancestor identity validation. This provides practical safety but leaves a narrow residual race where another local process with workspace write access substitutes an ancestor between validation and publication.",
  ].join(" ");
  const validErrors: string[] = [];
  checkGuidance("fixture.md", valid, addContract, validErrors);
  assert.deepEqual(validErrors, []);

  const truthfulNegatives = [
    "Arashi never overwrites an existing active hook file.",
    "Discovery does not read candidate contents.",
    "Setup-script context doesn't infer or prefill hook commands.",
    "A sanitized summary never includes bodies or command text.",
    "Pure Node/Bun publication provides practical safety but does not eliminate the narrow residual local race.",
    "Installation does not require Rust or a native helper.",
  ];
  for (const claim of truthfulNegatives) {
    const claimErrors: string[] = [];
    checkGuidance("fixture.md", claim, [], claimErrors);
    assert.deepEqual(claimErrors, [], `checker rejected truthful negative guidance: ${claim}`);
  }

  const invalid = [
    "--json offers onboarding setup.",
    "Suggestions are automatically selected.",
    "Arashi reads candidate contents.",
    "Discovery does not read candidate contents, except when summary mode displays them.",
    "Onboarding exposes all schema fields.",
    "aw add updates an existing repository.",
    "Inline and active script sources both run for the same lifecycle.",
    "chmod is required to activate the file.",
    "Arashi overwrites an existing hook file.",
    "Arashi never overwrites an existing active file, except when --force permits replacement.",
    "Setup-script context never infers a hook command unless migration mode prefills one.",
    "A sanitized summary never includes bodies; however, debug mode prints command text.",
    "Save after each section during prompts.",
    "The installer is completely race-free.",
    "Arashi installation requires a Rust native helper.",
    "Onboarding does not configure workspace hooks by default, but may configure them when requested.",
    "Existing hook paths are not overwritten by default, but are overwritten when --force is active.",
    "Add does not request a second final confirmation normally, but requests one for hook scripts.",
    "Add does not save the configuration a second time normally, but saves it again after scripts are installed.",
    "Installation does not use a native helper normally, but uses one under contention.",
    "Publication does not guarantee absolute race freedom generally, but guarantees it when the parent exists.",
  ];
  const missedContradictions: string[] = [];
  for (const claim of invalid) {
    const claimErrors: string[] = [];
    checkGuidance("fixture.md", claim, [], claimErrors);
    if (claimErrors.length === 0) missedContradictions.push(claim);
  }
  assert.deepEqual(missedContradictions, [], `checker accepted deliberate contradictions:\n${missedContradictions.join("\n")}`);
  const missingResidualRace = valid.replace(/ This provides practical safety but leaves a narrow residual race[^.]+\./, ".");
  const missingResidualRaceErrors: string[] = [];
  checkGuidance("fixture.md", missingResidualRace, addContract, missingResidualRaceErrors);
  assert.match(missingResidualRaceErrors.join("\n"), /missing narrow residual local ancestor-substitution race/);
  for (const canary of forbiddenCanaries) {
    const canaryErrors: string[] = [];
    checkGuidance("fixture.md", canary, [], canaryErrors);
    assert.match(canaryErrors.join("\n"), /protected hook or generated content/);
  }
}

function runReachabilitySelfTest(): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-add-onboarding-docs-"));
  try {
    mkdirSync(path.join(fixtureRoot, "scripts"), { recursive: true });
    mkdirSync(path.join(fixtureRoot, ".github", "workflows"), { recursive: true });
    writeFileSync(path.join(fixtureRoot, "package.json"), `${JSON.stringify({ scripts: { "validate:interactive-add-onboarding-docs": `pnpm sync:content && node scripts/${checkerName}`, validate: "pnpm validate:semantic-docs" } })}\n`);
    writeFileSync(path.join(fixtureRoot, "scripts", "semantic-doc-checks.json"), `${JSON.stringify([checkerName])}\n`);
    writeFileSync(path.join(fixtureRoot, ".github", "workflows", "docs-validate.yml"), "steps:\n  - name: Validate\n    run: pnpm validate\n");
    const valid: string[] = [];
    checkReachability(fixtureRoot, valid);
    assert.deepEqual(valid, []);
    writeFileSync(path.join(fixtureRoot, "scripts", "semantic-doc-checks.json"), "[]\n");
    const omitted: string[] = [];
    checkReachability(fixtureRoot, omitted);
    assert.match(omitted.join("\n"), /must register/);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function read(rootPath: string, relativePath: string, found: string[]): string | null {
  try {
    return readFileSync(path.join(rootPath, relativePath), "utf8");
  } catch {
    found.push(`${relativePath} is missing`);
    return null;
  }
}

function parseJson(rootPath: string, relativePath: string, found: string[]): unknown {
  const content = read(rootPath, relativePath, found);
  if (content === null) return null;
  try {
    return JSON.parse(content);
  } catch {
    found.push(`${relativePath} is invalid JSON`);
    return null;
  }
}
