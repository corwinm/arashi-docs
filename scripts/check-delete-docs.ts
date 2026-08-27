import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

type Category =
  | "distinction"
  | "targeting"
  | "confirmation"
  | "safety"
  | "scope"
  | "json"
  | "secrecy"
  | "retry";
type Requirement = [category: Category, label: string, pattern: RegExp];

const checkerName = "check-delete-docs.ts";
const commandContract: Requirement[] = [
  [
    "distinction",
    "delete configured dependencies while remove deletes branch worktrees",
    /delete[^.!?]{0,120}configured repositor(?:y|ies)[^.!?]{0,180}remove[^.!?]{0,100}(?:branch|worktree)/i,
  ],
  [
    "targeting",
    "explicit exact configured-key targeting",
    /aw delete <repository>[^.!?]{0,160}exact[^.!?]{0,80}(?:configured )?(?:repository )?key/i,
  ],
  [
    "targeting",
    "omitted-target TTY checkbox selection of one or many keys",
    /aw delete(?! <repository>)[^.!?]{0,180}(?:human )?TTY[^.!?]{0,120}checkbox[^.!?]{0,100}(?:one or (?:more|many)|multiple)/i,
  ],
  [
    "confirmation",
    "complete combined preview and one default-no confirmation",
    /(?:all|complete)[^.!?]{0,100}(?:selected )?(?:plans?|repositories)[^.!?]{0,140}(?:combined|single|one) preview[^.!?]{0,140}(?:one|single)[^.!?]{0,80}default-no confirmation/i,
  ],
  [
    "confirmation",
    "dry-run before force and force confirmation boundary",
    /--dry-run[^.!?]{0,160}(?:before|then)[^.!?]{0,120}--force[^.!?]{0,160}(?:bypass|skip)[^.!?]{0,80}confirmation/i,
  ],
  [
    "targeting",
    "omitted non-TTY and JSON selection-required behavior",
    /(?:non-TTY|non-interactive)[^.!?]{0,100}(?:and|or|\/)[^.!?]{0,40}JSON[^.!?]{0,140}omitted[^.!?]{0,100}(?:selection-required|requires? an explicit key|fails?)/i,
  ],
  [
    "json",
    "explicit-key JSON dry-run plan location",
    /aw delete <repository> --dry-run --json[\s\S]{0,300}data\.plan[\s\S]{0,120}data\.result[^.!?]{0,40}null/i,
  ],
  [
    "json",
    "mutating JSON force and no prompt",
    /aw delete <repository> --force --json[^.!?]{0,180}(?:never|does not)[^.!?]{0,60}prompt/i,
  ],
  [
    "json",
    "partial JSON plan and result locations",
    /(?=[\s\S]{0,320}error\.details\.plan)(?=[\s\S]{0,320}error\.details\.result)(?=[\s\S]{0,320}accepted scope)(?=[\s\S]{0,320}phase ledger)/i,
  ],
  [
    "safety",
    "force bypasses only confirmation and Git data-loss guards",
    /--force[^.!?]{0,120}(?:bypasses|skips)[^.!?]{0,100}confirmation[^.!?]{0,100}Git data-loss guards?[^.!?]{0,80}only/i,
  ],
  [
    "safety",
    "non-overridable structural safety checks",
    /path containment[^.!?]{0,80}symlink[^.!?]{0,80}topology[^.!?]{0,80}identity[^.!?]{0,80}hook ambiguity[^.!?]{0,100}concurrent(?: configuration|-config) checks?[^.!?]{0,100}(?:remain|are)[^.!?]{0,60}mandatory/i,
  ],
  [
    "scope",
    "complete deleted scope",
    /(?:deletes?|removed scope)[^.!?]{0,180}canonical clone[^.!?]{0,120}(?:owned )?linked worktrees[^.!?]{0,100}local refs[^.!?]{0,100}(?:exact )?config(?:uration)? entry[^.!?]{0,160}(?:repository-targeted|repository-specific)[^.!?]{0,100}hook (?:files|templates)/i,
  ],
  [
    "scope",
    "complete preserved scope",
    /preserves?[^.!?]{0,120}unrelated config(?:uration)?[^.!?]{0,120}managed-ignore[^.!?]{0,100}shared hooks[^.!?]{0,100}user-global hooks[^.!?]{0,100}remote repositories[^.!?]{0,100}remote branches/i,
  ],
  [
    "secrecy",
    "hook identity metadata without contents or inline command bodies",
    /hook[^.!?]{0,100}(?:identity|path|status)[^.!?]{0,180}(?:never|do not|without)[^.!?]{0,80}(?:file contents|contents)[^.!?]{0,100}inline command bodies/i,
  ],
  [
    "retry",
    "partial batch state and exact safe retry",
    /earlier[\s\S]{0,80}completed[\s\S]{0,100}fail(?:ing|ed)[\s\S]{0,100}(?:later|remaining)[\s\S]{0,80}not started[\s\S]{0,220}(?:inspect|read)[\s\S]{0,100}(?:phase ledger|surviving state)[\s\S]{0,180}retry[\s\S]{0,80}exact command[\s\S]{0,100}(?:when|only if)[\s\S]{0,80}(?:reported|safe)/i,
  ],
  [
    "retry",
    "no atomic rollback claim",
    /(?:no|not|never|does not)[^.!?]{0,80}(?:atomic )?rollback/i,
  ],
];

