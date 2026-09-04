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
    /delete[\s\S]{0,180}(?:exact|only)[\s\S]{0,160}(?:pre-remove\.<repo><ext>|pre-remove\.<repository>)[\s\S]{0,160}(?:post-remove\.<repo><ext>|post-remove\.<repository>)[\s\S]{0,180}(?:templates?|\.example)[\s\S]{0,220}(?:preserv|never|not)[\s\S]{0,160}(?:lookalike|shared|user-global|child-local)/i,
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
runControlledDriftSelfTest();
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
  const normalized = content.replaceAll("`", "").replace(/\\/g, "/").replace(/\s+/g, " ");
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
    const composition =
      /(?:qualified|workspace-owned|child-local|inline)[\s\S]{0,220}\b(compose|run together|both execute)\b/i.exec(
        statement,
      );
    if (composition?.index !== undefined && !isNegated(statement, composition)) {
      found.push(`${relativePath} must not compose repository-slot aliases`);
    }
    const precedence =
      /(?:qualified|workspace-owned)[\s\S]{0,220}\b(takes precedence|wins|preferred over|falls back to)\b[\s\S]{0,120}(?:child-local|inline)/i.exec(
        statement,
      );
    if (precedence?.index !== undefined && !isNegated(statement, precedence)) {
      found.push(`${relativePath} must not assign precedence among repository-slot aliases`);
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

function isNegated(statement: string, match: RegExpExecArray): boolean {
  const action = match[1] ?? match[0];
  const actionIndex = match.index + match[0].toLowerCase().lastIndexOf(action.toLowerCase());
  const prefix = statement.slice(Math.max(0, actionIndex - 48), actionIndex);
  return /(?:\bnever|\bnone|\bno|\bnot|\b(?:do|does|will|can|may|must|should)\s+not)\b[^,;:.]{0,32}$/i.test(
    prefix,
  );
}

function runControlledDriftSelfTest(): void {
  for (const requirement of llmsRequirements) {
    const valid = requirement.valid.replaceAll("`", "").replace(/\\/g, "/").replace(/\s+/g, " ");
    const drift = requirement.drift.replaceAll("`", "").replace(/\\/g, "/").replace(/\s+/g, " ");
    assert.match(valid, requirement.pattern, `valid fixture failed: ${requirement.label}`);
    assert.doesNotMatch(drift, requirement.pattern, `controlled drift was accepted: ${requirement.label}`);
  }

  const contradictions = [
    "Workspace-owned and child-local aliases both execute together.",
    "The workspace-owned file takes precedence over the child-local file.",
    "The qualified workspace-owned file has workspace scope and runs from the configuration root.",
    "Configure creates <activeRepo>/.arashi/hooks/<lifecycle><ext> for repository file onboarding.",
  ];
  const contradictionErrors: string[] = [];
  for (const claim of contradictions) {
    checkContradictions("fixture.md", claim, contradictionErrors);
  }
  assert.equal(contradictionErrors.length, contradictions.length);

  const truthful = [
    "The workspace-owned and child-local aliases never compose.",
    "The workspace-owned alias does not take precedence over the child-local alias.",
    "The qualified file has repository scope and runs from the active target checkout.",
    "Configure creates .arashi/hooks/<lifecycle>.<repo><ext> under the configuration root.",
  ];
  const truthfulErrors: string[] = [];
  for (const claim of truthful) checkContradictions("fixture.md", claim, truthfulErrors);
  assert.deepEqual(truthfulErrors, []);
}
