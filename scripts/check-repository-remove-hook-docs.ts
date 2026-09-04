import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

type Requirement = {
  label: string;
  pattern: RegExp;
  valid: string;
  drift: string;
};

const canonicalPath: Requirement = {
  label: "qualified configuration-root remove paths",
  pattern:
    /<configurationRoot>\/\.arashi\/hooks\/pre-remove\.<repo><ext>[\s\S]{0,180}<configurationRoot>\/\.arashi\/hooks\/post-remove\.<repo><ext>/i,
  valid:
    "The paths are <configurationRoot>/.arashi/hooks/pre-remove.<repo><ext> and <configurationRoot>/.arashi/hooks/post-remove.<repo><ext>.",
  drift:
    "The paths are repos/<repo>/.arashi/hooks/pre-remove<ext> and repos/<repo>/.arashi/hooks/post-remove<ext>.",
};

const aliasSlot: Requirement = {
  label: "three aliases for one repository slot",
  pattern:
    /repos\.<repo>\.hooks\.<lifecycle>[\s\S]{0,260}\.arashi\/hooks\/<lifecycle>\.<repo><ext>[\s\S]{0,260}<activeRepo>\/\.arashi\/hooks\/<lifecycle><ext>[\s\S]{0,220}(?:three aliases|aliases)[\s\S]{0,100}(?:one|same) repository (?:logical )?(?:slot|location)/i,
  valid:
    "repos.<repo>.hooks.<lifecycle>, .arashi/hooks/<lifecycle>.<repo><ext>, and <activeRepo>/.arashi/hooks/<lifecycle><ext> are three aliases for one repository slot.",
  drift:
    "repos.<repo>.hooks.<lifecycle>, .arashi/hooks/<lifecycle>.<repo><ext>, and <activeRepo>/.arashi/hooks/<lifecycle><ext> are independent hooks.",
};

const collision: Requirement = {
  label: "overlap fails before hook or remove mutation without precedence",
  pattern:
    /(?:two|multiple|overlap|more than one)[\s\S]{0,180}(?:claim|source|alias)[\s\S]{0,220}(?:fail|ambigu)[\s\S]{0,140}before[\s\S]{0,120}(?:hook execution|hook mutation|removal mutation|remove mutation|mutation)[\s\S]{0,220}(?:never|not|rather than|without)[\s\S]{0,100}(?:compose|precedence|choose)/i,
  valid:
    "When more than one alias claims the slot, ambiguity fails before hook execution or removal mutation; aliases never compose and have no precedence.",
  drift:
    "When more than one alias claims the slot, Arashi chooses the first source and continues.",
};

const identityAndCwd: Requirement = {
  label: "repository identity, selected source path, and active checkout cwd",
  pattern:
    /repository scope[\s\S]{0,160}(?:plain|unqualified)[\s\S]{0,80}(?:lifecycle|hook) name[\s\S]{0,180}(?:selected|exact)[\s\S]{0,100}source path[\s\S]{0,220}(?:(?:cwd|working directory)[\s\S]{0,140}(?:active|target)[\s\S]{0,80}(?:checkout|repository)|(?:active|target)[\s\S]{0,80}(?:checkout|repository)[\s\S]{0,100}(?:cwd|working directory))/i,
  valid:
    "It retains repository scope and a plain lifecycle name, reports the selected source path, and uses the active target checkout as cwd.",
  drift:
    "It uses workspace scope and runs from the configuration root.",
};

const order: Requirement = {
  label: "remove scope order",
  pattern:
    /repository[\s\S]{0,40}(?:→|,|then)[\s\S]{0,40}workspace[\s\S]{0,40}(?:→|,|then)[\s\S]{0,40}global-targeted[\s\S]{0,40}(?:→|,|then)[\s\S]{0,40}global-shared/i,
  valid: "The order is repository → workspace → global-targeted → global-shared.",
  drift: "The order is workspace, repository, global-shared, global-targeted.",
};

const windows: Requirement = {
  label: "Windows native extensions and cross-alias ambiguity",
  pattern:
    /Windows[\s\S]{0,160}\.ps1[\s\S]{0,80}\.cmd[\s\S]{0,80}\.bat[\s\S]{0,240}(?:extension|alias|location|candidate)[\s\S]{0,180}(?:ambigu|fail)/i,
  valid:
    "On Windows, .ps1, .cmd, and .bat are native candidates; multiple extensions or candidates across aliases are ambiguous and fail.",
  drift: "On Windows, Arashi chooses the first available script.",
};

