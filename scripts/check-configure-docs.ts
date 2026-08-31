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

type Category =
  | "descriptors"
  | "state"
  | "actions"
  | "preview"
  | "active-file"
  | "no-op"
  | "invocation"
  | "secrecy";
type Requirement = [category: Category, label: string, pattern: RegExp];

const checkerName = "check-configure-docs.ts";
const descriptorPaths = [
  "reposDir",
  "worktreesDir",
  "baseBranch",
  "sync.timeoutSeconds",
  "hooks.timeout",
  "hooks.scripts.pre-create",
  "hooks.scripts.post-create",
  "hooks.scripts.pre-remove",
  "hooks.scripts.post-remove",
  "defaults.create.switch",
  "defaults.create.launch",
  "defaults.switch.mode",
  "defaults.editors.vscode.create.switch",
  "defaults.editors.vscode.create.launch",
  "defaults.editors.cursor.create.switch",
  "defaults.editors.cursor.create.launch",
  "defaults.editors.kiro.create.switch",
  "defaults.editors.kiro.create.launch",
  "meta.baseBranch",
  "repos.<name>.groups",
  "repos.<name>.baseBranch",
  "repos.<name>.copy",
  "repos.<name>.symlink",
  "repos.<name>.hooks.pre-create",
  "repos.<name>.hooks.post-create",
  "repos.<name>.hooks.pre-remove",
  "repos.<name>.hooks.post-remove",
] as const;

