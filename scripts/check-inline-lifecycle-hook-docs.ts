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

const completeInlineContract: Requirement[] = [
  ["workspace owner hooks.scripts.<lifecycle>", /hooks\.scripts\.<lifecycle>/i],
  ["repository owner repos.<name>.hooks.<lifecycle>", /repos\.<name>\.hooks\.<lifecycle>/i],
  ["all four lifecycle keys", /pre-create[\s\S]{0,240}post-create[\s\S]{0,240}pre-remove[\s\S]{0,240}post-remove/i],
  ["string-as-Bash shorthand", /string[^.\n]{0,100}(?:Bash|bash)[^.\n]{0,80}(?:shorthand|equivalent|map)/i],
  ["closed interpreter map", /bash[^.\n]{0,100}powershell[^.\n]{0,100}cmd/i],
  ["POSIX Bash selection and PATH lookup", /POSIX[^.\n]{0,120}Bash[^.\n]{0,160}PATH[^.\n]{0,120}(?:order|first)/i],
  ["Windows PowerShell to cmd to Bash order", /Windows[^.\n]{0,160}PowerShell[^.\n]{0,80}cmd[^.\n]{0,80}Bash/i],
  ["Windows exact lookup boundaries", /SystemRoot[^.\n]{0,180}(?:PowerShell|cmd)[^.\n]{0,180}(?:PATH|bash\.exe)/i],
  ["unavailable interpreter failure", /interpreter_unavailable|interpreter unavailable/i],
  ["inline/file same-location ambiguity", /(?:inline|file)[^.\n]{0,160}(?:same logical location|one logical location|ambigu)[^.\n]{0,160}(?:inline|file)/i],
  ["short inline versus substantial native files", /short[^.\n]{0,100}(?:reviewable|inline)[^.\n]{0,180}(?:substantial|reusable)[^.\n]{0,100}(?:native|file)/i],
  ["inline snippet portability variants", /snippets?[^.\n]{0,100}non-portable[^.\n]{0,140}(?:compatible )?(?:interpreter )?variants?[^.\n]{0,80}(?:supplied|provided|configured)/i],
  ["create-only --no-hooks", /--no-hooks[^.\n]{0,160}(?:create-only|only (?:on|for) (?:configured )?create|remove does not)/i],
  ["shared --no-hook-input", /--no-hook-input[^.\n]{0,140}(?:create and remove|both create and remove|shared)/i],
  ["remove dry-run source-aware previews", /remove[^.\n]{0,80}(?:--dry-run|dry-run)[^.\n]{0,180}(?:source-aware|source kind|source owner|source metadata)[^.\n]{0,80}preview/i],
  ["configured-create dry-run no preview", /configured[- ]create[^.\n]{0,100}(?:--dry-run|dry-run)[^.\n]{0,180}no hook discovery[^.\n]{0,140}empty (?:hook )?ledger[^.\n]{0,120}no (?:hook )?preview/i],
  ["non-secret source metadata", /sourceKind[^.\n]{0,100}inline-config[^.\n]{0,160}sourceOwnerKind[^.\n]{0,120}sourceOwnerName/i],
  ["inline source path is null or omitted", /sourceScriptPath[^.\n]{0,100}(?:null|omitted|not applicable)/i],
  ["snippet no-disclosure", /(?:outcomes|previews|diagnostics|logs)[^.\n]{0,200}(?:do not|does not|never|must not)[^.\n]{0,100}(?:snippet|command text)/i],
  ["standalone and user-global file-only boundary", /(?:standalone|user-global)[^.\n]{0,180}(?:file-only|native files? only|remain native files?)[^.\n]{0,180}(?:standalone|user-global)/i],
  ["shell-native environment syntax", /\$ARASHI_[A-Z_]+[\s\S]{0,180}\$env:ARASHI_[A-Z_]+[\s\S]{0,180}%ARASHI_[A-Z_]+%/i],
  ["fail-fast command composition", /fail-fast|later success[^.\n]{0,100}(?:must not|does not|cannot) mask/i],
  ["no inline secrets", /(?:inline|snippet)[^.\n]{0,140}(?:do not|never|must not)[^.\n]{0,100}(?:secret|token|password)/i],
];

