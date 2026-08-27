import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

type Requirement = [label: string, pattern: RegExp];

const configurationContract: Requirement[] = [
  ["direct repos.<name>.copy array", /repos\.<name>\.copy[^.\n]{0,100}(?:array|list)/i],
  ["direct repos.<name>.symlink array", /repos\.<name>\.symlink[^.\n]{0,100}(?:array|list)/i],
  ["same-relative-path materialization", /same relative path/i],
  ["Git-primary child checkout source", /Git-primary child checkout/i],
  ["configured-only scope", /configured(?: mode| workspaces?)? only/i],
  ["copy isolation guidance", /copy[^.\n]{0,120}(?:independent|isolat)/i],
  ["symlink sharing guidance", /symlink[^.\n]{0,120}(?:shar|dependenc)/i],
  ["unsupported globs", /globs?[^.\n]{0,80}(?:not supported|unsupported)/i],
  ["unsupported remapping", /remapping[^.\n]{0,80}(?:not supported|unsupported)/i],
  ["unsupported standalone mode", /standalone(?: mode)?[^.\n]{0,100}(?:not supported|unsupported)/i],
  ["hooks escape hatch for external sources and interpolation", /lifecycle hooks?[^.\n]{0,180}external sources[^.\n]{0,140}interpolation/i],
  ["non-mutating doctor discovery", /aw doctor(?=[^.\n]{0,320}(?:inspect|diagnos))(?=[^.\n]{0,320}(?:non-mutat|without[^.\n]{0,80}(?:repair|mutation)))(?=[^.\n]{0,320}(?:materialization|source|destination))/i],
];

const conciseConfigurationContract: Requirement[] = [
  ["copy setting", /\bcopy\b/i],
  ["symlink setting", /\bsymlink\b/i],
  ["same-relative-path materialization", /same path/i],
  ["node_modules symlink warning", /Avoid symlinking node_modules/i],
  ["hooks escape hatch", /lifecycle hooks/i],
];

