import { readFileSync } from "node:fs";
import path from "node:path";

const rootPath = process.cwd();
const requirements = new Map<string, string[]>([
  [
    "docs/commands/create.md",
    [
      "`--base <branch>`",
      "`--repo-base <repository=branch>`",
      "`@meta`",
      "repository CLI > invocation CLI > repository config > workspace config",
      "local branch first, then `origin/<branch>`",
      "selected repository set",
      "before hooks or any workspace mutation",
      "all repository resolution errors",
      "captured commit OID",
      "`REUSE_EXISTING`",
      "does not reset, rebase, recreate, or otherwise change its ancestry",
      "Human `--dry-run` output",
      "legacy-omitted entries omit resolved ref/OID fields",
      "`CREATE_BASE_RESOLUTION_FAILED`",
      "`repository-cli`",
      "`workspace-config`",
      "`data.base.repositories`",
      "`repositoryName`",
      "`repositoryPath`",
      "`requestedBranch`",
      "`resolvedRef`",
      "`resolvedOid`",
      "`targetAction` (`created` or `reused`)",
      "`error.details.repositories`",
      "`attemptedRefs`",
      "`refs/heads/<normalized>`",
      "`refs/remotes/origin/<normalized>`",
      "`BASE_BRANCH_POLICY_INVALID`",
    ],
  ],
  [
    "docs/reference/configuration.md",
    [
      '"baseBranch": "main"',
      '"meta": {',
      "`meta.baseBranch`",
      "`repos.<name>.baseBranch`",
      "`--base` and `--repo-base`",
    ],
  ],
  [
    "docs/commands/clone.md",
    [
      "`--base <branch>`",
      "`--repo-base <repository=branch>`",
      "repeatable",
      "`@meta` is invalid for `clone`",
      "remote default branch",
      "tracking `origin/<base>`",
      "coordinated target branch",
      "created from the effective base",
      "not the base branch",
      "before managed-ignore or filesystem mutation",
      "every affected selected child",
      "`repository-cli`",
      "`legacy-omitted`",
      "`data.base`",
      "`repositoryName`",
      "`requestedBranch`",
      "`data.base` is absent",
      "`CLONE_BASE_PREFLIGHT_FAILED`",
      "`gitUrl`",
      "`error.details.repositories`",
      "`BASE_BRANCH_POLICY_INVALID`",
    ],
  ],
  [
    "docs/commands/status.md",
    [
      "current-upstream, configured-base, and detected remote-default relationships independently",
      "root `baseBranch` applies as the fallback",
      "human output combines the line while JSON preserves both roles",
      "Standalone status has no persisted configured-base policy and remains unchanged",
    ],
  ],
  [
    "docs/commands/pull.md",
    [
      "refreshed configured remote base into its current branch",
      "does not silently substitute the current upstream or remote default",
      "no effective base is configured, pull preserves its current-upstream behavior",
      "reloads configuration before later child base resolution",
    ],
  ],
  [
    "docs/commands/push.md",
    [
      "refreshed configured base as the publishability baseline only when the current branch has no upstream",
      "destination remains the current branch on the selected remote",
      "fails planning rather than silently falling back to the remote default",
      "Dry-run never updates remote branches, but it may fetch a configured base",
    ],
  ],
  [
    "docs/commands/handoff.md",
    [
      "configured-base lag/unavailability",
      "preserve upstream, configured-base, and remote-default relationships",
      "Markdown uses one combined diagnostic while JSON retains both role records",
      "Standalone handoff remains unchanged",
    ],
  ],
  [
    "docs/commands/doctor.md",
    [
      "`REPOSITORY_CONFIGURED_BASE_BEHIND`",
      "`REPOSITORY_CONFIGURED_BASE_UNAVAILABLE`",
      "Structured details retain the configured source, logical branch, selected remote/ref",
      "instead of duplicating a default-branch diagnostic",
      "Standalone doctor remains unchanged",
    ],
  ],

  [
    "public/commands/create.md",
    [
      "`--repo-base <repository=branch>`",
      "repository CLI > invocation CLI > repository config > workspace config",
      "`CREATE_BASE_RESOLUTION_FAILED`",
      "`data.base.repositories`",
      "`repositoryName`",
      "`resolvedOid`",
      "`targetAction` (`created` or `reused`)",
      "`attemptedRefs`",
    ],
  ],
  [
    "public/reference/configuration.md",
    ["`meta.baseBranch`", "`repos.<name>.baseBranch`"],
  ],
  [
    "public/commands/clone.md",
    [
      "`--repo-base <repository=branch>`",
      "coordinated target branch",
      "not the base branch",
      "`data.base`",
      "`data.base` is absent",
      "`repositoryName`",
      "`CLONE_BASE_PREFLIGHT_FAILED`",
      "`gitUrl`",
    ],
  ],
  [
    "public/commands/status.md",
    [
      "current-upstream, configured-base, and detected remote-default relationships independently",
      "human output combines the line while JSON preserves both roles",
    ],
  ],
  [
    "public/commands/pull.md",
    [
      "refreshed configured remote base into its current branch",
      "no effective base is configured, pull preserves its current-upstream behavior",
    ],
  ],
  [
    "public/commands/push.md",
    [
      "publishability baseline only when the current branch has no upstream",
      "Dry-run never updates remote branches, but it may fetch a configured base",
    ],
  ],
  [
    "public/commands/handoff.md",
    [
      "preserve upstream, configured-base, and remote-default relationships",
      "JSON retains both role records",
    ],
  ],
  [
    "public/commands/doctor.md",
    ["`REPOSITORY_CONFIGURED_BASE_BEHIND`", "`REPOSITORY_CONFIGURED_BASE_UNAVAILABLE`"],
  ],

  [
    "public/llms.txt",
    [
      "shared configured base policy",
      "root `baseBranch`",
      "`meta.baseBranch`",
      "`repos.<name>.baseBranch`",
      "repeatable `--repo-base <repository=branch>`",
      "`@meta` selects the configured meta repository rather than a child",
      "repository CLI > invocation CLI > repository config > workspace config",
      "removed `defaults.create.baseBranch` property fails validation",
      "Status preserves upstream and remote-default roles",
      "coordinated target branch",
      "`aw create <target> --base <branch>`",
      "Standalone create base selection is CLI-only and invocation-only",
      "rejects `--repo-base`",
      "Dry-run reports every selected repository and adds resolved bases/actions only when a base applies",
      "Create JSON success entries are at `data.base.repositories`",
      "clone policy records are at `data.base`",
      "Create resolution failures include attempted refs; clone preflight failures include `gitUrl` and reason",
      "`REUSE_EXISTING` does not repair or validate ancestry",
      "Create command Markdown",
    ],
  ],
  [
    "scripts/generate-agent-exports.ts",
    [
      "shared configured base policy",
      "root \\`baseBranch\\`",
      "\\`meta.baseBranch\\`",
      "\\`repos.<name>.baseBranch\\`",
      "repeatable \\`--repo-base <repository=branch>\\`",
      "\\`@meta\\` selects the configured meta repository rather than a child",
      "repository CLI > invocation CLI > repository config > workspace config",
      "removed \\`defaults.create.baseBranch\\` property fails validation",
      "Status preserves upstream and remote-default roles",
      "coordinated target branch",
      "Standalone create base selection is CLI-only and invocation-only",
      "rejects \\`--repo-base\\`",
      "Dry-run reports every selected repository and adds resolved bases/actions only when a base applies",
      "success entries are at \\`data.base.repositories\\`",
      "Create resolution failures include attempted refs; clone preflight failures include \\`gitUrl\\` and reason",
      "\\`REUSE_EXISTING\\` does not repair or validate ancestry",
    ],
  ],
  [
    "public/llms-full.txt",
    [
      "Source: https://arashi.haphazard.dev/commands/create/",
      "Source: https://arashi.haphazard.dev/commands/clone/",
      "Source: https://arashi.haphazard.dev/reference/configuration/",
      "Source: https://arashi.haphazard.dev/getting-started/standalone/",

      "`meta.baseBranch`",
      "`repos.<name>.baseBranch`",
      "`--repo-base <repository=branch>`",
      "coordinated target branch",
      "`CREATE_BASE_RESOLUTION_FAILED`",
      "`repositoryName`",
      "`repositoryPath`",
      "`requestedBranch`",
      "`resolvedOid`",
      "`targetAction`",
      "`data.base.repositories`",
      "`data.base`",
      "`error.details.repositories`",
      "`attemptedRefs`",
      "`CLONE_BASE_PREFLIGHT_FAILED`",
    ],
  ],
]);