const jsonPayloadContract: Requirement[] = [
  [
    "json",
    "explicit-key JSON failure stays within its selected repository",
    /explicit-key JSON partial failure[^.!?]{0,180}only that selected repository[^.!?]{0,180}never batch progress/i,
  ],
  [
    "json",
    "deterministic item order and closed item states",
    /plans? and results?[^.!?]{0,120}(?:same|retain)[^.!?]{0,80}(?:item IDs? and order|deterministic item IDs? and order)[\s\S]{0,260}linked worktrees?[^.!?]{0,100}deepest[^.!?]{0,160}bytewise[\s\S]{0,260}planned[^.!?]{0,40}completed[^.!?]{0,40}preserved[^.!?]{0,40}blocked[^.!?]{0,40}failed[^.!?]{0,40}not-started/i,
  ],
  [
    "json",
    "closed delete phase order and states",
    /phases? use this exact order[^.!?]{0,80}provenance[^.!?]{0,40}worktrees[^.!?]{0,40}metadata[^.!?]{0,40}canonical-clone[^.!?]{0,40}workspace-hooks[^.!?]{0,40}configuration[^.!?]{0,40}verification[\s\S]{0,180}phase states?[^.!?]{0,80}not-started[^.!?]{0,40}started[^.!?]{0,40}completed[^.!?]{0,40}failed/i,
  ],
];


const owningSurfaces = new Map<string, Requirement[]>([
  ["docs/commands/delete.md", [...commandContract, ...jsonPayloadContract]],
  ["public/commands/delete.md", [...commandContract, ...jsonPayloadContract]],
  ["public/llms.txt", commandContract],
  ["public/llms-full.txt", [...commandContract, ...jsonPayloadContract]],
]);

const discoveryRequirements = new Map<string, RegExp[]>([
  ["docs/commands/index.md", [/\[delete\]\(\/commands\/delete\/\)/i, /delete[^\n]{0,100}configured repositor/i]],
  ["public/commands/index.md", [/\[delete\]\(\/commands\/delete\/\)/i, /delete[^\n]{0,100}configured repositor/i]],
  ["docs/workflows/index.md", [/\[delete\]\(\/commands\/delete\/\)/i, /remove[^\n]{0,100}branch worktrees/i]],
  ["public/workflows/index.md", [/\[delete\]\(\/commands\/delete\/\)/i, /remove[^\n]{0,100}branch worktrees/i]],
  ["docs/commands/remove.md", [/delete[^.!?]{0,120}configured repositor/i, /remove[^.!?]{0,100}branch worktrees/i]],
  ["public/commands/remove.md", [/delete[^.!?]{0,120}configured repositor/i, /remove[^.!?]{0,100}branch worktrees/i]],
  ["docs/workflows/hooks.md", [/delete[\s\S]{0,260}repository-targeted[\s\S]{0,160}hook/i, /shared[^.!?]{0,80}user-global[^.!?]{0,80}preserv/i]],
  ["public/workflows/hooks.md", [/delete[\s\S]{0,260}repository-targeted[\s\S]{0,160}hook/i, /shared[^.!?]{0,80}user-global[^.!?]{0,80}preserv/i]],
]);
const generatedFreshnessPaths = [...new Set([
  ...owningSurfaces.keys(),
  ...discoveryRequirements.keys(),
])].filter((relativePath) => relativePath.startsWith("public/"));