const createContract: Requirement[] = [
  [
    "pre-create then copy then symlink then post-create ordering",
    /pre-create[\s\S]{0,180}\bcopy\b[\s\S]{0,180}\bsymlink\b[\s\S]{0,180}post-create/i,
  ],
  [
    "--no-hooks independence",
    /--no-hooks[^.\n]{0,180}(?:does not|doesn't|will not)[^.\n]{0,100}(?:materialization|copy|symlink)/i,
  ],
  ["missing-source skip", /missing sources?[^.\n]{0,100}(?:are )?skipped/i],
  ["no overwrite", /(?:does not|never|will not)[^.\n]{0,80}overwrite/i],
  ["worktree containment", /(?:destination|target)[^.\n]{0,140}(?:remain|stay|contained|inside|within)[^.\n]{0,80}worktree/i],
  ["no source fallback", /materialization[^.\n]{0,120}(?:does not|never|will not)[^.\n]{0,100}(?:fallback|fall back)[^.\n]{0,120}(?:source|checkout|repository)/i],
  ["native symlink failure has no action fallback", /symlink[^.\n]{0,140}(?:platform|policy|filesystem)[^.\n]{0,140}(?:fail|reject)[^.\n]{0,180}(?:no|never|does not)[^.\n]{0,100}(?:copy|hard[- ]?link|junction)[^.\n]{0,100}fallback/i],
  ["dry-run ordered materialization preview", /--dry-run[^.\n]{0,180}(?:preview|plan)[^.\n]{0,160}(?:ordered|declaration order)[^.\n]{0,160}materialization[^.\n]{0,160}(?:without mutation|non-mutating|before[^.\n]{0,80}mutation)/i],
];

const combinedContract = [...configurationContract, ...createContract];
const surfaces = new Map<string, Requirement[]>([
  ["docs/workflows/config.md", conciseConfigurationContract],
  ["docs/commands/create.md", createContract],
  ["public/workflows/config.md", conciseConfigurationContract],
  ["public/commands/create.md", createContract],
  ["public/llms.txt", combinedContract],
  ["public/llms-full.txt", [...conciseConfigurationContract, ...createContract]],
  ["scripts/generate-agent-exports.ts", combinedContract],
]);

const checkerName = "check-worktree-materialization-docs.ts";
const root = path.resolve(process.cwd());

runControlledGuidanceSelfTest();
runReachabilitySelfTest();

if (process.argv.includes("--self-test-only")) {
  console.log("Worktree-materialization documentation checker self-tests passed.");
  process.exit(0);
}

const errors = checkRoot(root);
if (errors.length > 0) {
  console.error("Worktree-materialization documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Worktree-materialization documentation contract passed for ${surfaces.size} canonical/generated surfaces.`,
);

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

function checkGuidance(
  relativePath: string,
  content: string,
  requirements: Requirement[],
  found: string[],
): void {
  const normalized = content.replaceAll("`", "").replace(/\\`/g, "").replace(/\s+/g, " ");
  for (const [label, pattern] of requirements) {
    if (!pattern.test(normalized)) found.push(`${relativePath} is missing ${label}`);
  }
  checkContradictions(relativePath, normalized, found);
}

function checkContradictions(relativePath: string, content: string, found: string[]): void {
  const statements = content.split(/(?<=[.!?])\s+|\n+/);
  for (const statement of statements) {
    const clauses = statement.split(
      /\b(?:as well as|even though|even when|even if|although|though|because|since|but|yet|however|while|whereas|nevertheless|nonetheless|instead)\b|;|,\s*(?:(?:and|or)\s+(?:also\s+)?)?|\s+(?:and|or)\s+(?:also\s+)?(?=(?:copy|symlinks?|materialization|standalone|supports?|accepts?|allows?|expands?|uses?|can|may|could|might|will|would|should|must|escapes?|leaves?|outside|beyond|overwrites?|replaces?|destinations?|targets?|files?|paths?|existing|missing|fails?|aborts?|aborted|stops?|prevents?|fatal)\b)/i,
    );
    const claims: Array<[RegExp, RegExp, string]> = [
      [/(?:\b(?:copy|symlinks?|materialization)(?:\s+(?:entries|arrays|configuration))?\b[^.\n]{0,60}\b(?:supports?|accepts?|expands?|uses?)\b[^.\n]{0,40}\bglobs?\b|\b(?:supports?|accepts?|expands?|uses?)\b[^.\n]{0,40}\bglobs?\b[^.\n]{0,40}\b(?:in|for|through|via|with)\s+(?:copy|symlinks?|materialization)\b|\bglobs?\b[^.\n]{0,40}\b(?:supported|accepted|expanded|used)\b[^.\n]{0,40}\b(?:in|by|for|through|via)\s+(?:copy|symlinks?|materialization)\b)/i, /\b(?:supports?|supported|accepts?|accepted|expands?|expanded|uses?|used)\b/i, "must not advertise glob support"],
      [/(?:\b(?:copy|symlinks?|materialization)(?:\s+(?:entries|arrays|configuration))?\b[^.\n]{0,60}\b(?:supports?|allows?|accepts?|uses?)\b[^.\n]{0,50}\b(?:remapping|destination mapping)\b|\b(?:supports?|allows?|accepts?|uses?)\b[^.\n]{0,50}\b(?:remapping|destination mapping)\b[^.\n]{0,40}\b(?:in|for|through|via|with)\s+(?:copy|symlinks?|materialization)\b|\b(?:remapping|destination mapping)\b[^.\n]{0,40}\b(?:supported|allowed|accepted|used)\b[^.\n]{0,40}\b(?:in|by|for|through|via)\s+(?:copy|symlinks?|materialization)\b)/i, /\b(?:supports?|supported|allows?|allowed|accepts?|accepted|uses?|used)\b/i, "must not advertise path remapping"],
      [/(?:\bstandalone(?: mode)?\b[^.\n]{0,100}\b(?:supports?|uses?|applies?|materializes?)\b[^.\n]{0,80}\b(?:copy|symlinks?|materialization)\b|\bstandalone(?: mode)?\b[^.\n]{0,60}\b(?:copy|symlinks?|materialization)\b[^.\n]{0,40}\b(?:is|are)\s+(?:supported|available|applied|materialized)\b|\bstandalone(?: mode)?\b[^.\n]{0,40}\b(?:is|are)\s+(?:supported|available|applied|materialized)\b[^.\n]{0,40}\b(?:for|with)\s+(?:copy|symlinks?|materialization)\b|\b(?:copy|symlink|materialization)(?:\s+entries?)?\b[^.\n]{0,80}\b(?:supported|available|applied|materialized)\b[^.\n]{0,60}\b(?:in|by|for)\s+standalone(?: mode)?\b)/i, /\b(?:supports?|supported|available|uses?|applies?|applied|materializes?|materialized)\b/i, "must keep materialization configured-only"],
      [/(?:\b(?:copy|symlinks?|materialization)\s+destinations?\b[^.\n]{0,80}\b(?:outside|beyond)\b[^.\n]{0,50}\b(?:new\s+)?worktree\b|\b(?:copy|symlinks?|materialization)\s+destinations?\b[^.\n]{0,80}\b(?:escapes?|leaves?)\b[^.\n]{0,50}\b(?:new\s+)?worktree\b|\bdestinations?\b[^.\n]{0,40}\b(?:outside|beyond)\b[^.\n]{0,40}\b(?:new\s+)?worktree\b[^.\n]{0,50}\b(?:supported|allowed|used)\b[^.\n]{0,50}\b(?:copy|symlinks?|materialization)\b)/i, /\b(?:outside|beyond|escapes?|leaves?|supported|allowed|used)\b/i, "must preserve destination containment"],
      [/(?:\b(?:copy|symlinks?|materialization)(?:\s+(?:entries|arrays|configuration))?\b[^.\n]{0,80}\b(?:supports?|accepts?|allows?|uses?)\b[^.\n]{0,50}\b(?:absolute paths?|parent traversal(?: paths?)?)\b|\b(?:absolute paths?|parent traversal(?: paths?)?)\b[^.\n]{0,50}\b(?:supported|accepted|allowed|used)\b[^.\n]{0,50}\b(?:by|for|in)\s+(?:copy|symlinks?|materialization)(?:\s+entries)?\b)/i, /\b(?:supports?|supported|accepts?|accepted|allows?|allowed|uses?|used)\b/i, "must preserve destination containment"],
      [/--no-hooks[^.\n]{0,120}\b(?:disables?|skips?|prevents?)\b[^.\n]{0,80}\b(?:copy|symlinks?|materialization)\b/i, /\b(?:disables?|skips?|prevents?)\b/i, "must keep --no-hooks independent from materialization"],
      [/(?:\bmissing\s+(?:(?:copy|symlinks?|materialization|lifecycle[ -]hooks?)\s+)?sources?\b[^.\n]{0,100}\b(?:fails?|aborts?|aborted|stops?|prevents?|fatal)\b|\b(?:(?:copy|symlinks?|materialization|lifecycle[ -]hooks?)\s+)?sources?\b[^.\n]{0,40}\bmissing\b[^.\n]{0,100}\b(?:fails?|aborts?|aborted|stops?|prevents?|fatal)\b|\b(?:create|creation|worktree(?: creation)?)\b[^.\n]{0,100}\b(?:fails?|aborts?|aborted|stops?|prevented|fatal)\b[^.\n]{0,100}\b(?:(?:copy|symlinks?|materialization|lifecycle[ -]hooks?)\s+)?sources?\b[^.\n]{0,30}\bmissing\b|\b(?:create|creation|worktree(?: creation)?)\b[^.\n]{0,100}\b(?:fails?|aborts?|aborted|stops?|prevented)\b[^.\n]{0,100}\bmissing\s+(?:(?:copy|symlinks?|materialization|lifecycle[ -]hooks?)\s+)?sources?\b)/i, /\b(?:fails?|aborts?|aborted|stops?|prevents?|prevented|fatal)\b/i, "must keep missing sources nonfatal"],
      [/(?:\b(?:Arashi|copy|symlinks?|materialization)\b[^.\n]{0,100}\b(?:overwrites?|replaces?)\b[^.\n]{0,80}\b(?:existing\s+)?(?:destinations?|targets?|files?|paths?)\b|\b(?:copy|symlinks?|materialization)\b[^.\n]{0,80}\b(?:existing\s+)?(?:destinations?|targets?|files?|paths?)\b[^.\n]{0,80}\b(?:overwritten|replaced)\b|\b(?:existing\s+)?(?:destinations?|targets?|files?|paths?)\b[^.\n]{0,80}\b(?:overwritten|replaced)\b[^.\n]{0,80}\b(?:during|by|for|through)\s+(?:copy|symlinks?|materialization)\b)/i, /\b(?:overwrites?|replaces?|overwritten|replaced)\b/i, "must not advertise overwrite behavior"],
      [/\b(?:copy|symlinks?|materialization)\b[^.\n]{0,120}\b(?:falls? back|fallback)\b[^.\n]{0,120}\b(?:source|checkout|repository)\b/i, /\b(?:falls? back|fallback)\b/i, "must not advertise source fallback"],
      [/\bsymlink\b[^.\n]{0,160}\bfalls? back\b[^.\n]{0,120}\b(?:copy|hard[- ]?link|junction)\b/i, /\bfalls? back\b/i, "must not advertise native symlink action fallback"],
      [/\bmaterialization\b[^.\n]{0,120}\b(?:accepts?|uses?|reads?)\b[^.\n]{0,120}\bexternal sources?\b/i, /\b(?:accepts?|uses?|reads?)\b/i, "must not advertise external materialization sources"],
      [/\brepository pre-create\b[^.\n]{0,100}\bpost-materialization\b/i, /\bpost-materialization\b/i, "must not use ambiguous pre-create lifecycle wording"],
    ];
    let materializationContext = false;
    let missingSourceContext = false;
    let missingSourceHookOwned = false;
    for (const rawClause of clauses) {
      const explicitMaterialization = /\b(?:copy|symlinks?|materialization)\b/i.test(rawClause);
      const elidedMaterializationAction =
        !explicitMaterialization &&
        materializationContext &&
        /^\s*(?:(?:can|may|could|might|will|would|should|must)\s+)?(?:(?:not|never|cannot)\s+|[a-z]+n['’]t\s+|(?:do|does|will|must|can|may|could|might|would|should|is|are)\s+not\s+)?(?:supports?|supported|accepts?|accepted|allows?|allowed|expands?|expanded|uses?|used|overwrites?|replaces?)\b/i.test(
          rawClause,
        );
      const elidedContainmentAction =
        !explicitMaterialization &&
        materializationContext &&
        /^\s*(?:(?:can|may|could|might|will|would|should|must)\s+)?(?:(?:not|never|cannot)\s+|[a-z]+n['’]t\s+|(?:can|may|could|might|will|would|should|must|is|are)\s+not\s+)?(?:be\s+)?(?:outside|beyond|escapes?|leaves?)\b/i.test(
          rawClause,
        );
      const explicitMissingSource =
        /\bmissing\s+(?:(?:copy|symlinks?|materialization|lifecycle[ -]hooks?)\s+)?sources?\b|\b(?:(?:copy|symlinks?|materialization|lifecycle[ -]hooks?)\s+)?sources?\b[^.\n]{0,30}\bmissing\b/i.test(
          rawClause,
        );
      const elidedMissingSourceFailure =
        !explicitMissingSource &&
        missingSourceContext &&
        /^\s*(?:(?:so|therefore|thus|consequently)\s+)?(?:(?:create|creation|worktree(?: creation)?)\s+)?(?:(?:can|may|could|might|will|would|should|must)\s+)?(?:(?:is|are|be)\s+)?(?:(?:not|never|cannot)\s+|[a-z]+n['’]t\s+|(?:do|does|will|must|can|may|could|might|would|should|is|are)\s+not\s+)?(?:be\s+)?(?:fails?|aborts?|aborted|stops?|prevents?|prevented|fatal)\b/i.test(
          rawClause,
        );
      const passiveLifecycleHookOwned =
        /\b(?:overwritten|replaced)\s+by\s+(?:lifecycle\s+)?hooks?\b/i.test(rawClause);
      const elidedPassiveOverwrite =
        !explicitMaterialization &&
        !passiveLifecycleHookOwned &&
        materializationContext &&
        /^\s*(?:existing\s+)?(?:destinations?|targets?|files?|paths?)\b[^.\n]{0,80}\b(?:(?:can|may|could|might|will|would|should|must)\s+be\s+)?(?:overwritten|replaced)\b/i.test(
          rawClause,
        );
      const clause = elidedContainmentAction
        ? `materialization destinations ${rawClause}`
        : elidedMissingSourceFailure
          ? `${missingSourceHookOwned ? "missing lifecycle hook sources" : "missing materialization sources"} ${rawClause}`
          : elidedMaterializationAction || elidedPassiveOverwrite
            ? `materialization ${rawClause}`
            : rawClause;
      if (explicitMaterialization) materializationContext = true;
      if (explicitMissingSource) {
        missingSourceContext = true;
        missingSourceHookOwned = /\blifecycle[ -]hooks?\b/i.test(rawClause);
      }
      const lifecycleHookContext = /\b(?:lifecycle\s+)?hooks?\b/i.test(rawClause);
      if (lifecycleHookContext) materializationContext = false;
      for (const [pattern, actionPattern, message] of claims) {
        const globalPattern = new RegExp(pattern.source, `${pattern.flags}g`);
        for (const match of clause.matchAll(globalPattern)) {
          if (match.index === undefined) continue;
          const action = actionPattern.exec(match[0]);
          const actionIndex = match.index + (action?.index ?? 0);
          if (
            (message === "must not advertise overwrite behavior" &&
              isLifecycleHookOwnedAction(clause, actionIndex)) ||
            (message === "must keep missing sources nonfatal" &&
              isLifecycleHookOwnedMissingSourceFailure(clause, actionIndex))
          ) {
            continue;
          }
          if (!isNegated(clause, actionIndex)) {
            found.push(`${relativePath} ${message}`);
          }
        }
      }
    }
  }
}

function isLifecycleHookOwnedMissingSourceFailure(
  statement: string,
  actionIndex: number,
): boolean {
  if (
    /\bmissing\s+lifecycle[ -]hooks?\s+sources?\b|\blifecycle[ -]hooks?\s+sources?\b[^.\n]{0,30}\bmissing\b/i.test(
      statement,
    )
  ) {
    return true;
  }
  const ownerPrefix = statement.slice(0, actionIndex);
  return (
    /^\s*(?:lifecycle\s+)?hooks?\b[^.;]{0,160}$/i.test(ownerPrefix) ||
    /\b(?:before|after)\s+(?:lifecycle\s+)?hooks?\b[^.;]{0,120}$/i.test(ownerPrefix)
  );
}

function isLifecycleHookOwnedAction(statement: string, actionIndex: number): boolean {
  const ownerPrefix = statement.slice(0, actionIndex);
  if (
    /^\s*(?:lifecycle\s+)?hooks?\s+run\s+(?:before|after)\s+materialization\s*$/i.test(
      ownerPrefix,
    )
  ) {
    return false;
  }
  return (
    /^\s*(?:(?:before|after)\s+materialization\b[^,;.]*[, ]+)?(?:lifecycle\s+)?hooks?\b[^.;]{0,160}$/i.test(
      ownerPrefix,
    ) ||
    /\b(?:before|after)\s+(?:lifecycle\s+)?hooks?\s+(?:(?:can|may|could|might|will|would|should|must)\s+)?$/i.test(
      ownerPrefix,
    )
  );
}

function isNegated(statement: string, actionIndex: number): boolean {
  const prefix = statement.slice(Math.max(0, actionIndex - 100), actionIndex);
  if (
    /\b(?:not|never|cannot|non[- ]?|[a-z]+n['’]t|(?:do|does|will|must|can|may|could|might|would|should|is|are)\s+not)(?:\s+be)?(?:\s+[a-z]+){0,8}\s*$/i.test(
      prefix,
    ) ||
    /\bskipped\b[^.;]{0,50}\b(?:rather than|instead of)\b[^.;]{0,50}$/i.test(prefix)
  ) {
    return true;
  }
  return /\bneither\b[^.\n]{0,100}\b(?:copy|symlinks?|materialization)\b[^.\n]{0,60}$/i.test(
    statement.slice(Math.max(0, actionIndex - 140), actionIndex),
  );
}

function checkReachability(rootPath: string, found: string[]): void {
  const packageJson = parseJson(rootPath, "package.json", found) as
    | { scripts?: Record<string, string> }
    | null;
  const focused = `pnpm sync:content && node scripts/${checkerName}`;
  if (packageJson?.scripts?.["validate:worktree-materialization-docs"] !== focused) {
    found.push("package.json must define validate:worktree-materialization-docs");
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
    found.push("docs workflow must not name the focused materialization checker");
  }
}

function runControlledGuidanceSelfTest(): void {
  const valid = [
    "repos.<name>.copy is a direct array; repos.<name>.symlink is a direct array.",
    "Each entry uses the same relative path from the Git-primary child checkout into the worktree.",
    "This is available in configured workspaces only.",
    "Choose copy for an independent isolated file, or symlink to share dependencies with the primary checkout.",
    "Globs are not supported, remapping is unsupported, and standalone mode is not supported.",
    "Copy entries are not supported in standalone mode.",
    "Copy entries aren't supported in standalone mode.",
    "Copy entries aren’t supported in standalone mode.",
    "Standalone mode doesn't materialize copy entries.",
    "Standalone mode doesn’t materialize copy entries.",
    "Copy entries do not support globs, and symlink entries do not support globs.",
    "Copy entries do not support globs, but lifecycle hooks support globs.",
    "Neither copy nor symlink entries support globs.",
    "Copy entries don't support globs, whereas symlink entries don’t accept globs.",
    "Copy entries don't support globs, and symlink entries won’t accept globs.",
    "Copy entries cannot use globs, and symlink entries can’t use globs.",
    "Copy entries may not use globs.",
    "Materialization destinations may not be outside the new worktree.",
    "Copy destinations cannot escape the new worktree.",
    "Copy entries may not use absolute paths or parent traversal.",
    "Absolute paths cannot be used by copy entries.",
    "Parent traversal paths aren’t accepted by symlink entries.",
    "Lifecycle hook destinations may be outside the new worktree.",
    "Although copy entries do not support globs, lifecycle hooks support globs.",
    "Ordering is pre-create, copy, symlink, post-create.",
    "--no-hooks does not disable materialization.",
    "Missing sources are skipped.",
    "Missing sources are skipped with a visible non-fatal outcome.",
    "Missing materialization sources do not fail create.",
    "Missing copy sources cannot abort creation.",
    "Missing symlink sources are not fatal.",
    "Missing sources do not cause create to fail.",
    "Missing copy sources should not make create fail.",
    "Missing sources are skipped rather than causing create to fail.",
    "Lifecycle hooks cause create to fail when their source is missing.",
    "Materialization runs before lifecycle hooks cause create to fail when their source is missing.",
    "Missing lifecycle hook sources may fail create and abort creation.",
    "Missing lifecycle hook sources may fail create.",
    "Arashi never overwrites an existing destination.",
    "Materialization does not overwrite existing destinations.",
    "Existing destinations aren’t replaced during materialization.",
    "Lifecycle hooks may overwrite their own generated destinations.",
    "Lifecycle hooks that run after materialization may overwrite their own generated destinations.",
    "Materialization runs before lifecycle hooks overwrite their own generated destinations.",
    "Materialization runs after lifecycle hooks overwrite their own generated destinations.",
    "Materialization runs before lifecycle hooks may replace their own generated targets.",
    "Materialization does not overwrite existing destinations, but existing destinations may be replaced by lifecycle hooks.",
    "Every destination must remain inside the worktree.",
    "Materialization does not fall back to another source checkout or repository.",
    "A native symlink fails when platform policy or the filesystem rejects it, with no copy, hard-link, or junction fallback.",
    "Use lifecycle hooks for external sources and interpolation. Lifecycle hooks support globs and remapping.",
    "aw doctor diagnoses materialization sources and destinations non-mutatively without repair.",
    "--dry-run previews the ordered materialization plan before any mutation.",
  ].join(" ");
  const validErrors: string[] = [];
  checkGuidance("fixture.md", valid, combinedContract, validErrors);
  assert.deepEqual(validErrors, []);

  const invalidClaims: Array<[string, RegExp, number?]> = [
    ["Arashi supports globs in copy entries.", /glob support/],
    ["Copy entries can use globs.", /glob support/],
    ["Copy entries may use globs.", /glob support/],
    ["Globs can be used in copy entries.", /glob support/],
    ["Copy entries can use destination mapping.", /path remapping/],
    ["Materialization destinations may be outside the new worktree.", /destination containment/],
    ["Copy destinations can escape the new worktree.", /destination containment/],
    ["Destinations outside the new worktree are supported for materialization.", /destination containment/],
    ["Copy entries may use absolute paths.", /destination containment/],
    ["Symlink entries can accept parent traversal paths.", /destination containment/],
    ["Absolute paths can be used by copy entries.", /destination containment/],
    ["Parent traversal paths are accepted by symlink entries.", /destination containment/],
    ["Copy destinations cannot escape the new worktree, but can escape the new worktree.", /destination containment/],
    ["Copy destinations may not be outside the new worktree, but may be outside the new worktree.", /destination containment/],
    ["Copy destinations can escape the new worktree and can be outside the new worktree.", /destination containment/, 2],
    ["Copy destinations escape the new worktree and leave the new worktree.", /destination containment/, 2],
    ["Copy destinations escape the new worktree, and leave the new worktree.", /destination containment/, 2],
    ["Copy destinations can escape the new worktree, and can be outside the new worktree.", /destination containment/, 2],
    ["Copy entries do not support globs, but symlink entries support globs.", /glob support/],
    ["Although copy entries do not support globs, symlink entries support globs.", /glob support/],
    ["Copy entries do not support globs although symlink entries support globs.", /glob support/],
    ["Copy entries do not support globs even when symlink entries support globs.", /glob support/],
    ["Copy entries do not support globs even if symlink entries support globs.", /glob support/],
    ["Copy entries do not support globs because symlink entries support globs.", /glob support/],
    ["Copy entries support globs as well as symlink entries accept globs.", /glob support/, 2],
    ["Copy entries do not support globs, whereas symlink entries support globs.", /glob support/],
    ["Copy entries do not support globs, but support globs.", /glob support/],
    ["Copy entries do not support globs and support globs.", /glob support/],
    ["Copy entries do not support globs, support globs.", /glob support/],
    ["Globs are supported in copy entries.", /glob support/],
    ["Repository pre-create runs at its post-materialization point.", /pre-create lifecycle wording/],
    ["Arashi allows destination mapping for symlinks.", /path remapping/],
    ["Standalone mode materializes copy entries.", /configured-only/],
    ["Copy entries are supported in standalone mode.", /configured-only/],
    ["Standalone materialization is supported.", /configured-only/],
    ["Standalone mode is supported for materialization.", /configured-only/],
    ["--no-hooks disables copy and symlink materialization.", /--no-hooks independent/],
    ["Missing materialization sources fail create immediately.", /missing sources nonfatal/],
    ["Missing copy sources abort creation.", /missing sources nonfatal/],
    ["Copy sources are missing, so create fails.", /missing sources nonfatal/],
    ["Copy sources are missing so create fails.", /missing sources nonfatal/],
    ["Copy sources are missing, so creation is aborted.", /missing sources nonfatal/],
    ["Copy sources are missing, so creation can be aborted.", /missing sources nonfatal/],
    ["Copy sources are missing; therefore create fails.", /missing sources nonfatal/],
    ["Missing lifecycle hook sources may fail create and missing materialization sources abort creation.", /missing sources nonfatal/],
    ["Missing materialization sources fail create and missing lifecycle hook sources may abort creation.", /missing sources nonfatal/],
    ["A missing symlink source can fail worktree creation.", /missing sources nonfatal/],
    ["Missing materialization sources are fatal.", /missing sources nonfatal/],
    ["Create is aborted by a missing copy source.", /missing sources nonfatal/],
    ["Worktree creation fails when materialization sources are missing.", /missing sources nonfatal/],
    ["Missing copy sources fail create and abort creation.", /missing sources nonfatal/, 2],
    ["Missing copy sources fail create and also abort creation.", /missing sources nonfatal/, 2],
    ["Missing copy sources do not fail create, but abort creation.", /missing sources nonfatal/],
    ["Arashi overwrites an existing destination.", /overwrite behavior/],
    ["Materialization overwrites existing destinations.", /overwrite behavior/],
    ["Existing destinations are overwritten during materialization.", /overwrite behavior/],
    ["Existing targets can be replaced by copy materialization.", /overwrite behavior/],
    ["Materialization does not overwrite destinations, but overwrites destinations.", /overwrite behavior/],
    ["Materialization overwrites destinations, and replaces targets.", /overwrite behavior/, 2],
    ["Materialization does not overwrite existing destinations and existing targets are replaced.", /overwrite behavior/],
    ["Materialization overwrites destinations and existing targets are replaced.", /overwrite behavior/, 2],
    ["Materialization overwrites existing destinations before lifecycle hooks run.", /overwrite behavior/],
    ["Materialization does not overwrite destinations, but existing destinations are replaced with outputs generated by lifecycle hooks.", /overwrite behavior/],
    ["Lifecycle hooks run after materialization overwrites existing destinations.", /overwrite behavior/],
    ["Lifecycle hooks run before materialization replaces existing targets.", /overwrite behavior/],
    ["Materialization replaces existing targets after lifecycle hooks finish.", /overwrite behavior/],
    ["Copy materialization falls back to another source checkout.", /source fallback/],
    ["On Windows, a rejected native symlink falls back to a junction.", /native symlink action fallback/],
    ["Materialization accepts external sources when configured.", /external materialization sources/],
  ];
  const missed: string[] = [];
  for (const [claim, expected, expectedCount = 1] of invalidClaims) {
    const errors: string[] = [];
    checkContradictions("fixture.md", claim, errors);
    const matchingCount = errors.filter((error) => expected.test(error)).length;
    if (matchingCount !== expectedCount) {
      missed.push(`${claim} (expected ${expectedCount}, received ${matchingCount})`);
    }
  }
  assert.deepEqual(missed, [], "checker missed controlled invalid guidance");
}

function runReachabilitySelfTest(): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-materialization-docs-"));
  try {
    mkdirSync(path.join(fixtureRoot, "scripts"), { recursive: true });
    mkdirSync(path.join(fixtureRoot, ".github", "workflows"), { recursive: true });
    writeFileSync(
      path.join(fixtureRoot, "package.json"),
      `${JSON.stringify({ scripts: { "validate:worktree-materialization-docs": `pnpm sync:content && node scripts/${checkerName}`, validate: "pnpm validate:semantic-docs" } })}\n`,
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
    writeFileSync(path.join(fixtureRoot, ".github", "workflows", "docs-validate.yml"), `steps:\n  - name: Focused bypass\n    run: node scripts/${checkerName}\n`);
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
