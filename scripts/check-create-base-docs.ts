import { readFileSync } from "node:fs";
import path from "node:path";

const rootPath = process.cwd();
const requirements = new Map<string, string[]>([
  [
    "docs/commands/create.md",
    [
      "`--base <branch>`",
      "feature/FEAT-1234",
      "CLI > configuration > legacy behavior",
      "current parent branch",
      "detected default branch",
      "local branch first, then `origin/<branch>`",
      "every effective selected repository",
      "including repositories whose target branch will be reused",
      "before hooks or any workspace mutation",
      "all repository resolution errors",
      "captured commit OID",
      "moves after preflight",
      "`REUSE_EXISTING`",
      "does not reset, rebase, recreate, or otherwise change its ancestry",
      "Human `--dry-run` output",
      "`CREATE_BASE_RESOLUTION_FAILED`",
      "`ARASHI_BASE_BRANCH`",
      "pre-create the target branch",
      "managed children, not the parent",
    ],
  ],
  [
    "docs/workflows/config.md",
    [
      "`defaults.create.baseBranch`",
      '"baseBranch": "feature/FEAT-1234"',
      "workspace-generic",
      "CLI > configuration > legacy behavior",
      "current parent branch",
      "detected default branch",
      "does not apply to standalone mode",
    ],
  ],
  [
    "docs/workflows/standalone.md",
    [
      "arashi create feature/FEAT-1234/docs --base feature/FEAT-1234",
      "invocation-only",
      "does not read or persist `defaults.create.baseBranch`",
      "current `HEAD`",
      "local branch first and then `origin/<branch>`",
    ],
  ],
  [
    "docs/workflows/json-automation.md",
    [
      "optional `base` object",
      "`requestedBranch` removes at most one leading `origin/`",
      "`source` is `cli` or `config`",
      "`repositoryName`",
      "`repositoryPath`",
      "canonical absolute path",
      "`resolvedRef`",
      "`resolvedOid`",
      "`targetAction` (`created` or `reused`)",
      "`data.base.repositories`",
      "complete effective selected set in selected-set order",
      "`CREATE_BASE_RESOLUTION_FAILED`",
      "`error.details.repositories`",
      "affected repositories only, preserving selected-set order",
      "Every failure includes `repositoryName` and `repositoryPath`",
      "`attemptedRefs` is exactly the ordered pair",
      "`refs/heads/<normalized>`",
      "`refs/remotes/origin/<normalized>`",
    ],
  ],
  [
    "public/commands/create.md",
    [
      "`--base <branch>`",
      "CLI > configuration > legacy behavior",
      "`CREATE_BASE_RESOLUTION_FAILED`",
    ],
  ],
  [
    "public/workflows/config.md",
    ["`defaults.create.baseBranch`", '"baseBranch": "feature/FEAT-1234"'],
  ],
  [
    "public/workflows/standalone.md",
    ["--base feature/FEAT-1234", "invocation-only", "current `HEAD`"],
  ],
  [
    "public/workflows/json-automation.md",
    [
      "optional `base` object",
      "`requestedBranch` removes at most one leading `origin/`",
      "`repositoryName`",
      "`repositoryPath`",
      "canonical absolute path",
      "`resolvedOid`",
      "`targetAction` (`created` or `reused`)",
      "`data.base.repositories`",
      "complete effective selected set in selected-set order",
      "`error.details.repositories`",
      "affected repositories only, preserving selected-set order",
      "Every failure includes `repositoryName` and `repositoryPath`",
      "`attemptedRefs` is exactly the ordered pair",
      "`refs/heads/<normalized>`",
      "`refs/remotes/origin/<normalized>`",
    ],
  ],
  [
    "public/llms.txt",
    [
      "Create base branches",
      "`defaults.create.baseBranch`",
      "`arashi create <target> --base <branch>`",
      "CLI > configuration > legacy behavior",
      "Standalone create base selection is CLI-only and invocation-only",
      "does not read or persist `defaults.create.baseBranch`",
      "Dry-run reports the selected repositories' resolved bases and planned actions without mutation",
      "JSON includes the optional structured `base` object only when a base is requested",
      "success entries are at `data.base.repositories`",
      "resolution failures are at `error.details.repositories`",
      "For older Arashi releases, pre-create the target branch from the desired base",
      "managed children and the parent separately",
      "`REUSE_EXISTING` does not repair or validate ancestry",
      "Create command Markdown",
    ],
  ],
  [
    "scripts/generate-agent-exports.ts",
    [
      "Standalone create base selection is CLI-only and invocation-only",
      "does not read or persist \\`defaults.create.baseBranch\\`",
      "Dry-run reports the selected repositories' resolved bases and planned actions without mutation",
      "JSON includes the optional structured \\`base\\` object only when a base is requested",
      "success entries are at \\`data.base.repositories\\`",
      "resolution failures are at \\`error.details.repositories\\`",
      "For older Arashi releases, pre-create the target branch from the desired base",
      "managed children and the parent separately",
      "\\`REUSE_EXISTING\\` does not repair or validate ancestry",
    ],
  ],
  [
    "public/llms-full.txt",
    [
      "Source: https://arashi.haphazard.dev/commands/create/",
      "Source: https://arashi.haphazard.dev/workflows/config/",
      "Source: https://arashi.haphazard.dev/workflows/standalone/",
      "Source: https://arashi.haphazard.dev/workflows/json-automation/",
      "`defaults.create.baseBranch`",
      "`CREATE_BASE_RESOLUTION_FAILED`",
      "`ARASHI_BASE_BRANCH`",
      "`requestedBranch` removes at most one leading `origin/`",
      "`repositoryName`",
      "`repositoryPath`",
      "`data.base.repositories`",
      "complete effective selected set in selected-set order",
      "`error.details.repositories`",
      "affected repositories only, preserving selected-set order",
      "`attemptedRefs` is exactly the ordered pair",
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
      /\s*(?:;|\bbut\b|\bhowever\b|\bwhile\b)\s*/i,
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
    if (
      !packageJson.scripts?.validate?.includes(
        "pnpm validate:create-base-docs",
      )
    ) {
      found.push("package.json validate must run validate:create-base-docs");
    }
  }

  const workflow = read(root, ".github/workflows/docs-validate.yml", found);
  if (
    workflow !== null &&
    !/^\s*run:\s*pnpm validate:create-base-docs\s*$/m.test(workflow)
  ) {
    found.push(
      "docs-validate workflow must execute validate:create-base-docs explicitly",
    );
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
  ];
  for (const [content, expected] of cases) {
    const found: string[] = [];
    checkContradictions("self-test.md", content, found);
    if (!found.some((error) => error.includes(expected))) {
      throw new Error(
        `Create-base checker self-test did not reject contradiction: ${content}`,
      );
    }
  }

  const legitimate = [
    "Base resolution never falls back to another branch.",
    "Configuration does not override CLI --base.",
    "Standalone does not read or persist defaults.create.baseBranch.",
    "REUSE_EXISTING does not reset, rebase, or change target ancestry.",
    "REUSE_EXISTING does not rebase the target; another mode rebases the target branch.",
    "Standalone does not load baseBranch; configured mode loads defaults.create.baseBranch.",
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