const inspection: Requirement = {
  label: "doctor and dry-run use the runtime candidate model without mutation",
  pattern:
    /(?:doctor[\s\S]{0,180}dry-run|dry-run[\s\S]{0,180}doctor)[\s\S]{0,220}(?:same|shared|runtime)[\s\S]{0,120}(?:candidate|resolver|discovery)[\s\S]{0,220}(?:without|never|non-mutating)[\s\S]{0,100}(?:mutation|execute|spawns?)/i,
  valid:
    "Doctor and dry-run use the same runtime candidate discovery and report selection or ambiguity without mutation or execution.",
  drift: "Doctor checks only inline configuration, and dry-run skips hook discovery.",
};

const topology: Requirement = {
  label: "configuration authority stores files while remove cwd stays active child",
  pattern:
    /(?:direct|bare|linked)[\s\S]{0,220}(?:configuration (?:authority|root)|config authority)[\s\S]{0,180}(?:stores?|storage|file)[\s\S]{0,220}(?:remove )?(?:cwd|working directory)[\s\S]{0,140}(?:active|target)[\s\S]{0,80}(?:child|checkout|repository)/i,
  valid:
    "Across direct, bare, and linked workspaces, configuration authority owns file storage while remove cwd remains the active target child checkout.",
  drift:
    "Across all workspace topologies, the active child stores and executes the canonical file.",
};

const onboarding: Requirement = {
  label: "file onboarding creates the qualified path and child-local files block duplicates",
  pattern:
    /(?:file mode|file onboarding|native file)[\s\S]{0,220}(?:creates?|writes?|scaffolds?)[\s\S]{0,180}\.arashi\/hooks\/<lifecycle>\.<repo><ext>[\s\S]{0,260}(?:child-local|<activeRepo>\/\.arashi\/hooks)[\s\S]{0,180}(?:block|prevent|ambigu|duplicate)/i,
  valid:
    "File onboarding creates .arashi/hooks/<lifecycle>.<repo><ext> at the configuration root; an existing child-local <activeRepo>/.arashi/hooks/<lifecycle><ext> blocks the duplicate.",
  drift:
    "File onboarding creates <activeRepo>/.arashi/hooks/<lifecycle><ext> in the child checkout.",
};

const deletion: Requirement = {
  label: "delete owns exact qualified remove files and templates only",
  pattern:
    /delete[\s\S]{0,180}(?:exact|only)[\s\S]{0,160}(?:pre-remove\.<repo><ext>|pre-remove\.<repository>)[\s\S]{0,160}(?:post-remove\.<repo><ext>|post-remove\.<repository>)[\s\S]{0,180}(?:templates?|\.example)[\s\S]{0,220}(?:preserv(?:e|es|ed|ing)|(?:(?:do|does|will|must) not|never) (?:remove|delete))[\s\S]{0,160}(?:lookalike|shared|user-global|child-local)/i,
  valid:
    "Delete owns only exact pre-remove.<repo><ext> and post-remove.<repo><ext> files and their .example templates; it preserves lookalikes, shared, user-global, and child-local hook policy outside clone ownership.",
  drift: "Delete removes every matching remove hook recursively.",
};

const pageRequirements = new Map<string, Requirement[]>([
  [
    "reference/hooks.md",
    [canonicalPath, aliasSlot, collision, identityAndCwd, order, windows, inspection, topology, onboarding, deletion],
  ],
  ["commands/remove.md", [canonicalPath, aliasSlot, collision, identityAndCwd, order, inspection]],
  ["reference/configuration.md", [canonicalPath, aliasSlot, collision, inspection]],
  ["commands/add.md", [canonicalPath, onboarding]],
  ["commands/configure.md", [canonicalPath, onboarding]],
  ["commands/delete.md", [deletion]],
]);

const llmsRequirements = [
  canonicalPath,
  aliasSlot,
  collision,
  identityAndCwd,
  order,
  windows,
  inspection,
  topology,
  onboarding,
  deletion,
];