const semanticContract: Requirement[] = [
  [
    "descriptors",
    "finite product-owned descriptor set rather than schema-derived controls",
    /(?:finite|only|exact)[^.!?]{0,120}(?:product-owned|supported)[^.!?]{0,100}(?:descriptor|path)[^.!?]{0,180}(?:not|never)[^.!?]{0,80}(?:schema-derived|generated from (?:the )?schema|schema traversal)/i,
  ],
  [
    "descriptors",
    "immutable repository identity fields",
    /repos\.<name>\.path[^.!?]{0,100}repos\.<name>\.gitUrl[^.!?]{0,180}(?:identify|identity)[^.!?]{0,120}(?:not editable|cannot be edited|never edited)/i,
  ],
  [
    "state",
    "configured means present and not configured means absent",
    /Configured[^.!?]{0,100}(?:present|persisted)[^.!?]{0,180}Not configured[^.!?]{0,100}(?:absent|not persisted)/i,
  ],
  [
    "state",
    "effective values are separate and never persisted implicitly",
    /Effective[^.!?]{0,120}(?:separate|separately)[^.!?]{0,160}(?:inherited|built-in)[^.!?]{0,180}(?:does not|never|without)[^.!?]{0,100}persist/i,
  ],
  [
    "state",
    "configuration state is not runtime health",
    /(?:state|labels?)[^.!?]{0,120}(?:not|do not)[^.!?]{0,80}(?:runtime health|diagnostics)[^.!?]{0,120}aw doctor/i,
  ],
  [
    "actions",
    "keep edit and clear have distinct persisted-field effects",
    /Keep[^.!?]{0,100}preserv[^.!?]{0,180}Edit[^.!?]{0,120}(?:validat|replace|set)[^.!?]{0,180}Clear[^.!?]{0,120}(?:omit|remove)[^.!?]{0,100}(?:optional|persisted|field)/i,
  ],
  [
    "actions",
    "required reposDir cannot be cleared and empty input is not clear",
    /reposDir[^.!?]{0,100}(?:cannot|must not)[^.!?]{0,60}clear[^.!?]{0,180}(?:empty|blank)[^.!?]{0,100}(?:does not|never|is not)[^.!?]{0,80}clear/i,
  ],
  [
    "preview",
    "exact serialized candidate bytes are the bytes saved",
    /exact serialized candidate JSON[^.!?]{0,180}(?:same|actual|those)[^.!?]{0,100}bytes[^.!?]{0,100}(?:save|persist|write)/i,
  ],
  [
    "preview",
    "active-file preview is separate metadata without contents",
    /separate active-file (?:list|plan)[^.!?]{0,180}lifecycle[^.!?]{0,120}(?:exact )?path[^.!?]{0,120}safe-no-op[^.!?]{0,120}runtime readiness[^.!?]{0,180}(?:does not|never|without)[^.!?]{0,80}(?:contents|bodies)/i,
  ],
  [
    "active-file",
    "existing active native files are external state with keep or skip",
    /existing active native files?[^.!?]{0,120}external state[^.!?]{0,180}(?:never|does not|must not)[^.!?]{0,100}(?:clear|delete|overwrite)[^.!?]{0,180}(?:keep\s*(?:or|\/)[ -]?skip|keep and skip)/i,
  ],
  [
    "no-op",
    "unchanged serialized bytes and no active-file plan exit before confirmation and save",
    /serialized bytes[^.!?]{0,100}unchanged[^.!?]{0,120}no active-file plan[^.!?]{0,180}(?:exit|reports? no changes)[^.!?]{0,100}before[^.!?]{0,120}(?:final confirmation|confirm)[^.!?]{0,120}(?:save|persist)/i,
  ],
  [
    "invocation",
    "human and JSON modes require a configured valid workspace",
    /human and JSON[^.!?]{0,100}(?:both )?require[^.!?]{0,100}(?:configured|canonically valid)[^.!?]{0,80}workspace/i,
  ],
  [
    "invocation",
    "missing standalone and invalid state fail before prompt or inspection without init or repair",
    /missing[^.!?]{0,100}standalone[^.!?]{0,100}invalid[^.!?]{0,160}fail[^.!?]{0,100}before[^.!?]{0,100}(?:prompt|inspection)[^.!?]{0,160}(?:does not|never|without)[^.!?]{0,100}(?:initializ|init)[^.!?]{0,100}(?:repair|rewrite)/i,
  ],
  [
    "invocation",
    "TTY human editing and non-mutating JSON inspection",
    /human editing[^.!?]{0,100}(?:stdin and stdout|both input and output)[^.!?]{0,80}TTY[^.!?]{0,180}aw configure --json[^.!?]{0,120}(?:never|does not)[^.!?]{0,80}prompt[^.!?]{0,100}(?:never|does not)[^.!?]{0,80}mutat/i,
  ],
  [
    "secrecy",
    "selection, list, ordinary, diagnostic, cancellation, JSON, and generated active-file views are body-free",
    /selection[^.!?]{0,100}(?:lists?|ordinary)[^.!?]{0,100}(?:ordinary|views?)[^.!?]{0,100}diagnostics[^.!?]{0,100}cancellation[^.!?]{0,100}JSON[^.!?]{0,140}generated active-file (?:list|plan)[^.!?]{0,120}(?:body-free|without|never|do not)[^.!?]{0,80}(?:inline )?(?:bodies|command text)?/i,
  ],
  [
    "secrecy",
    "plaintext entry and exact final preview are the only body-bearing views",
    /visible plaintext[^.!?]{0,100}(?:entry|input)[^.!?]{0,80}and (?:the )?exact final[^.!?]{0,80}preview[^.!?]{0,80}(?:are|remain)[^.!?]{0,40}the only (?:body-bearing )?views?[^.!?]{0,100}(?:include|show|expose)[^.!?]{0,60}(?:inline )?(?:bodies|command)/i,
  ],
];

type CommandRequirement = [label: string, pattern: RegExp];
const commandContract: CommandRequirement[] = [
  ["configured and effective values remain separate", /configured values[^.\n]{0,120}(?:separate|separately)[^.\n]{0,120}(?:inherited|built-in)[^.\n]{0,80}effective values/i],
  ["keep edit and clear actions", /keep[^.\n]{0,80}edit[^.\n]{0,80}clear/i],
  ["finite supported setting set", /finite supported setting set/i],
  ["no arbitrary schema editing", /without exposing arbitrary schema fields/i],
  ["exact JSON and separate active-file preview", /exact canonical JSON[^.\n]{0,120}(?:saved|save)[^.\n]{0,120}separate active-file plan/i],
  ["JSON inspection never prompts or writes", /aw configure --json[^.\n]{0,100}inspection only[^.\n]{0,100}never prompts[^.\n]{0,80}(?:writes|mutates)/i],
  ["valid configured workspace without init or repair", /requires an existing valid configured workspace[\s\S]{0,160}does not[\s\S]{0,100}(?:initialize|migrate|repair)/i],
  ["existing active native hook files are preserved", /existing active native hook files[^.\n]{0,120}(?:are preserved|(?:never|not)[^.\n]{0,100}(?:overwritten|deleted))/i],
  ["repository identity fields are not editable", /repos\.<name>\.path[^.\n]{0,100}repos\.<name>\.gitUrl[^.\n]{0,140}not editable/i],
];