const root = path.resolve(process.cwd());
runControlledMutationSelfTests();
runDiscoveryAndGeneratedDriftSelfTests();
runReachabilitySelfTest();
if (process.argv.includes("--self-test-only")) {
  console.log("Delete documentation checker controlled fixtures passed.");
  process.exit(0);
}

const errors = checkRoot(root);
if (errors.length > 0) {
  console.error("Delete documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(
  `Delete documentation contract passed for ${owningSurfaces.size} canonical/generated semantic surfaces, navigation, controlled drift, and stable aggregate reachability.`,
);

function checkRoot(rootPath: string): string[] {
  const found: string[] = [];
  for (const [relativePath, requirements] of owningSurfaces) {
    const content = read(rootPath, relativePath, found);
    if (content !== null) checkGuidance(relativePath, content, requirements, found);
  }
  for (const [relativePath, requirements] of discoveryRequirements) {
    const content = read(rootPath, relativePath, found);
    if (content !== null) checkDiscovery(relativePath, content, requirements, found);
  }
  checkGeneration(rootPath, found);
  checkReachability(rootPath, found);
  return found;
}

function checkGuidance(
  relativePath: string,
  content: string,
  requirements: Requirement[],
  found: string[],
): void {
  const normalized = content.replaceAll("`", "").replace(/\s+/g, " ");
  for (const [category, label, pattern] of requirements) {
    if (!pattern.test(normalized)) found.push(`${relativePath} [${category}] is missing ${label}`);
  }
  checkContradictions(relativePath, normalized, found);
}

function checkContradictions(relativePath: string, content: string, found: string[]): void {
  const claims: Array<[Category, RegExp, string]> = [
    ["distinction", /delete[^.!?]{0,100}(?:is an alias for|means the same as|removes? only)[^.!?]{0,80}remove/i, "must keep delete distinct from remove"],
    ["targeting", /(?:omitted|missing)[^.!?]{0,80}(?:target|repository)[^.!?]{0,120}(?:JSON|non-TTY)[^.!?]{0,120}(?:selects? all|chooses? a|prompts?)/i, "must not invent omitted automation targets"],
    ["safety", /--force[^.!?]{0,160}(?:bypasses|skips|disables)[^.!?]{0,100}(?:containment|symlink|topology|identity|hook ambiguity|concurrent)/i, "must not bypass structural safety"],
    ["scope", /aw delete[^.!?]{0,160}(?:deletes?|removes?)[^.!?]{0,80}(?:remote repositor|remote branch|shared hook|user-global hook)/i, "must not broaden deletion scope"],
    ["secrecy", /(?:plan|result)[^.!?]{0,100}(?:may|can|will)\s+(?:shows?|includes?|prints?)[^.!?]{0,100}(?:hook contents|inline command bodies)/i, "must not disclose hook contents"],
    ["retry", /delete[^.!?]{0,160}(?:atomically rolls? back|guarantees? rollback|always rolls? back)/i, "must not claim atomic rollback"],
  ];
  for (const [category, pattern, message] of claims) {
    if (pattern.test(content)) found.push(`${relativePath} [${category}] ${message}`);
  }
}

function checkDiscovery(
  relativePath: string,
  content: string,
  requirements: RegExp[],
  found: string[],
): void {
  for (const requirement of requirements) {
    if (!requirement.test(content)) {
      found.push(`${relativePath} is missing delete navigation guidance matching ${requirement}`);
    }
  }
}

function checkGeneration(rootPath: string, found: string[]): void {
  const generator = read(rootPath, "scripts/generate-agent-exports.ts", found);
  if (generator === null) return;
  if (!/"commands\/delete\.md"/.test(generator)) {
    found.push("scripts/generate-agent-exports.ts must order commands/delete.md in the full export");
  }
  if (!/"commands\/delete\.md"/.test(generator.slice(generator.indexOf("const requiredRoutes")))) {
    found.push("scripts/generate-agent-exports.ts must require commands/delete.md generation");
  }

  const regenerationRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-delete-docs-regenerate-"));
  try {
    cpSync(path.join(rootPath, "docs"), path.join(regenerationRoot, "docs"), { recursive: true });
    mkdirSync(path.join(regenerationRoot, "scripts"), { recursive: true });
    writeFileSync(
      path.join(regenerationRoot, "scripts", "generate-agent-exports.ts"),
      generator,
    );
    const result = spawnSync(process.execPath, ["scripts/generate-agent-exports.ts"], {
      cwd: regenerationRoot,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      found.push(`delete export regeneration failed with status ${result.status ?? "unknown"}`);
      return;
    }

    for (const relativePath of generatedFreshnessPaths) {
      const committed = read(rootPath, relativePath, found);
      const regenerated = read(regenerationRoot, relativePath, found);
      if (committed !== null && regenerated !== null && committed !== regenerated) {
        found.push(`${relativePath} generated export is stale`);
      }
    }
  } catch {
    found.push("delete export regeneration fixture could not be prepared");
  } finally {
    rmSync(regenerationRoot, { recursive: true, force: true });
  }
}

function checkReachability(rootPath: string, found: string[]): void {
  const packageJson = parseJson(rootPath, "package.json", found) as { scripts?: Record<string, string> } | null;
  const expected = `pnpm sync:content && node scripts/${checkerName}`;
  if (packageJson?.scripts?.["validate:delete-docs"] !== expected) {
    found.push("package.json must define validate:delete-docs");
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
    found.push("docs workflow must not name the focused delete checker");
  }
}

function runControlledMutationSelfTests(): void {
  const valid = [
    "Delete removes configured repository dependencies, while remove deletes branch worktrees.",
    "aw delete <repository> targets one exact configured repository key.",
    "With aw delete omitted, a human TTY opens a checkbox to select one or more keys.",
    "All selected repository plans appear in one combined preview followed by one default-no confirmation.",
    "Run --dry-run before --force; --force skips confirmation.",
    "Non-TTY and JSON use with the target omitted fails selection-required and requires an explicit key.",
    "aw delete <repository> --dry-run --json returns data.plan and data.result: null.",
    "aw delete <repository> --force --json never prompts.",
    "A partial error uses error.details.plan and error.details.result as the accepted scope and phase ledger.",
    "--force bypasses confirmation and Git data-loss guards only.",
    "Path containment, symlink, topology, identity, hook ambiguity, and concurrent-config checks remain mandatory.",
    "Delete removes the canonical clone, owned linked worktrees, local refs, exact config entry, and repository-targeted hook files/templates.",
    "It preserves unrelated configuration, managed-ignore policy, shared hooks, user-global hooks, remote repositories, and remote branches.",
    "Hook logical identity, path, or status may appear without file contents or inline command bodies.",
    "Earlier repositories may be completed, the failing repository is failed, and later repositories are not started; inspect the phase ledger and surviving state, then retry the exact command only when reported safe. There is no atomic rollback.",
  ].join(" ");
  const validErrors: string[] = [];
  checkGuidance("fixture.md", valid, commandContract, validErrors);
  assert.deepEqual(validErrors, [], `valid delete fixture failed: ${validErrors.join("; ")}`);

  const mutations: Array<[Category, string, string]> = [
    ["distinction", "configured repository dependencies", "feature branches"],
    ["targeting", "one exact configured repository key", "a matching path"],
    ["confirmation", "one combined preview", "separate previews"],
    ["safety", "remain mandatory", "are optional"],
    ["scope", "remote repositories, and remote branches", "remote repositories"],
    ["json", "data.result: null", "data.result: pending"],
    ["secrecy", "without file contents", "including file contents"],
    ["retry", "retry the exact command", "delete surviving paths manually"],
  ];
  const missed: string[] = [];
  for (const [category, before, after] of mutations) {
    assert.ok(valid.includes(before), `controlled ${category} mutation source is absent`);
    const errors: string[] = [];
    checkGuidance("fixture.md", valid.replace(before, after), commandContract, errors);
    if (!errors.some((error) => error.includes(`[${category}]`))) missed.push(category);
  }
  const contradictions: Array<[Category, string]> = [
    ["distinction", "Delete is an alias for remove."],
    ["targeting", "An omitted target in JSON selects all repositories."],
    ["safety", "--force bypasses path containment checks."],
    ["scope", "aw delete removes remote branches."],
    ["secrecy", "The result may include inline command bodies."],
    ["retry", "Delete guarantees rollback after failure."],
  ];
  for (const [category, contradiction] of contradictions) {
    const errors: string[] = [];
    checkGuidance("fixture.md", `${valid} ${contradiction}`, commandContract, errors);
    if (!errors.some((error) => error.includes(`[${category}]`))) missed.push(`contradiction:${category}`);
  }
  assert.deepEqual(missed, [], "controlled delete drift was not rejected");
}

function runDiscoveryAndGeneratedDriftSelfTests(): void {
  const navigation = "[delete](/commands/delete/) deletes a configured repository dependency.";
  const navigationErrors: string[] = [];
  checkDiscovery(
    "fixture-navigation.md",
    navigation,
    discoveryRequirements.get("docs/commands/index.md")!,
    navigationErrors,
  );
  assert.deepEqual(navigationErrors, [], "valid delete navigation fixture failed");

  const removedNavigationErrors: string[] = [];
  checkDiscovery(
    "fixture-navigation.md",
    "Configured repository commands are documented here.",
    discoveryRequirements.get("docs/commands/index.md")!,
    removedNavigationErrors,
  );
  assert.ok(removedNavigationErrors.length > 0, "controlled delete navigation removal was not rejected");

  const freshnessRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-delete-docs-freshness-"));
  try {
    cpSync(path.join(root, "docs"), path.join(freshnessRoot, "docs"), { recursive: true });
    cpSync(path.join(root, "public"), path.join(freshnessRoot, "public"), { recursive: true });
    mkdirSync(path.join(freshnessRoot, "scripts"), { recursive: true });
    cpSync(
      path.join(root, "scripts", "generate-agent-exports.ts"),
      path.join(freshnessRoot, "scripts", "generate-agent-exports.ts"),
    );

    const baselineErrors: string[] = [];
    checkGeneration(freshnessRoot, baselineErrors);
    assert.deepEqual(
      baselineErrors,
      [],
      `valid canonical/generated freshness fixture failed: ${baselineErrors.join("; ")}`,
    );

    const canonicalDeletePath = path.join(freshnessRoot, "docs", "commands", "delete.md");
    writeFileSync(
      canonicalDeletePath,
      `${readFileSync(canonicalDeletePath, "utf8").trimEnd()}\n\nFreshness fixture marker.\n`,
    );
    const staleGeneratedErrors: string[] = [];
    checkGeneration(freshnessRoot, staleGeneratedErrors);
    assert.ok(
      staleGeneratedErrors.some((error) =>
        error.includes("public/commands/delete.md generated export is stale"),
      ),
      "controlled stale generated delete export was not rejected after canonical regeneration input changed",
    );
  } finally {
    rmSync(freshnessRoot, { recursive: true, force: true });
  }
}

function runReachabilitySelfTest(): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-delete-docs-"));
  try {
    mkdirSync(path.join(fixtureRoot, "scripts"), { recursive: true });
    mkdirSync(path.join(fixtureRoot, ".github", "workflows"), { recursive: true });
    writeFileSync(
      path.join(fixtureRoot, "package.json"),
      `${JSON.stringify({ scripts: { "validate:delete-docs": `pnpm sync:content && node scripts/${checkerName}`, validate: "pnpm validate:semantic-docs" } })}\n`,
    );
    writeFileSync(path.join(fixtureRoot, "scripts", "semantic-doc-checks.json"), `${JSON.stringify([checkerName])}\n`);
    writeFileSync(path.join(fixtureRoot, ".github", "workflows", "docs-validate.yml"), "steps:\n  - name: Validate\n    run: pnpm validate\n");
    const valid: string[] = [];
    checkReachability(fixtureRoot, valid);
    assert.deepEqual(valid, []);

    writeFileSync(path.join(fixtureRoot, "scripts", "semantic-doc-checks.json"), "[]\n");
    const omitted: string[] = [];
    checkReachability(fixtureRoot, omitted);
    assert.match(omitted.join("\n"), /must register/);

    writeFileSync(path.join(fixtureRoot, "scripts", "semantic-doc-checks.json"), `${JSON.stringify([checkerName])}\n`);
    writeFileSync(path.join(fixtureRoot, ".github", "workflows", "docs-validate.yml"), `steps:\n  - run: node scripts/${checkerName}\n`);
    const bypass: string[] = [];
    checkReachability(fixtureRoot, bypass);
    assert.match(bypass.join("\n"), /stable pnpm validate aggregate/);
    assert.match(bypass.join("\n"), /must not name the focused/);
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