const errors = checkRoot(rootPath);
runContradictionSelfTest();
runReachabilitySelfTest();

if (errors.length > 0) {
  console.error("Create-base documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Create-base documentation contract passed for ${requirements.size} canonical and generated surfaces.`,
);

function checkRoot(root: string): string[] {
  const found: string[] = [];
  for (const [relativePath, expectedText] of requirements) {
    const content = read(root, relativePath, found);
    if (content === null) continue;
    for (const text of expectedText) {
      if (!content.includes(text)) {
        found.push(`${relativePath} is missing ${JSON.stringify(text)}`);
      }
    }
    checkContradictions(relativePath, content, found);
  }

  checkReachability(root, found);
  return found;
}

function checkContradictions(
  relativePath: string,
  content: string,
  found: string[],
): void {
  const statements = content.split(/(?<=[.!?])\s+|\n+/);
  for (const statement of statements) {
    const clauses = statement.split(
      /\s*(?:;|\bbut\b|\bhowever\b|\bwhile\b|\byet\b|\balthough\b|\bthough\b|\bwhereas\b|\bnevertheless\b|\bnonetheless\b)\s*/i,
    );
    for (const clause of clauses) {
      const fallbackAction = /\b(?:falls?\s+back|fallback|uses?|tries?|checks?|resolves?\s+from)\b/i.exec(
        clause,
      );

      if (
        fallbackAction?.index !== undefined &&
        !actionIsNegated(clause, fallbackAction.index) &&
        clauseHasScope(statement, clause, /\b(?:base|base resolution|resolution)\b/i) &&
        (/\bfalls? back\b|\bfallback\b/i.test(clause) ||
          /(?:local|origin)[^.\n]{0,60}(?:missing|unavailable|fails?|not found)[^.\n]{0,100}(?:uses?|tries?|checks?|resolves? from)/i.test(
            clause,
          )) &&
        /\b(?:default|current|HEAD|another|other|upstream)\b/i.test(clause)
      ) {
        found.push(
          `${relativePath} must not advertise base fallback beyond the local/origin pair`,
        );
      }

      if (
        !precedenceActionIsNegated(clause) &&
        (/(?:configuration|config)[^.\n]{0,80}(?:overrides?|beats?|wins? over|takes? precedence over|is preferred (?:to|over)|comes? before)[^.\n]{0,40}(?:--base|\bCLI\b)/i.test(
          clause,
        ) ||
          /(?:--base|\bCLI\b)[^.\n]{0,50}(?:is|are)\s+(?:overridden|beaten|superseded)\s+by[^.\n]{0,40}(?:configuration|config)/i.test(
            clause,
          ))
      ) {
        found.push(`${relativePath} must not give configuration precedence over CLI`);
      }

      const standaloneAction = /\b(?:reads?|loads?|persists?|stores?|writes?|defaults?\s+to)\b/i.exec(
        clause,
      );
      if (
        standaloneAction?.index !== undefined &&
        !actionIsNegated(clause, standaloneAction.index) &&
        clauseHasScope(statement, clause, /\bstandalone\b/i) &&
        /\b(?:reads?|loads?|persists?|stores?|writes?|defaults? to)\b/i.test(clause) &&
        /(?:defaults\.create\.baseBranch|\bbaseBranch\b)/i.test(clause)
      ) {
        found.push(
          `${relativePath} must not advertise standalone base configuration loading or persistence`,
        );
      }

      const reuseAction = /\b(?:resets?|rebases?|recreates?|rewrites?|changes?|moves?|points?)\b/i.exec(
        clause,
      );
      if (
        reuseAction?.index !== undefined &&
        !actionIsNegated(clause, reuseAction.index) &&
        clauseHasScope(
          statement,
          clause,
          /(?:REUSE_EXISTING|reused? targets?)/i,
        ) &&
        /\b(?:resets?|rebases?|recreates?|rewrites?|changes?|moves?|points?)\b/i.test(clause) &&
        /\b(?:ancestry|branch|target|commit|history)\b/i.test(clause)
      ) {
        found.push(
          `${relativePath} must not advertise ancestry rewriting for reused targets`,
        );
      }

      const orderingAction = /\b(?:re-?sorted|sorted|listed|reported|alphabetic(?:al|ally)?)\b/i.exec(
        clause,
      );
      if (
        orderingAction?.index !== undefined &&
        !actionIsNegated(clause, orderingAction.index) &&
        clauseHasScope(
          statement,
          clause,
          /\b(?:create-base|success|successful|repositories?|failures?)\b/i,
        ) &&
        /\b(?:alphabetic(?:al|ally)?|lexic(?:al|ographic)(?:ally)?|sorted by (?:name|path))\b/i.test(
          clause,
        )
      ) {
        found.push(
          `${relativePath} must not advertise lexical or alphabetical create-base result ordering`,
        );
      }

      const pathAction = /\b(?:relative|noncanonical|non-canonical|lexical|symlink(?:ed)?|alias)\b/i.exec(
        clause,
      );
      if (
        pathAction?.index !== undefined &&
        !actionIsNegated(clause, pathAction.index) &&
        /\brepositoryPath\b/i.test(statement) &&
        (/\b(?:relative|noncanonical|non-canonical|lexical|symlink(?:ed)?|alias)\s+(?:repository\s+)?path\b/i.test(
          clause,
        ) ||
          /\b(?:preserves?|uses?|returns?|reports?|may be|can be)\b[^.\n]{0,60}\b(?:relative|noncanonical|non-canonical|lexical|symlink(?:ed)?|alias)\b/i.test(
            clause,
          ))
      ) {
        found.push(
          `${relativePath} must require canonical absolute repositoryPath values`,
        );
      }

      const legacyCloneIndex = clause.search(/\bclone\b/i);
      const legacyCloneActions = [
        ...clause.matchAll(/\b(?:apply|applies|uses?|controls?|shared)\b/gi),
      ];
      const legacyCloneAction = legacyCloneActions
        .filter((match) => match.index !== undefined)
        .sort(
          (left, right) =>
            Math.abs(left.index! - legacyCloneIndex) -
            Math.abs(right.index! - legacyCloneIndex),
        )[0];
      const legacyCloneExcluded =
        legacyCloneAction?.index !== undefined &&
        (actionIsNegated(clause, legacyCloneAction.index) ||
          legacyCloneIsExcludedByAction(
            clause,
            legacyCloneIndex,
            legacyCloneAction,
          ));
      if (
        legacyCloneIndex >= 0 &&
        legacyCloneAction?.index !== undefined &&
        !legacyCloneExcluded &&
        /defaults\.create\.baseBranch/i.test(statement)
      ) {
        found.push(
          `${relativePath} must keep the legacy create key from affecting clone`,
        );
      }

      const legacyCreateAction =
        /\b(?:appl(?:y|ies)|controls?|configures?|uses?|accepts?|supports?|reads?|honors?|ignores?|skips?|bypasses?)\b/gi;
      const legacyCreateKeyIndex = clause.search(/defaults\.create\.baseBranch/i);
      const governingLegacyCreateAction = [...clause.matchAll(legacyCreateAction)]
        .filter((match) => match.index !== undefined)
        .sort(
          (left, right) =>
            Math.abs(left.index! - legacyCreateKeyIndex) -
            Math.abs(right.index! - legacyCreateKeyIndex),
        )[0];
      if (
        legacyCreateKeyIndex >= 0 &&
        governingLegacyCreateAction?.index !== undefined &&
        !actionIsNegated(clause, governingLegacyCreateAction.index) &&
        /(?<!\.)\b(?:create|clone|status|pull|push|handoff|doctor|configured commands?)\b/i.test(
          clause,
        )
      ) {
        found.push(
          `${relativePath} must not advertise the removed legacy key as active create configuration`,
        );
      }

      const repositoryOverrideIndex = clause.search(/--repo-base/i);
      const repositoryOverrideActions = [
        ...clause.matchAll(
          /\b(?:accepts?|supports?|allows?|uses?|rejects?|disallows?|forbids?)\b/gi,
        ),
      ];
      const standaloneRepositoryOverrideAction = repositoryOverrideActions
        .filter((match) => match.index !== undefined)
        .sort(
          (left, right) =>
            Math.abs(left.index! - repositoryOverrideIndex) -
            Math.abs(right.index! - repositoryOverrideIndex),
        )[0];
      const repositoryOverrideActionRejects =
        standaloneRepositoryOverrideAction &&
        /^(?:rejects?|disallows?|forbids?)$/i.test(
          standaloneRepositoryOverrideAction[0],
        );
      if (
        repositoryOverrideIndex >= 0 &&
        standaloneRepositoryOverrideAction?.index !== undefined &&
        !repositoryOverrideActionRejects &&
        !actionIsNegated(clause, standaloneRepositoryOverrideAction.index) &&
        clauseHasScope(statement, clause, /\bstandalone\b/i)
      ) {
        found.push(
          `${relativePath} must reject repository-specific overrides in standalone mode`,
        );
      }

      const coordinatedCloneAction =
        /\b(?:checks? out|leaves?|materializes?)\b/i.exec(clause);
      const coordinatedBranchObjects = [
        ...clause.matchAll(/\b(?:(?:effective )?base|target) branch\b/gi),
      ];
      const coordinatedCloneObject = coordinatedBranchObjects
        .filter(
          (match) =>
            match.index !== undefined &&
            coordinatedCloneAction?.index !== undefined &&
            match.index >= coordinatedCloneAction.index,
        )
        .sort((left, right) => left.index! - right.index!)[0];
      if (
        coordinatedCloneAction?.index !== undefined &&
        coordinatedCloneObject?.index !== undefined &&
        /\b(?:effective )?base branch\b/i.test(coordinatedCloneObject[0]) &&
        !actionIsNegated(clause, coordinatedCloneAction.index) &&
        clauseHasScope(statement, clause, /\bcoordinated\b/i) &&
        /\bclone\b/i.test(statement)
      ) {
        found.push(
          `${relativePath} must keep coordinated clone checked out on its target branch`,
        );
      }

    }

    const invertedPrecedence =
      /(?:--base|invocation(?:-wide)? CLI)\s+\b(?:overrides?|beats?|wins? over|takes? precedence over)\b\s+(?:the\s+)?(?:--repo-base|repository CLI)/i.exec(
        statement,
      );
    const invertedPrecedenceAction = invertedPrecedence?.[0].search(
      /\b(?:overrides?|beats?|wins? over|takes? precedence over)\b/i,
    );
    const invertedPrecedenceSubjectIsNegated =
      invertedPrecedence?.index !== undefined &&
      invertedPrecedenceAction !== undefined &&
      invertedPrecedenceAction >= 0 &&
      /\b(?:(?:(?:do|does|did|must|should|can|could|will|would)\s+not|never|cannot|can't)\s+let)\b[^.!?]{0,64}$/i.test(
        statement.slice(
          Math.max(
            0,
            invertedPrecedence.index + invertedPrecedenceAction - 80,
          ),
          invertedPrecedence.index + invertedPrecedenceAction,
        ),
      );
    if (
      invertedPrecedence?.index !== undefined &&
      invertedPrecedenceAction !== undefined &&
      invertedPrecedenceAction >= 0 &&
      !invertedPrecedenceSubjectIsNegated &&
      !actionIsNegated(
        statement,
        invertedPrecedence.index + invertedPrecedenceAction,
      )
    ) {
      found.push(
        `${relativePath} must give repository CLI precedence over invocation CLI`,
      );
    }

    if (
      /\bfailures?\b/i.test(statement) &&
      (hasAffirmativeInclusion(statement, /\bunaffected\b/i) ||
        hasNegatedAffectedOnlyInclusion(statement) ||
        hasAffirmativeInclusion(
          statement,
          /\b(?:all|every)\s+(?:effective\s+)?selected repositor(?:y|ies)\b/i,
        ))
    ) {
      found.push(
        `${relativePath} must limit create-base failures to affected repositories`,
      );
    }
  }

  for (const statement of statements) {
    if (hasAffirmativeBaseBranchClaim(statement)) {
      found.push(
        `${relativePath} must not advertise ARASHI_BASE_BRANCH as a hook or environment variable`,
      );
    }
  }
}

function hasAffirmativeBaseBranchClaim(statement: string): boolean {
  if (/ARASHI_BASE_BRANCH\s*=/.test(statement)) return true;

  const actionPattern =
    /\b(?:exports?|provides?|receives?|sets?|exposes?|includes?|available)\b/gi;
  for (const action of statement.matchAll(actionPattern)) {
    const actionIndex = action.index;
    if (actionIndex === undefined || actionIsNegated(statement, actionIndex)) continue;

    const claim = statement.slice(
      Math.max(0, actionIndex - 40),
      actionIndex + action[0].length + 40,
    );
    if (/`?ARASHI_BASE_BRANCH\b/i.test(claim)) return true;
  }

  return false;
}

function hasNegatedAffectedOnlyInclusion(statement: string): boolean {
  const affected = "affected repositor(?:y|ies)";
  const action =
    "(?:include[sd]?|contain[sd]?|list(?:s|ed)?|report(?:s|ed)?)";
  const auxiliary =
    "(?:do|does|did|will|would|must|should|can|could|is|are|was|were|be|being)";

  const negatedActionBeforeQuantifier = new RegExp(
    `\\b${auxiliary}\\s+not\\s+${action}\\s+(?:the\\s+)?only\\s+${affected}\\b`,
    "i",
  );
  const negatedOnlyPredicate = new RegExp(
    `\\b${affected}\\s+(?:is|are|was|were)\\s+not\\s+(?:the\\s+)?only\\s+repositor(?:y|ies)\\s+${action}\\b`,
    "i",
  );

  return (
    negatedActionBeforeQuantifier.test(statement) ||
    negatedOnlyPredicate.test(statement)
  );
}

function hasAffirmativeInclusion(statement: string, target: RegExp): boolean {
  const actionPattern =
    /\b(?:includes?|contains?|lists?|reports?|included|contained|listed|reported)\b/gi;
  const actions = [...statement.matchAll(actionPattern)];
  const targets = [...statement.matchAll(new RegExp(target.source, "gi"))];

  for (const action of actions) {
    const actionIndex = action.index;
    if (actionIndex === undefined || actionIsNegated(statement, actionIndex)) continue;

    for (const match of targets) {
      const targetIndex = match.index;
      if (targetIndex === undefined || Math.abs(targetIndex - actionIndex) > 100) continue;

      const lower = Math.min(actionIndex, targetIndex);
      const upper = Math.max(actionIndex, targetIndex);
      const interveningAction = actions.some(
        (candidate) =>
          candidate.index !== undefined &&
          candidate.index > lower &&
          candidate.index < upper,
      );
      if (!interveningAction) return true;
    }
  }

  return false;
}

function legacyCloneIsExcludedByAction(
  clause: string,
  cloneIndex: number,
  action: RegExpMatchArray,
): boolean {
  if (action.index === undefined || action.index >= cloneIndex) return false;
  const actionToClone = clause.slice(
    action.index + action[0].length,
    cloneIndex,
  );
  return /^\s+only\s+to\s+create\s*,?\s*not\s+(?:to\s+)?$/i.test(
    actionToClone,
  );
}

function actionIsNegated(statement: string, actionIndex: number): boolean {
  const prefix = statement.slice(Math.max(0, actionIndex - 40), actionIndex);
  return /\b(?:no|not|never|cannot|can't|(?:do|does|did|will|would|must|should|can|could|is|are|was|were|be|being)\s+not)\s+(?:an?\s+|the\s+)?$/i.test(
    prefix,
  );
}

function precedenceActionIsNegated(clause: string): boolean {
  const action = /\b(?:overrides?|beats?|wins?|takes?|preferred|comes?|overridden|beaten|superseded)\b/i.exec(
    clause,
  );
  return action?.index !== undefined && actionIsNegated(clause, action.index);
}

function clauseHasScope(
  statement: string,
  clause: string,
  scope: RegExp,
): boolean {
  if (scope.test(clause)) return true;
  return (
    scope.test(statement) && /^\s*,?\s*(?:it|this|that)\b/i.test(clause)
  );
}

function checkReachability(root: string, found: string[]): void {
  const packageJson = parseJson(root, "package.json", found);
  const focusedCommand =
    "pnpm sync:content && node scripts/check-create-base-docs.ts";
  if (packageJson !== null) {
    if (packageJson.scripts?.["validate:create-base-docs"] !== focusedCommand) {
      found.push("package.json must define validate:create-base-docs");
    }
    if (!packageJson.scripts?.validate?.includes("pnpm validate:semantic-docs")) {
      found.push("package.json validate must run validate:semantic-docs");
    }
  }

  const registry = parseJson(root, "scripts/semantic-doc-checks.json", found);
  if (!Array.isArray(registry) || !registry.includes("check-create-base-docs.ts")) {
    found.push(
      "scripts/semantic-doc-checks.json must register check-create-base-docs.ts",
    );
  }

  const workflow = read(root, ".github/workflows/docs-validate.yml", found);
  if (
    workflow !== null &&
    !/^\s*run:\s*pnpm validate\s*$/m.test(workflow)
  ) {
    found.push("docs-validate workflow must execute the stable validate aggregate");
  }
}

function runContradictionSelfTest(): void {
  const cases: Array<[string, string]> = [
    [
      "If origin is missing, base resolution falls back to the default branch.",
      "fallback beyond the local/origin pair",
    ],
    [
      "When local and origin are missing, base resolution uses the default branch.",
      "fallback beyond the local/origin pair",
    ],
    [
      "Configuration overrides CLI --base.",
      "configuration precedence over CLI",
    ],
    [
      "Configuration does not override CLI --base, yet configuration overrides CLI --base.",
      "configuration precedence over CLI",
    ],
    [
      "Standalone does not load defaults.create.baseBranch, although it loads defaults.create.baseBranch.",
      "standalone base configuration loading or persistence",
    ],
    [
      "Configuration is preferred over CLI --base.",
      "configuration precedence over CLI",
    ],
    [
      "Standalone loads defaults.create.baseBranch for every create.",
      "standalone base configuration loading or persistence",
    ],
    [
      "REUSE_EXISTING rebases the target branch to rewrite its ancestry.",
      "ancestry rewriting for reused targets",
    ],
    [
      "REUSE_EXISTING moves the target branch to the requested base commit.",
      "ancestry rewriting for reused targets",
    ],
    [
      "REUSE_EXISTING does not validate ancestry, but it rebases the target branch to the requested base commit.",
      "ancestry rewriting for reused targets",
    ],
    [
      "REUSE_EXISTING rebases the target branch, while it does not validate ancestry.",
      "ancestry rewriting for reused targets",
    ],
    [
      "Configuration does not persist CLI --base, but configuration overrides CLI --base.",
      "configuration precedence over CLI",
    ],
    [
      "Configuration overrides CLI --base; it does not persist the CLI value.",
      "configuration precedence over CLI",
    ],
    [
      "Configuration overrides CLI --base and does not persist the CLI value.",
      "configuration precedence over CLI",
    ],
    [
      "Configuration does not persist the CLI value and overrides CLI --base.",
      "configuration precedence over CLI",
    ],
    [
      "Standalone does not validate baseBranch, but it loads defaults.create.baseBranch.",
      "standalone base configuration loading or persistence",
    ],
    [
      "Standalone persists defaults.create.baseBranch; it does not validate the value.",
      "standalone base configuration loading or persistence",
    ],
    [
      "Base resolution does not query upstream, but it falls back to the current HEAD.",
      "fallback beyond the local/origin pair",
    ],
    [
      "Base resolution falls back to another branch; it does not query upstream.",
      "fallback beyond the local/origin pair",
    ],
    [
      "Base resolution falls back to the default branch and does not query upstream.",
      "fallback beyond the local/origin pair",
    ],
    [
      "Standalone loads defaults.create.baseBranch and does not query upstream.",
      "standalone base configuration loading or persistence",
    ],
    [
      "REUSE_EXISTING rebases the target branch and does not query upstream.",
      "ancestry rewriting for reused targets",
    ],
    [
      "Successful create-base repositories are sorted alphabetically and do not query upstream.",
      "lexical or alphabetical create-base result ordering",
    ],
    [
      "Each repositoryPath may be a relative path and does not query upstream.",
      "canonical absolute repositoryPath values",
    ],
    [
      "Export ARASHI_BASE_BRANCH=main for create hooks.",
      "ARASHI_BASE_BRANCH",
    ],
    [
      "Create hooks receive ARASHI_BASE_BRANCH with the selected base.",
      "ARASHI_BASE_BRANCH",
    ],
    [
      "`ARASHI_BASE_BRANCH` is available to hooks.",
      "ARASHI_BASE_BRANCH",
    ],
    [
      "Arashi does not change ARASHI_BRANCH_NAME, and exposes ARASHI_BASE_BRANCH to hooks.",
      "ARASHI_BASE_BRANCH",
    ],
    [
      "Arashi exposes ARASHI_BASE_BRANCH to hooks and does not change ARASHI_BRANCH_NAME.",
      "ARASHI_BASE_BRANCH",
    ],
    [
      "Successful create-base repositories are sorted alphabetically by repository name.",
      "lexical or alphabetical create-base result ordering",
    ],
    [
      "Create-base failures are listed in lexical path order.",
      "lexical or alphabetical create-base result ordering",
    ],
    [
      "Each repositoryPath may be a relative repository path.",
      "canonical absolute repositoryPath values",
    ],
    [
      "repositoryPath preserves the symlink path supplied by the caller.",
      "canonical absolute repositoryPath values",
    ],
    [
      "Create-base failures include unaffected repositories for completeness.",
      "failures to affected repositories",
    ],
    [
      "Create-base failures do not include only affected repositories.",
      "failures to affected repositories",
    ],
    [
      "Affected repositories are not the only repositories included in create-base failures.",
      "failures to affected repositories",
    ],
    [
      "Create-base failures include unaffected repositories, not only affected repositories.",
      "failures to affected repositories",
    ],
    [
      "Create-base failures include not only affected repositories, but also unaffected repositories.",
      "failures to affected repositories",
    ],
    [
      "Unaffected repositories are included in create-base failures, not only affected repositories.",
      "failures to affected repositories",
    ],
    [
      "Create-base failures report every selected repository, even when its base resolved.",
      "failures to affected repositories",
    ],
    [
      "defaults.create.baseBranch is shared by configured create and clone.",
      "legacy create key from affecting clone",
    ],
    [
      "defaults.create.baseBranch does not apply to clone by default, but defaults.create.baseBranch is shared by configured create and clone.",
      "legacy create key from affecting clone",
    ],
    [
      "defaults.create.baseBranch applies only to create, not clone, and also applies to clone during migration.",
      "legacy create key from affecting clone",
    ],
    [
      "Configured create still uses defaults.create.baseBranch.",
      "removed legacy key as active create configuration",
    ],
    [
      "defaults.create.baseBranch continues to control configured create.",
      "removed legacy key as active create configuration",
    ],
    [
      "Clone ignores defaults.create.baseBranch until migration.",
      "removed legacy key as active create configuration",
    ],
    [
      "Configured commands skip defaults.create.baseBranch until migration.",
      "removed legacy key as active create configuration",
    ],
    [
      "Coordinated clone checks out the effective base branch.",
      "coordinated clone checked out on its target branch",
    ],
    [
      "Coordinated clone does not reset existing targets, but it checks out the effective base branch.",
      "coordinated clone checked out on its target branch",
    ],
    [
      "Invocation-wide CLI --base overrides repository CLI --repo-base.",
      "repository CLI precedence over invocation CLI",
    ],
    [
      "Standalone create accepts --repo-base api=main.",
      "reject repository-specific overrides in standalone mode",
    ],
    [
      "Standalone create does not load repository base configuration, but it accepts --repo-base api=main.",
      "reject repository-specific overrides in standalone mode",
    ],
  ];
  const missedContradictions: string[] = [];
  for (const [content, expected] of cases) {
    const found: string[] = [];
    checkContradictions("self-test.md", content, found);
    if (!found.some((error) => error.includes(expected))) {
      missedContradictions.push(content);
    }
  }
  if (missedContradictions.length > 0) {
    throw new Error(
      `Create-base checker self-test did not reject contradictions: ${missedContradictions.join(" | ")}`,
    );
  }

  const legitimate = [
    "Base resolution never falls back to another branch.",
    "Configuration does not override CLI --base.",
    "Standalone does not read or persist defaults.create.baseBranch.",
    "REUSE_EXISTING does not reset, rebase, or change target ancestry.",
    "REUSE_EXISTING does not rebase the target; another mode rebases the target branch.",
    "Standalone does not load baseBranch; configured mode rejects defaults.create.baseBranch.",
    "Base resolution never falls back; deployment fallback uses the current upstream.",
    "For older versions, pre-create the target from the base and reuse it; this workaround does not repair ancestry.",
    "Arashi does not provide ARASHI_BASE_BRANCH.",
    "Arashi does not expose ARASHI_BASE_BRANCH to hooks.",
    "Arashi never exports ARASHI_BASE_BRANCH.",
    "`ARASHI_BASE_BRANCH` is not available to hooks.",
    "`ARASHI_BASE_BRANCH` is never exported to hooks.",
    "Successful repositories use selected-set order, not alphabetical order.",
    "Every repositoryPath is a canonical absolute path, never a relative or symlink alias path.",
    "Create-base failures do not include unaffected repositories.",
    "Create-base failures include affected repositories only and do not report unaffected selected repositories.",
    "All selected repository failures are preserved in selected-set order.",
    "defaults.create.baseBranch is unsupported for create and clone.",
    "Move defaults.create.baseBranch to root baseBranch before running create.",
    "Configured create uses root baseBranch and does not support defaults.create.baseBranch.",
    "Clone rejects defaults.create.baseBranch before repository discovery.",
    "Coordinated clone materializes the target branch, not the base branch.",
    "Coordinated clone checks out the target branch created from the effective base branch.",
    "Standalone create supports --base and rejects --repo-base.",
    "Repository CLI --repo-base overrides invocation-wide CLI --base.",
    "Do not let invocation-wide CLI --base override repository CLI --repo-base.",
    "Never let invocation-wide CLI --base override repository CLI --repo-base.",
    "Standalone create rejects --repo-base.",
  ].join("\n");
  const legitimateErrors: string[] = [];
  checkContradictions("self-test.md", legitimate, legitimateErrors);
  if (legitimateErrors.length > 0) {
    throw new Error(
      `Create-base checker self-test rejected legitimate guidance: ${legitimateErrors.join("; ")}`,
    );
  }
}

function runReachabilitySelfTest(): void {
  const workflowWithoutStep = `steps:\n  - name: Other check\n    run: pnpm validate:create-launch-docs\n  # run: pnpm validate:create-base-docs\n`;
  if (/^\s*run:\s*pnpm validate:create-base-docs\s*$/m.test(workflowWithoutStep)) {
    throw new Error(
      "Create-base checker self-test accepted a commented-out workflow command",
    );
  }
}

function parseJson(
  root: string,
  relativePath: string,
  found: string[],
): any | null {
  const raw = read(root, relativePath, found);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    found.push(`${relativePath} is not valid JSON`);
    return null;
  }
}

function read(
  root: string,
  relativePath: string,
  found: string[],
): string | null {
  try {
    return readFileSync(path.resolve(root, relativePath), "utf8");
  } catch {
    found.push(`${relativePath} is missing`);
    return null;
  }
}