const automationContract = completeInlineContract.slice(11);

const reviewedGuidanceContract: Requirement[] = [
  [
    "configured-create inline/file discovery alternatives",
    /configured create[^.\n]{0,180}(?:inline|configuration)[^.\n]{0,120}(?:native )?files?[^.\n]{0,100}(?:alternative|either|or)/i,
  ],
  [
    "TTY source-aware attribution",
    /(?:tty|terminal)[^.\n]{0,180}(?:banner|attribution)[^.\n]{0,180}inline[^.\n]{0,160}(?:owner|source kind)[^.\n]{0,180}(?:native|file)[^.\n]{0,160}absolute[^.\n]{0,80}(?:path|script)/i,
  ],
];
const surfaces = new Map<string, Requirement[]>([
  ["docs/reference/hooks.md", [...completeInlineContract, ...reviewedGuidanceContract]],


  ["docs/commands/create.md", automationContract.filter(([label]) => /no-hooks|no-hook-input|configured-create|source metadata|no-disclosure/.test(label))],
  ["docs/commands/remove.md", automationContract.filter(([label]) => /no-hooks|no-hook-input|remove dry-run|source metadata|no-disclosure/.test(label))],
  ["public/reference/hooks.md", [...completeInlineContract, ...reviewedGuidanceContract]],


  ["public/commands/create.md", automationContract.filter(([label]) => /no-hooks|no-hook-input|configured-create|source metadata|no-disclosure/.test(label))],
  ["public/commands/remove.md", automationContract.filter(([label]) => /no-hooks|no-hook-input|remove dry-run|source metadata|no-disclosure/.test(label))],
  ["public/llms.txt", [...completeInlineContract, ...reviewedGuidanceContract]],
  ["public/llms-full.txt", [...completeInlineContract, ...reviewedGuidanceContract]],
]);

const root = path.resolve(process.cwd());
const errors = checkRoot(root);
runControlledMismatchSelfTest();
runReachabilitySelfTest();