const root = path.resolve(process.cwd());
runControlledDriftSelfTest(root);
const errors = checkRoot(root);
if (errors.length > 0) {
  console.error("Repository remove-hook documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Repository remove-hook documentation contract passed for ${pageRequirements.size} canonical pages, their generated Markdown routes, and both agent exports.`,
);

function checkRoot(rootPath: string): string[] {
  const found: string[] = [];
  for (const [relativePath, requirements] of pageRequirements) {
    checkFile(rootPath, `docs/${relativePath}`, requirements, found);
    checkFile(rootPath, `public/${relativePath}`, requirements, found);
  }
  checkFile(rootPath, "public/llms.txt", llmsRequirements, found);
  checkFile(rootPath, "public/llms-full.txt", llmsRequirements, found);
  return found;
}

function checkFile(
  rootPath: string,
  relativePath: string,
  requirements: Requirement[],
  found: string[],
): void {
  let content: string;
  try {
    content = readFileSync(path.join(rootPath, relativePath), "utf8");
  } catch {
    found.push(`${relativePath} is missing`);
    return;
  }
  const normalized = normalize(content);
  for (const requirement of requirements) {
    if (!requirement.pattern.test(normalized)) {
      found.push(`${relativePath} is missing ${requirement.label}`);
    }
  }
  checkContradictions(relativePath, normalized, found);
}

function checkContradictions(
  relativePath: string,
  content: string,
  found: string[],
): void {
  const statements = content.split(/(?<=[.!?])\s+/);
  for (const statement of statements) {
    const hasAliasContext = /(?:aliases?|repository(?:-| )slot|child-local|inline)/i.test(statement);
    const hasRepositoryAlias = /(?:qualified|workspace-owned|child-local|inline)/i.test(statement);
    if (
      hasAliasContext &&
      hasRepositoryAlias &&
      hasAffirmativeAction(statement, /\b(?:compose|run together|both execute)\b/gi)
    ) {
      found.push(`${relativePath} must not compose repository-slot aliases`);
    }
    if (
      hasAliasContext &&
      hasAffirmativeAliasSelection(statement)
    ) {
      found.push(`${relativePath} must not assign precedence among repository-slot aliases`);
    }
    if (hasAffirmativeLossOfChildLocalRemoveSupport(statement)) {
      found.push(`${relativePath} must preserve compatible child-local repository remove file support`);
    }
    if (hasDoctorInlineOnlyClaim(statement)) {
      found.push(`${relativePath} doctor must inspect inline and native repository remove candidates`);
    }
    if (hasRemoveDryRunDiscoverySkip(statement)) {
      found.push(`${relativePath} remove dry-run must use native candidate discovery`);
    }
    if (hasNegatedPreservationOfProtectedHooks(statement)) {
      found.push(`${relativePath} must preserve hooks outside exact delete ownership`);
    }
    if (hasAffirmativeDeletionOfProtectedHooks(statement)) {
      found.push(`${relativePath} must not broaden delete ownership to protected hooks`);
    }
    if (
      /(?:qualified|workspace-owned)[^.]{0,160}(?:workspace scope|runs? from (?:the )?configuration root|cwd is (?:the )?configuration root)/i.test(
        statement,
      )
    ) {
      found.push(`${relativePath} must keep qualified files repository-scoped with target cwd`);
    }
    if (
      /(?:add|configure|onboarding)[^.]{0,180}(?:creates?|writes?|scaffolds?)[^.]{0,120}<activeRepo>\/\.arashi\/hooks\/<lifecycle><ext>/i.test(
        statement,
      )
    ) {
      found.push(`${relativePath} must onboard repository remove files at the qualified configuration-root path`);
    }
  }
}

function hasAffirmativeAliasSelection(statement: string): boolean {
  return hasAffirmativeClauseAction(
    statement,
    /\b(?:takes? precedence|wins?|(?:is|are)\s+preferred over|falls? back to|(?:selects?|chooses?)[^.!?]{0,100}\bover)\b/gi,
  );
}

function hasAffirmativeLossOfChildLocalRemoveSupport(statement: string): boolean {
  const actions = [
    /\b(?:no longer supported|unsupported)\b/gi,
    /\b(?:drops?|removes?|ends?|discontinues?)\s+support\b/gi,
    /\b(?:dropped|removed|ended|discontinued)\b/gi,
  ];
  return actions.some((pattern) =>
    [...statement.matchAll(pattern)].some((match) => {
      if (match.index === undefined || isNegatedInClauseAt(statement, match.index)) return false;
      const clause = clauseAt(statement, match.index);
      return /\bcompatible\b/i.test(clause.text) &&
        /\bchild-local\b/i.test(clause.text) &&
        /\brepository\s+remove\s+(?:files?|hooks?)\b/i.test(clause.text) &&
        (/\bsupport\b/i.test(clause.text) || /\b(?:no longer supported|unsupported)\b/i.test(match[0]));
    }),
  );
}

function hasDoctorInlineOnlyClaim(statement: string): boolean {
  const active = [...statement.matchAll(
    /\b(?:checks?|inspects?|considers?|uses?)\s+only\s+(?:the\s+)?inline(?:\s+(?:configuration|config))?\b/gi,
  )].some((match) =>
    match.index !== undefined &&
    !isNegatedInClauseAt(statement, match.index) &&
    /\bdoctor\b/i.test(clauseAt(statement, match.index).text),
  );
  if (active) return true;

  return [...statement.matchAll(
    /\bonly\s+(?:the\s+)?inline(?:\s+(?:configuration|config))?[^.!?]{0,60}\b(?:is|are)\s+(?:checked|inspected|considered|used)\s+by\s+(?:the\s+)?doctor\b/gi,
  )].some(
    (match) => match.index !== undefined && !isNegatedInClauseAt(statement, match.index),
  );
}

function hasRemoveDryRunDiscoverySkip(statement: string): boolean {
  return [...statement.matchAll(/\b(?:skips?|omits?|bypasses?)\b/gi)].some((match) => {
    if (match.index === undefined || isNegatedInClauseAt(statement, match.index)) return false;
    const clause = clauseAt(statement, match.index);
    return /\bremove\s+(?:--)?dry-run\b/i.test(clause.text) &&
      /\bnative\s+(?:hook\s+)?candidate\s+discovery\b/i.test(clause.text);
  });
}

function hasAffirmativeClauseAction(statement: string, pattern: RegExp): boolean {
  return [...statement.matchAll(pattern)].some(
    (match) => match.index !== undefined && !isNegatedInClauseAt(statement, match.index),
  );
}

function isNegatedInClauseAt(statement: string, actionIndex: number): boolean {
  const clause = clauseAt(statement, actionIndex);
  const localActionIndex = actionIndex - clause.start;
  return /(?:\bnever\b|\bnone\b|\bno\b|\bnot\b|\b(?:do|does|will|can|may|must|should)\s+not\b|\b(?:don't|doesn't|won't|can't|mayn't|mustn't|shouldn't|don’t|doesn’t|won’t|can’t|mayn’t|mustn’t|shouldn’t)\b)[^.!?]{0,80}$/i.test(
    clause.text.slice(0, localActionIndex),
  );
}

function clauseAt(statement: string, index: number): { start: number; text: string } {
  const boundaries = [
    ...statement.matchAll(/[.;:!?]|\b(?:but|except|however|yet|unless|although|whereas)\b/gi),
  ];
  const before = boundaries.filter((boundary) => (boundary.index ?? -1) < index).at(-1);
  const after = boundaries.find((boundary) => (boundary.index ?? statement.length) > index);
  const start = (before?.index ?? -1) + (before?.[0].length ?? 1);
  const end = after?.index ?? statement.length;
  return { start, text: statement.slice(start, end) };
}

function hasAffirmativeAction(statement: string, pattern: RegExp): boolean {
  return [...statement.matchAll(pattern)].some(
    (match) => match.index !== undefined && !isNegatedAt(statement, match.index),
  );
}

function isNegatedAt(statement: string, actionIndex: number): boolean {
  const prefix = statement.slice(0, actionIndex);
  const boundaries = [
    ...prefix.matchAll(/[,;:]|\b(?:and|or|but|except|however|yet|unless)\b/gi),
  ];
  const boundary = boundaries.at(-1);
  const clausePrefix = prefix.slice((boundary?.index ?? -1) + (boundary?.[0].length ?? 1));
  return /(?:\bnever\b|\bnone\b|\bno\b|\bnot\b|\b(?:do|does|will|can|may|must|should)\s+not\b|\b(?:don't|doesn't|won't|can't|mayn't|mustn't|shouldn't|don’t|doesn’t|won’t|can’t|mayn’t|mustn’t|shouldn’t)\b)[^.!?]{0,48}$/i.test(
    clausePrefix,
  );
}

function hasNegatedPreservationOfProtectedHooks(statement: string): boolean {
  return [...statement.matchAll(/\bpreserv(?:e|es|ed|ing)\b/gi)].some((match) => {
    if (match.index === undefined || !isNegatedAt(statement, match.index)) return false;
    return /\b(?:lookalikes?|shared|user-global|child-local)\b/i.test(
      statement.slice(match.index + match[0].length, match.index + match[0].length + 180),
    );
  });
}

function hasAffirmativeDeletionOfProtectedHooks(statement: string): boolean {
  const active = [
    ...statement.matchAll(/\b(?:deletes|removes|(?:will|may|can|must)\s+(?:delete|remove))\b/gi),
  ].some((match) => {
    if (match.index === undefined || isNegatedAt(statement, match.index)) return false;
    return /\b(?:lookalikes?|shared|user-global|child-local)\b/i.test(
      statement.slice(match.index + match[0].length, match.index + match[0].length + 180),
    );
  });
  if (active) return true;

  return [...statement.matchAll(/\b(?:deleted|removed)\b/gi)].some((match) => {
    if (match.index === undefined || isNegatedAt(statement, match.index)) return false;
    return /\b(?:lookalikes?|shared|user-global|child-local)\b/i.test(
      statement.slice(Math.max(0, match.index - 180), match.index),
    );
  });
}

function normalize(content: string): string {
  return content.replaceAll("`", "").replace(/\\/g, "/").replace(/\s+/g, " ");
}

function runControlledDriftSelfTest(rootPath: string): void {
  for (const requirement of llmsRequirements) {
    const valid = normalize(requirement.valid);
    const drift = normalize(requirement.drift);
    assert.match(valid, requirement.pattern, `valid fixture failed: ${requirement.label}`);
    assert.doesNotMatch(drift, requirement.pattern, `controlled drift was accepted: ${requirement.label}`);
  }

  const hooksSurface = normalize(readFileSync(path.join(rootPath, "docs/reference/hooks.md"), "utf8"));
  const baselineErrors: string[] = [];
  checkContradictions("fixture.md", hooksSurface, baselineErrors);
  assert.deepEqual(baselineErrors, [], "truthful maintained surface produced contradictions");
  const contradictions = [
    "Workspace-owned and child-local aliases both execute together.",
    "The workspace-owned file takes precedence over the child-local file.",
    `${hooksSurface} Aliases never compose and have no precedence, except the workspace-owned file wins under --force.`,
    `${hooksSurface} The workspace-owned alias does not take precedence over the child-local alias, but wins under --force.`,
    "The qualified workspace-owned file has workspace scope and runs from the configuration root.",
    "Configure creates <activeRepo>/.arashi/hooks/<lifecycle><ext> for repository file onboarding.",
    `${hooksSurface} Delete owns only exact pre-remove.<repo><ext> and post-remove.<repo><ext> files and their .example templates; it does not preserve lookalikes, shared, user-global, or child-local hook policy outside clone ownership.`,
    `${hooksSurface} Delete removes child-local remove hooks outside clone ownership.`,
    `${hooksSurface} Child-local remove hooks outside clone ownership are deleted during cleanup.`,
    `${hooksSurface} Compatible child-local repository remove files are no longer supported.`,
    `${hooksSurface} When repository-slot aliases collide under --force, Arashi chooses the workspace-owned file over the child-local file.`,
    `${hooksSurface} With repository-slot aliases in contention, --force selects the child-local file over the workspace-owned file.`,
    `${hooksSurface} Doctor checks only inline configuration for repository remove hooks.`,
    `${hooksSurface} Remove dry-run skips native candidate discovery.`,
  ];
  const contradictionErrors: string[] = [];
  for (const claim of contradictions) {
    const claimErrors: string[] = [];
    checkContradictions("fixture.md", claim, claimErrors);
    if (claimErrors.length !== 1) {
      contradictionErrors.push(claim.slice(hooksSurface.length).trim() || claim);
    }
  }
  assert.deepEqual(contradictionErrors, [], "controlled contradiction fixture was accepted or overcounted");

  const truthful = [
    "The workspace-owned and child-local aliases never compose.",
    "The workspace-owned alias does not take precedence over the child-local alias.",
    `${hooksSurface} Under --force, ambiguity still fails before hook execution or removal mutation.`,
    `${hooksSurface} The workspace-owned alias does not take precedence over the child-local alias and never wins under --force.`,
    "The qualified file has repository scope and runs from the active target checkout.",
    "Configure creates .arashi/hooks/<lifecycle>.<repo><ext> under the configuration root.",
    deletion.valid,
    `${hooksSurface} Delete does not remove lookalikes or shared, user-global, or child-local hook policy outside clone ownership.`,
    `${hooksSurface} Delete never deletes child-local hooks outside the selected clone's ordinary ownership.`,
    `${hooksSurface} Child-local remove hooks outside clone ownership are not deleted during cleanup.`,
    `${hooksSurface} Compatible child-local repository remove files remain supported.`,
    `${hooksSurface} Support for compatible child-local repository remove files is not removed.`,
    `${hooksSurface} Repository-slot aliases do not select or choose one file over another under --force.`,
    `${hooksSurface} Doctor does not check only inline configuration; it also discovers native repository remove candidates.`,
    `${hooksSurface} Remove dry-run does not skip native candidate discovery.`,
  ];
  const truthfulErrors: string[] = [];
  for (const claim of truthful) checkContradictions("fixture.md", claim, truthfulErrors);
  assert.deepEqual(truthfulErrors, []);
}