const owningSurfaces = [
  "public/llms.txt",
] as const;
const commandSurfaces = [
  "docs/commands/configure.md",
  "public/commands/configure.md",
] as const;
const discoveryRequirements = new Map<string, RegExp[]>([
  ["docs/commands/index.md", [/^- \[configure\]\(\/commands\/configure\/\) - /im]],

  ["docs/workflows/config.md", [/aw configure/i, /\.arashi\/config\.json/i, /aw doctor/i]],
  ["public/commands/index.md", [/^- \[configure\]\(\/commands\/configure\/\) - /im]],

  ["public/workflows/config.md", [/aw configure/i, /\.arashi\/config\.json/i, /aw doctor/i]],
]);

const root = path.resolve(process.cwd());
runControlledMutationSelfTests();
runReachabilitySelfTest();
if (process.argv.includes("--self-test-only")) {
  console.log("Interactive configure documentation checker self-tests passed.");
  process.exit(0);
}

const errors = checkRoot(root);
if (errors.length > 0) {
  console.error("Interactive configure documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Interactive configure documentation contract passed for ${owningSurfaces.length} agent surface, ${commandSurfaces.length} command surfaces, ${discoveryRequirements.size} discovery surfaces, ${descriptorPaths.length} exact descriptor paths, controlled category mutations, and registry reachability.`,
);

function checkRoot(rootPath: string): string[] {
  const found: string[] = [];
  for (const relativePath of owningSurfaces) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    checkGuidance(relativePath, content, found);
  }
  for (const relativePath of commandSurfaces) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    checkCommandDescriptorSet(relativePath, content, found);
    const normalized = content.replaceAll("`", "").replace(/\s+/g, " ");
    for (const [label, pattern] of commandContract) {
      if (!pattern.test(normalized)) found.push(`${relativePath} is missing ${label}`);
    }
    checkContradictions(relativePath, content, found);
  }
  for (const [relativePath, requirements] of discoveryRequirements) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    for (const requirement of requirements) {
      if (!requirement.test(content)) found.push(`${relativePath} is missing configure discovery guidance matching ${requirement}`);
    }
  }
  checkReachability(rootPath, found);
  return found;
}