if (errors.length > 0) {
  console.error("Inline lifecycle-hook documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Inline lifecycle-hook documentation contract passed for ${surfaces.size} canonical/generated surfaces.`);

function checkRoot(rootPath: string): string[] {
  const found: string[] = [];
  for (const [relativePath, requirements] of surfaces) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    checkRequirements(relativePath, content, requirements, found);
    checkContradictions(relativePath, content, found);
  }
  checkReachability(rootPath, found);
  return found;
}

function checkRequirements(relativePath: string, content: string, requirements: Requirement[], found: string[]): void {
  const normalized = content.replaceAll("`", "").replace(/\s+/g, " ");
  for (const [label, pattern] of requirements) {
    if (!pattern.test(normalized)) found.push(`${relativePath} is missing ${label}`);
  }
}

function checkContradictions(relativePath: string, content: string, found: string[]): void {
  const statements = content.replace(/```[\s\S]*?```/g, (block) => block.replace(/\n/g, " ")).split(/(?<=[.!?])\s+|\n+/);
  for (const statement of statements) {
    if (
      /"(?:pre|post)-(?:create|remove)\.[^"]+"\s*:/.test(statement) ||
      /\bhooks\.scripts\.(?:pre|post)-(?:create|remove)\.[A-Za-z0-9_-]+\b/.test(statement) ||
      /\bhooks\.scripts\s*\[\s*["'](?:pre|post)-(?:create|remove)\.[^"']+["']\s*\]/.test(statement)
    ) {
      found.push(`${relativePath} must not teach encoded repository lifecycle configuration keys`);
    }
    const terminalChoosesInlineInterpreter = splitContrastClauses(statement).some(
      (clause) =>
        /inline[^.;,\n]{0,80}(?:terminal host|shell host)\s+(?:selects?|chooses?)\s+(?:the\s+)?interpreter/i.test(clause) ||
        /(?:terminal host|shell host)\s+(?:selects?|chooses?)\s+(?:the\s+)?inline interpreter/i.test(clause),
    );
    if (terminalChoosesInlineInterpreter) {
      found.push(`${relativePath} must not make terminal selection choose an inline interpreter`);
    }
    const configuredCreateFileOnly = /configured create[^.\n]{0,120}\b(?:uses?|discovers?|searches?) only\b[^.\n]{0,120}(?:filenames?|files?|scripts?)/i.test(statement);
    const nativeOnlyQualification = /native (?:sources?|files?|hooks?)[^.\n]{0,80}configured create/i.test(statement);
    const preservesInlineAlternative = /inline (?:configuration|sources?|hooks?)[^.\n]{0,100}(?:alternative|remains?)/i.test(statement);
    if (configuredCreateFileOnly && !(nativeOnlyQualification && preservesInlineAlternative)) {
      found.push(`${relativePath} must not describe configured create discovery as file-only`);
    }
    const absoluteSourceScriptAttribution = /(?:banner|attribution)[^.\n]{0,120}\babsolute source script\b/i.test(statement);
    const nativePathQualification = /native (?:file |hook'?s? )?[^.\n]{0,60}absolute source script/i.test(statement);
    const identifiesInlineOwner = /inline hooks?[^.\n]{0,80}(?:source )?(?:kind|owner)/i.test(statement);
    if (absoluteSourceScriptAttribution && !(nativePathQualification && identifiesInlineOwner)) {
      found.push(`${relativePath} must not promise an absolute source script for pathless inline hooks`);
    }
    for (const clause of splitContrastClauses(statement)) {
      if (hasAffirmativeSnippetDisclosure(clause)) {
        found.push(`${relativePath} must not disclose inline snippet text`);
      }

      for (const standalone of clause.matchAll(/standalone[^.\n]{0,100}?\b(load|support|execute)s?\b[^.\n]{0,80}inline/gi)) {
        const action = standalone[1];
        const actionIndex = (standalone.index ?? 0) + standalone[0].toLowerCase().lastIndexOf(action.toLowerCase());
        if (!isActionNegated(clause, actionIndex)) {
          found.push(`${relativePath} must keep standalone hooks file-only`);
          break;
        }
      }
    }
  }
}

function hasAffirmativeSnippetDisclosure(clause: string): boolean {
  const subject = /\b(?:outcomes|previews|diagnostics|logs)\b/i.exec(clause);
  if (subject?.index === undefined) return false;

  const actions = [...clause.matchAll(/\b(print|include|reveal|quote)s?\b/gi)].filter(
    (action) => (action.index ?? 0) > subject.index,
  );
  return actions.some((action, index) => {
    const actionIndex = action.index ?? 0;
    const targetEnd = actions[index + 1]?.index ?? clause.length;
    const target = clause.slice(actionIndex + action[0].length, targetEnd);
    return /\b(?:snippet|command text)\b/i.test(target) && !isActionNegated(clause, actionIndex);
  });
}

function splitContrastClauses(statement: string): string[] {
  return statement.split(/\s*(?:;|,?\s+\b(?:but|however|although|while|yet)\b)\s*/i);
}

function isActionNegated(clause: string, actionIndex: number): boolean {
  const prefix = clause.slice(Math.max(0, actionIndex - 32), actionIndex);
  return /(?:\bnever|\b(?:do|does|did|is|are|must|can|will|should)\s+not)\s*$/i.test(prefix);
}

function checkReachability(rootPath: string, found: string[]): void {
  const packageJson = parseJson(rootPath, "package.json", found) as { scripts?: Record<string, string> } | null;
  const focused = "pnpm sync:content && node scripts/check-inline-lifecycle-hook-docs.ts";
  if (packageJson?.scripts?.["validate:inline-lifecycle-hook-docs"] !== focused) {
    found.push("package.json must define validate:inline-lifecycle-hook-docs");
  }
  if (!packageJson?.scripts?.validate?.includes("pnpm validate:semantic-docs")) {
    found.push("package.json validate must retain the stable semantic docs aggregate");
  }
  const manifest = parseJson(rootPath, "scripts/semantic-doc-checks.json", found);
  if (!Array.isArray(manifest) || !manifest.includes("check-inline-lifecycle-hook-docs.ts")) {
    found.push("scripts/semantic-doc-checks.json must register check-inline-lifecycle-hook-docs.ts");
  }
  const workflow = read(rootPath, ".github/workflows/docs-validate.yml", found);
  if (workflow !== null && !/^\s*run:\s*pnpm validate\s*$/m.test(workflow)) {
    found.push("docs workflow must execute the stable pnpm validate aggregate");
  }
  if (workflow !== null && /check-inline-lifecycle-hook-docs/.test(workflow)) {
    found.push("docs workflow must not name the focused inline-hook checker");
  }
}

function runControlledMismatchSelfTest(): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-inline-docs-mismatch-"));
  try {
    const fixturePath = "fixture.md";
    mkdirSync(path.join(fixtureRoot), { recursive: true });
    writeFileSync(path.join(fixtureRoot, fixturePath), "workspace hooks.scripts.<lifecycle> owner\n");
    const requirements: Requirement[] = [["workspace owner", /hooks\.scripts\.<lifecycle>/i]];
    const valid: string[] = [];
    checkRequirements(fixturePath, readFileSync(path.join(fixtureRoot, fixturePath), "utf8"), requirements, valid);
    assert.deepEqual(valid, []);
    writeFileSync(path.join(fixtureRoot, fixturePath), "workspace hooks.commands.<lifecycle> owner\n");
    const drift: string[] = [];
    checkRequirements(fixturePath, readFileSync(path.join(fixtureRoot, fixturePath), "utf8"), requirements, drift);
    assert.match(drift.join("\n"), /workspace owner/);

    const contradictions: string[] = [];
    checkContradictions(fixturePath, 'Configured inline outcomes include snippet command text.\n"pre-create.api": "echo bad"\n', contradictions);
    assert.match(contradictions.join("\n"), /disclose inline snippet text/);
    assert.match(contradictions.join("\n"), /encoded repository lifecycle/);

    const adversarialClaims: Array<[label: string, claim: string, expected: RegExp]> = [
      [
        "clause-local snippet disclosure",
        "Outcomes never reveal snippet text, but logs include snippet command text.",
        /disclose inline snippet text/,
      ],
      [
        "dynamic encoded repository key",
        "Do not configure hooks.scripts.pre-create.api.",
        /encoded repository lifecycle/,
      ],
      [
        "bracket-encoded dynamic repository key",
        'Do not configure hooks.scripts["pre-create.api"].',
        /encoded repository lifecycle/,
      ],
      [
        "independent disclosure action after legitimate metadata exclusion",
        "Outcomes do not include owner metadata and reveal snippet command text.",
        /disclose inline snippet text/,
      ],
      [
        "subject-order terminal selection",
        "The terminal host chooses the inline interpreter.",
        /terminal selection/,
      ],
      [
        "configured create filename-only discovery",
        "Configured create uses only the workspace and repository-specific filenames shown above.",
        /file-only/,
      ],
      [
        "pathless inline TTY attribution",
        "Before a tty hook reads, the attribution banner prints the absolute source script.",
        /pathless inline hooks/,
      ],
    ];
    const missedAdversarialClaims: string[] = [];
    for (const [label, claim, expected] of adversarialClaims) {
      const claimErrors: string[] = [];
      checkContradictions(fixturePath, claim, claimErrors);
      if (!expected.test(claimErrors.join("\n"))) missedAdversarialClaims.push(label);
    }
    const legitimateStandaloneBoundary: string[] = [];
    checkContradictions(fixturePath, "Standalone never executes inline hooks.", legitimateStandaloneBoundary);
    if (legitimateStandaloneBoundary.length > 0) {
      missedAdversarialClaims.push("legitimate standalone negation rejected");
    }
    const legitimateDisclosureNegations: string[] = [];
    checkContradictions(
      fixturePath,
      "Outcomes do not include owner metadata and never reveal snippet command text.",
      legitimateDisclosureNegations,
    );
    if (legitimateDisclosureNegations.length > 0) {
      missedAdversarialClaims.push("action-local disclosure negations rejected");
    }
    const legitimateWorkspaceBracketKey: string[] = [];
    checkContradictions(
      fixturePath,
      'Configure hooks.scripts["pre-create"] for the workspace hook.',
      legitimateWorkspaceBracketKey,
    );
    if (legitimateWorkspaceBracketKey.length > 0) {
      missedAdversarialClaims.push("legitimate workspace bracket key rejected");
    }
    const legitimateTerminalContext: string[] = [];
    checkContradictions(
      fixturePath,
      "The terminal host chooses the output theme; Arashi chooses the inline interpreter from configured variants.",
      legitimateTerminalContext,
    );
    if (legitimateTerminalContext.length > 0) {
      missedAdversarialClaims.push("unrelated terminal-host clause rejected");
    }
    const legitimateNativeDiscoveryQualification: string[] = [];
    checkContradictions(
      fixturePath,
      "For native sources, configured create uses only workspace and repository-specific filenames; inline configuration remains an alternative.",
      legitimateNativeDiscoveryQualification,
    );
    if (legitimateNativeDiscoveryQualification.length > 0) {
      missedAdversarialClaims.push("native-only discovery qualification rejected");
    }
    const legitimateSourceAwareAttribution: string[] = [];
    checkContradictions(
      fixturePath,
      "The banner identifies a native hook's absolute source script; inline hooks identify their source owner.",
      legitimateSourceAwareAttribution,
    );
    if (legitimateSourceAwareAttribution.length > 0) {
      missedAdversarialClaims.push("source-aware native attribution rejected");
    }
    assert.deepEqual(missedAdversarialClaims, [], "checker mishandled adversarial guidance");
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function runReachabilitySelfTest(): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-inline-docs-reachability-"));
  try {
    mkdirSync(path.join(fixtureRoot, "scripts"), { recursive: true });
    mkdirSync(path.join(fixtureRoot, ".github", "workflows"), { recursive: true });
    const validPackage = { scripts: { "validate:inline-lifecycle-hook-docs": "pnpm sync:content && node scripts/check-inline-lifecycle-hook-docs.ts", validate: "pnpm validate:semantic-docs" } };
    writeFileSync(path.join(fixtureRoot, "package.json"), `${JSON.stringify(validPackage)}\n`);
    writeFileSync(path.join(fixtureRoot, "scripts", "semantic-doc-checks.json"), '["check-inline-lifecycle-hook-docs.ts"]\n');
    writeFileSync(path.join(fixtureRoot, ".github", "workflows", "docs-validate.yml"), "steps:\n  - name: Validate\n    run: pnpm validate\n");
    const valid: string[] = [];
    checkReachability(fixtureRoot, valid);
    assert.deepEqual(valid, []);

    writeFileSync(path.join(fixtureRoot, "scripts", "semantic-doc-checks.json"), "[]\n");
    const omitted: string[] = [];
    checkReachability(fixtureRoot, omitted);
    assert.match(omitted.join("\n"), /must register/);

    writeFileSync(path.join(fixtureRoot, "scripts", "semantic-doc-checks.json"), '["check-inline-lifecycle-hook-docs.ts"]\n');
    writeFileSync(path.join(fixtureRoot, ".github", "workflows", "docs-validate.yml"), "steps:\n  - run: node scripts/check-inline-lifecycle-hook-docs.ts\n");
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