function checkCommandDescriptorSet(relativePath: string, content: string, found: string[]): void {
  const start = content.indexOf("- Workspace:");
  const end = content.indexOf("Repository identity fields", start);
  if (start === -1 || end === -1) {
    found.push(`${relativePath} [descriptors] is missing the supported-field list boundaries`);
    return;
  }

  const documented = new Set(
    Array.from(content.slice(start, end).matchAll(/`([^`\n]+)`/g), (match) => match[1]),
  );
  const expected = new Set<string>(descriptorPaths);
  const missing = descriptorPaths.filter((descriptorPath) => !documented.has(descriptorPath));
  const unsupported = [...documented].filter((descriptorPath) => !expected.has(descriptorPath)).sort();
  if (missing.length > 0 || unsupported.length > 0) {
    const details = [
      missing.length > 0 ? `missing: ${missing.join(", ")}` : "",
      unsupported.length > 0 ? `unsupported: ${unsupported.join(", ")}` : "",
    ].filter(Boolean);
    found.push(`${relativePath} [descriptors] supported fields must equal the canonical set (${details.join("; ")})`);
  }
}

function checkGuidance(relativePath: string, content: string, found: string[]): void {
  const normalized = content.replaceAll("`", "").replace(/\s+/g, " ");
  checkDescriptorSet(relativePath, content, found);
  for (const [category, label, pattern] of semanticContract) {
    if (!pattern.test(normalized)) found.push(`${relativePath} [${category}] is missing ${label}`);
  }
  checkContradictions(relativePath, content, found);
}

function checkDescriptorSet(relativePath: string, content: string, found: string[]): void {
  const declaration = /descriptor path set is exact[^:\n.]*?schema\s*:/i.exec(content);
  if (declaration?.index === undefined) {
    found.push(`${relativePath} [descriptors] is missing the canonical descriptor declaration`);
    return;
  }

  const declarationEnd = declaration.index + declaration[0].length;
  const identityBoundary = content.indexOf("`repos.<name>.path`", declarationEnd);
  if (identityBoundary === -1) {
    found.push(`${relativePath} [descriptors] cannot bound descriptors before repository identity fields`);
    return;
  }

  const documented = new Set(
    Array.from(content.slice(declarationEnd, identityBoundary).matchAll(/`([^`\n]+)`/g), (match) => match[1]),
  );
  const expected = new Set<string>(descriptorPaths);
  const missing = descriptorPaths.filter((descriptorPath) => !documented.has(descriptorPath));
  const unsupported = [...documented].filter((descriptorPath) => !expected.has(descriptorPath)).sort();
  if (missing.length > 0 || unsupported.length > 0) {
    const details = [
      missing.length > 0 ? `missing: ${missing.join(", ")}` : "",
      unsupported.length > 0 ? `unsupported: ${unsupported.join(", ")}` : "",
    ].filter(Boolean);
    found.push(`${relativePath} [descriptors] descriptor paths must equal the canonical set (${details.join("; ")})`);
  }
}

function checkContradictions(relativePath: string, content: string, found: string[]): void {
  const statements = content
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/\n/g, " "))
    .split(/(?<=[.!?])\s+|\n+/);
  for (const statement of statements) {
    for (const clause of statement.split(/\s*(?:;|,?\s+\b(?:but|however|although|while|yet)\b)\s*/i)) {
      rejectAffirmative(
        relativePath,
        clause,
        /existing active native files?[^.!?]{0,160}\b(?:may|can|will|does|configure can)\s+(?:be\s+)?(clear(?:ed)?|delet(?:e|ed)|overwrit(?:e|ten)|replac(?:e|ed))\b/i,
        "active-file",
        "must not clear, delete, overwrite, or replace existing active native files",
        found,
      );
      rejectAffirmative(
        relativePath,
        clause,
        /aw configure --json[^.!?]{0,120}\b(?:may|can|will|does|configure can)?\s*(prompt|mutate|write|save|edit|clear)s?\b/i,
        "invocation",
        "must not make JSON inspection prompt or mutate",
        found,
      );
      rejectAffirmative(
        relativePath,
        clause,
        /(?:missing|standalone|invalid)[^.!?]{0,140}\b(?:may|can|will|does|configure can)\s+(prompt|inspect|initialize|repair|rewrite)s?\b/i,
        "invocation",
        "must fail invalid workspace state before prompt or inspection without init or repair",
        found,
      );
      rejectAffirmative(
        relativePath,
        clause,
        /(?:unchanged serialized bytes|no active-file plan)[^.!?]{0,160}\b(?:(?:are|is)\s+)?(?:still|then|will|continues? to)\s+(confirm(?:ed)?|sav(?:e|ed)|persist(?:ed)?|writ(?:e|ten))\b/i,
        "no-op",
        "must exit a true no-op before confirmation and persistence",
        found,
      );
      rejectAffirmative(
        relativePath,
        clause,
        /(?:selection(?: screen| view)?|(?:setting |ordinary )?lists?|ordinary views?|diagnostics?|cancellations?|JSON|generated active-file (?:list|plan))[^.!?]{0,180}\b(?:may|can|will|does)?\s*(show|print|include|reveal|expose)s?\b[^.!?]{0,80}(?:inline (?:body|bodies|command text)|command bodies)/i,
        "secrecy",
        "must not disclose inline command bodies outside entry and exact final preview",
        found,
      );
    }
    if (/Not configured[^.!?]{0,100}(?:means|indicates)[^.!?]{0,80}(?:invalid|ignored|ineffective|required)/i.test(statement)) {
      found.push(`${relativePath} [state] must not equate Not configured with runtime validity or effectiveness`);
    }
    if (/final (?:JSON )?preview[^.!?]{0,100}(?:summary|approximation)[^.!?]{0,100}(?:instead of|rather than)[^.!?]{0,80}exact/i.test(statement)) {
      found.push(`${relativePath} [preview] must require the exact serialized candidate rather than a summary`);
    }
  }
}

function rejectAffirmative(
  relativePath: string,
  clause: string,
  pattern: RegExp,
  category: Category,
  message: string,
  found: string[],
): void {
  const match = pattern.exec(clause);
  if (match?.index === undefined) return;
  const action = match[1] ?? match[0].match(/\b(prompt|mutate|write|save|edit|clear|delete|overwrite|replace|inspect|initialize|repair|rewrite|confirm|persist|show|print|include|reveal)s?\b/i)?.[0];
  const actionIndex = action ? match.index + match[0].toLowerCase().lastIndexOf(action.toLowerCase()) : match.index;
  const prefix = clause.slice(Math.max(0, actionIndex - 90), actionIndex);
  if (!/(?:\bnever|\bwithout|\b(?:do|does|must|will|can|may|should|is|are)\s+not|\bcannot)\b[^.;]{0,60}$/i.test(prefix)) {
    found.push(`${relativePath} [${category}] ${message}`);
  }
}

function checkReachability(rootPath: string, found: string[]): void {
  const packageJson = parseJson(rootPath, "package.json", found) as { scripts?: Record<string, string> } | null;
  const focused = `pnpm sync:content && node scripts/${checkerName}`;
  if (packageJson?.scripts?.["validate:configure-docs"] !== focused) {
    found.push("package.json must define validate:configure-docs");
  }
  if (!packageJson?.scripts?.validate?.includes("pnpm validate:semantic-docs")) {
    found.push("package.json validate must retain the stable semantic docs aggregate");
  }
  const manifest = parseJson(rootPath, "scripts/semantic-doc-checks.json", found);
  if (!Array.isArray(manifest) || !manifest.includes(checkerName)) {
    found.push(`scripts/semantic-doc-checks.json must register ${checkerName}`);
  }
  const workflow = read(rootPath, ".github/workflows/docs-validate.yml", found);
  if (workflow !== null && !/^\s*run:\s+pnpm validate\s*$/m.test(workflow)) {
    found.push("docs workflow must execute the stable pnpm validate aggregate");
  }
  if (workflow !== null && workflow.includes(checkerName)) {
    found.push("docs workflow must not name the focused configure checker");
  }
}

function runControlledMutationSelfTests(): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-configure-docs-mutations-"));
  const valid = [
    "The finite product-owned descriptor path set is exact and is never generated from the schema:",
    descriptorPaths.map((descriptorPath) => `\`${descriptorPath}\``).join(", "),
    "`repos.<name>.path` and `repos.<name>.gitUrl` identify the repository and are not editable.",
    "Configured means a persisted field is present; Not configured means the field is absent or not persisted.",
    "Effective is shown separately for inherited or built-in values and never persists a value implicitly.",
    "These state labels are not runtime health; use aw doctor for diagnostics.",
    "Keep preserves the persisted field; Edit validates and replaces it; Clear removes an optional persisted field.",
    "Required reposDir cannot be cleared, and empty input is not clear.",
    "The exact serialized candidate JSON contains the same bytes that save will persist.",
    "A separate active-file plan lists lifecycle, exact path, safe-no-op state, and runtime readiness, and does not show contents.",
    "Existing active native files are external state: configure never clears, deletes, or overwrites them and offers keep/skip.",
    "When serialized bytes are unchanged and there is no active-file plan, configure exits before final confirmation or save.",
    "Human and JSON modes both require a configured valid workspace.",
    "Missing configuration, standalone context, and invalid configuration fail before prompt or inspection; configure does not initialize or repair configuration.",
    "Human editing requires stdin and stdout TTY; aw configure --json never prompts and never mutates.",
    "Visible plaintext command entry and the exact final preview are the only views that include inline command bodies.",
    "Selection screens, setting lists, ordinary views, diagnostics, cancellation, JSON, and the generated active-file plan remain body-free without inline command bodies.",
  ].join("\n");
  const mutations: Array<[Category, string, string]> = [
    ["descriptors", "defaults.editors.kiro.create.launch", "defaults.editors.kiro.launch"],
    ["state", "Configured means a persisted field is present", "Configured is a display label"],
    ["actions", "Keep preserves the persisted field", "Keep returns to the menu"],
    ["preview", "same bytes that save will persist", "a readable summary of the bytes"],
    ["active-file", "external state", "managed configuration state"],
    ["no-op", "exits before final confirmation or save", "continues to final confirmation and save"],
    ["invocation", "fail before prompt or inspection", "may prompt or inspect before failure"],
    ["secrecy", "remain body-free without inline command bodies", "include inline command bodies"],
  ];
  try {
    mkdirSync(fixtureRoot, { recursive: true });
    const fixturePath = path.join(fixtureRoot, "configure-guidance.md");
    const validErrors: string[] = [];
    checkGuidance("configure-guidance.md", valid, validErrors);
    assert.deepEqual(validErrors, [], `valid configure self-test fixture failed: ${validErrors.join("; ")}`);
    for (const [category, before, after] of mutations) {
      assert.ok(valid.includes(before), `controlled ${category} mutation source is absent`);
      writeFileSync(fixturePath, valid.replace(before, after));
      const errors: string[] = [];
      checkGuidance("configure-guidance.md", readFileSync(fixturePath, "utf8"), errors);
      assert.ok(
        errors.some((error) => error.includes(`[${category}]`)),
        `controlled ${category} mutation was not rejected: ${errors.join("; ")}`,
      );
    }
    const contradictions: Array<[Category, string]> = [
      ["active-file", `${valid}\nExisting active native files may be overwritten after confirmation.`],
      ["no-op", `${valid}\nUnchanged serialized bytes are still saved.`],
      ["invocation", `${valid}\naw configure --json prompts before it mutates configuration.`],
      ["secrecy", `${valid}\nOrdinary diagnostics reveal inline command bodies.`],
    ];
    for (const [category, fixture] of contradictions) {
      const errors: string[] = [];
      checkGuidance("configure-guidance.md", fixture, errors);
      assert.ok(errors.some((error) => error.includes(`[${category}]`)), `controlled ${category} contradiction was not rejected`);
    }

    const descriptorAdversaries: Array<[string, string]> = [
      ["unsupported extra descriptor", valid.replace("`reposDir`,", "`reposDir`, `unsupported.setting`,")],
      ["descriptor suffix lookalike", valid.replace("`reposDir`,", "`reposDirectory`,")],
      [
        "identity boundary suffix collision",
        valid.replace(
          "`repos.<name>.path` and",
          "`repos.<name>.pathSuffix` and `repos.<name>.path` and",
        ),
      ],
    ];
    const missedAdversaries: string[] = [];
    for (const [label, fixture] of descriptorAdversaries) {
      const errors: string[] = [];
      checkGuidance("configure-guidance.md", fixture, errors);
      if (!errors.some((error) => error.includes("[descriptors]"))) missedAdversaries.push(label);
    }

    const thirdDisclosureView = valid.replace(
      "Visible plaintext command entry and the exact final preview are the only views that include inline command bodies.",
      "Visible plaintext command entry, a selection screen, and the exact final preview are the three views that include inline command bodies.",
    );
    const disclosureErrors: string[] = [];
    checkGuidance("configure-guidance.md", thirdDisclosureView, disclosureErrors);
    if (!disclosureErrors.some((error) => error.includes("[secrecy]"))) {
      missedAdversaries.push("third disclosure view");
    }
    assert.deepEqual(missedAdversaries, [], `controlled adversarial fixtures were not rejected`);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function runReachabilitySelfTest(): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-configure-docs-reachability-"));
  try {
    mkdirSync(path.join(fixtureRoot, "scripts"), { recursive: true });
    mkdirSync(path.join(fixtureRoot, ".github", "workflows"), { recursive: true });
    writeFileSync(
      path.join(fixtureRoot, "package.json"),
      `${JSON.stringify({ scripts: { "validate:configure-docs": `pnpm sync:content && node scripts/${checkerName}`, validate: "pnpm validate:semantic-docs" } })}\n`,
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
