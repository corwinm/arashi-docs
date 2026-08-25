import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const checkerName = "check-worktree-naming-docs.ts";
const failures: string[] = [];

const expectedConfiguration = {
  worktreeNaming: {
    style: "repo-branch",
    branchSlashes: "flatten",
    maxPathLength: 180,
  },
};
const expectedStyles = ["default", "branch", "repo-branch"];
const expectedSlashPolicies = ["preserve", "flatten"];
const expectedRows = [
  ["Bare", "default", "preserve", "example/feature/auth"],
  ["Bare", "default", "flatten", "example/feature-auth"],
  ["Bare", "branch", "preserve", "feature/auth"],
  ["Bare", "branch", "flatten", "feature-auth"],
  ["Bare", "repo-branch", "preserve", "example-feature/auth"],
  ["Bare", "repo-branch", "flatten", "example-feature-auth"],
  ["Non-bare", "default", "preserve", "feature/auth"],
  ["Non-bare", "default", "flatten", "feature-auth"],
  ["Non-bare", "branch", "preserve", "feature/auth"],
  ["Non-bare", "branch", "flatten", "feature-auth"],
  ["Non-bare", "repo-branch", "preserve", "example-feature/auth"],
  ["Non-bare", "repo-branch", "flatten", "example-feature-auth"],
] as const;

const requiredClaims = [
  ["configured root scope", "root `worktreeNaming` object"],
  ["direct authored scope", "not available in interactive `aw configure`; edit `.arashi/config.json` directly"],
  ["default style omission", "Omitting `style` means `default`"],
  ["preserve slash omission", "omitting `branchSlashes` means `preserve`"],
  ["no automatic persistence", "does not auto-persist either default"],
  ["no automatic migration", "does not migrate existing configuration"],
  ["optional positive integer budget", "`maxPathLength` is an optional positive integer from 1 through 2,147,483,647"],
  [
    "full absolute UTF-16 scope",
    "limits each full absolute newly planned configured-worktree destination in UTF-16 code units",
  ],
  ["budget omission preservation", "Omitting `maxPathLength` preserves current path bytes"],
  ["no budget default persistence or migration", "does not persist or migrate a default"],
  [
    "deterministic parent shortening",
    "shortens the generated parent namespace to a readable prefix followed by `-` and the first eight lowercase SHA-256 hex characters of the portable ordinary namespace",
  ],
  [
    "complete coordinated sizing",
    "sizes one parent against all selected coordinated child paths",
  ],
  ["unchanged child-relative paths", "child-relative paths remain unchanged"],
  [
    "pre-mutation impossible-topology failure",
    "reports `WORKTREE_PATH_LENGTH_EXCEEDED` before mutation",
  ],
  ["new configured paths only", "Only newly planned configured paths may shorten"],
  ["worktree-root reservation", "reserves space only for each worktree root"],
  [
    "no repository-file guarantee",
    "cannot guarantee repository-internal files fit",
  ],
  ["filesystem-only mapping", "changes only the filesystem path"],
  ["exact Git branch", "Git branch remains exactly `feature/auth`"],
  ["deterministic no-suffix collision", "fails deterministically instead of appending a suffix"],
  ["metadata-authoritative existing paths", "Existing worktree paths are metadata-authoritative"],
  ["no rename", "never renamed by this setting"],
  ["coordinated-child placement", "Coordinated children remain under the planned parent path using their configured child paths"],
  ["standalone isolation", "Standalone `.worktrees/<branch>` placement is unchanged"],
] as const;

const contradictions = [
  ["open style vocabulary", /(?:style|worktreeNaming\.style)[^.\n]*(?:also\s+)?(?:accepts?|allows?|supports?)[^.\n]*`?(?:ticket|custom|template)`?/i],
  ["open branchSlashes vocabulary", /branchSlashes[^.\n]*(?:also\s+)?(?:accepts?|allows?|supports?)[^.\n]*`?(?:remove|strip|custom)`?/i],
  ["reversed omission defaults", /(?:when\s+)?omitted[^.\n]*(?:style[^.\n]*`branch`|branchSlashes[^.\n]*`flatten`)/i],
  ["root-level naming fields", /(?:same\s+)?fields?[^.\n]*(?:authored|placed|stored)[^.\n]*(?:JSON\s+)?root/i],
  ["interactive naming edit", /interactive\s+`?aw configure`?[^.\n]*(?:can|may|does)[^.\n]*(?:edit|configure|change)[^.\n]*worktreeNaming/i],
  ["Git branch rewrite", /(?:rewrites?|changes?)[^.\n]*Git branch[^.\n]*`feature-auth`/i],
  ["collision suffix fallback", /(?:^|[.!?]\s+)On\s+(?:a\s+)?collision[^.\n]*(?:retries?|appends?|uses?)[^.\n]*(?:numeric\s+)?suffix/im],
  ["existing-worktree relocation", /(?:changing|naming)[^.\n]*(?<!not )(?:relocates?|renames?|moves?)[^.\n]*existing[^.\n]*worktrees?/i],
  ["coordinated-child policy reapplication", /coordinated child[^.\n]*(?:reappl(?:y|ies)|independent)[^.\n]*naming/i],
  ["standalone policy expansion", /standalone[^.\n]*(?:also\s+)?(?:honors?|uses?|follows?)[^.\n]*worktreeNaming/i],
  [
    "component-only budget scope",
    /(?:(?:maxPathLength|path\s+budget|configured\s+limit)[^.\n]*(?:applies?|limits?|measures?|counts?)[^.\n]*only[^.\n]*(?:folder|directory|namespace)\s+component|only[^.\n]*(?:folder|directory|namespace)\s+component[^.\n]*(?:counts?|contributes?)[^.\n]*(?:configured\s+limit|path\s+budget))/i,
    true,
  ],
  [
    "automatic Windows budget default",
    /(?:(?:Windows|Arashi)[^.\n]*(?:automatically[^.\n]*)?(?:defaults?|sets?|chooses?|uses?)[^.\n]*(?:automatically[^.\n]*)?(?:maxPathLength|configured\s+limit|path\s+(?:budget|limit)|platform\s+default|260)|maxPathLength[^.\n]*(?:automatically|by\s+default)[^.\n]*(?:defaults?|sets?|chooses?)[^.\n]*Windows)/i,
    true,
  ],
  [
    "non-UTF-16 measurement",
    /(?:(?:maxPathLength|path\s+budget|path\s+length|configured\s+limit)[^.\n]*(?:measured|counted|uses?)[^.\n]*(?:UTF-8|bytes|Unicode\s+code\s+points?)|(?:Arashi|the\s+setting)[^.\n]*(?:measures?|counts?)[^.\n]*(?:configured\s+limit|maxPathLength|path\s+(?:budget|limit))[^.\n]*(?:UTF-8|bytes|Unicode\s+code\s+points?))/i,
    true,
  ],
  [
    "numeric shortening suffix",
    /(?:shorten(?:ed|ing)?\s+(?:names?|paths?)?|fitted|path\s+budget)[^.\n]*(?:suffix[^.\n]*(?:numeric|number|increment)|(?:appends?|uses?|receives?)[^.\n]*(?:incrementing\s+number|numeric\s+suffix))/i,
    true,
  ],
  [
    "independent child shortening",
    /(?:each\s+)?(?:coordinated\s+)?child[^.\n]*(?:shortens?|computes?|calculates?)[^.\n]*(?:independent|its\s+own|their\s+own)[^.\n]*parent|(?:each\s+)?(?:coordinated\s+)?child[^.\n]*(?:shortens?|computes?|calculates?)[^.\n]*parent[^.\n]*(?:independent|separate|own)/i,
    true,
  ],
  [
    "repository-file guarantee",
    /(?:maxPathLength|path\s+budget|enabling\s+the\s+budget|configured\s+limit|this\s+setting)[^.\n]*guarantees?[^.\n]*(?:all\s+|every\s+)?(?:repository[^.\n]*)?files?[^.\n]*fit/i,
    true,
  ],
  [
    "existing rename from budget",
    /(?:(?:changing|setting|adding)[^.\n]*(?:maxPathLength|path\s+budget|configured\s+limit)[^.\n]*renames?[^.\n]*existing[^.\n]*worktrees?|existing[^.\n]*worktrees?[^.\n]*(?:are\s+)?renamed[^.\n]*(?:budget|limit|maxPathLength)[^.\n]*changes?)/i,
    true,
  ],
  [
    "standalone budget application",
    /standalone[^.\n]*(?:applies?|honors?|uses?|follows?)[^.\n]*(?:maxPathLength|configured\s+limit|path\s+(?:budget|limit)|the\s+limit)/i,
    true,
  ],
] as const;

const truthfulNegation =
  /\b(?:do|does|is|are|was|were|can|could|will|would|may|might|must|should)\s+not\b|\b(?:cannot|never)\b|n't\b/i;

function containsContradiction(content: string, pattern: RegExp, negationAware: boolean): boolean {
  if (!negationAware) return pattern.test(content);
  return content
    .split(/(?<=[.!?])\s+|\n+|\s*,?\s*\b(?:but|however|yet)\b\s*|;\s*/u)
    .some((fragment) => pattern.test(fragment) && !truthfulNegation.test(fragment));
}

type DetailedSurface = {
  label: string;
  relativePath: string;
  pageSource?: string;
  heading: string;
};

const detailedSurfaces: DetailedSurface[] = [
  { label: "docs/workflows/config.md", relativePath: "docs/workflows/config.md", heading: "## Worktree naming" },
  { label: "docs/commands/create.md", relativePath: "docs/commands/create.md", heading: "## Worktree locations" },
  { label: "public/workflows/config.md", relativePath: "public/workflows/config.md", heading: "## Worktree naming" },
  { label: "public/commands/create.md", relativePath: "public/commands/create.md", heading: "## Worktree locations" },
  {
    label: "public/llms-full.txt config page",
    relativePath: "public/llms-full.txt",
    pageSource: "https://arashi.haphazard.dev/workflows/config/",
    heading: "## Worktree naming",
  },
  {
    label: "public/llms-full.txt create page",
    relativePath: "public/llms-full.txt",
    pageSource: "https://arashi.haphazard.dev/commands/create/",
    heading: "## Worktree locations",
  },
];

for (const surface of detailedSurfaces) {
  const content = read(surface.relativePath);
  if (content === null) continue;
  const page = surface.pageSource === undefined ? content : extractPage(content, surface.pageSource, surface.label);
  if (page === null) continue;
  const section = extractSection(page, surface.heading, surface.label);
  if (section === null) continue;
  checkDetailedSection(surface.label, section);
}

checkCompactContract("public/llms.txt", read("public/llms.txt"), false);
checkCompactContract(
  "scripts/generate-agent-exports.ts",
  read("scripts/generate-agent-exports.ts")?.replaceAll("\\`", "`") ?? null,
  true,
);
checkReachability();

if (failures.length > 0) {
  console.error("Worktree-naming documentation contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Worktree-naming documentation contract passed for ${detailedSurfaces.length} scoped canonical/generated surfaces and 2 compact export surfaces.`,
);

function read(relativePath: string): string | null {
  try {
    return readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    failures.push(`${relativePath} is missing`);
    return null;
  }
}

function extractPage(content: string, source: string, label: string): string | null {
  const marker = `Source: ${source}`;
  const markerIndex = content.indexOf(marker);
  if (markerIndex < 0) {
    failures.push(`${label} is missing its generated page boundary`);
    return null;
  }
  const boundary = "\n---\n\n# ";
  const pageStart = content.lastIndexOf(boundary, markerIndex);
  const nextPage = content.indexOf(boundary, markerIndex + marker.length);
  return content.slice(pageStart < 0 ? 0 : pageStart + boundary.length - 2, nextPage < 0 ? content.length : nextPage);
}

function extractSection(content: string, heading: string, label: string): string | null {
  const start = content.indexOf(heading);
  if (start < 0) {
    failures.push(`${label} is missing the scoped ${heading} section`);
    return null;
  }
  const nextHeading = content.indexOf("\n## ", start + heading.length);
  return content.slice(start, nextHeading < 0 ? content.length : nextHeading);
}

function checkDetailedSection(label: string, section: string): void {
  const jsonFences = [...section.matchAll(/```json\s*\n([\s\S]*?)\n```/g)];
  if (jsonFences.length !== 1) {
    failures.push(`${label} must contain exactly one scoped worktreeNaming JSON example`);
  } else {
    try {
      const parsed = JSON.parse(jsonFences[0][1]);
      if (JSON.stringify(parsed) !== JSON.stringify(expectedConfiguration)) {
        failures.push(`${label} worktreeNaming JSON example must match the exact nested object`);
      }
    } catch {
      failures.push(`${label} worktreeNaming JSON example must be valid JSON`);
    }
  }

  checkEnum(label, section, "style", expectedStyles);
  checkEnum(label, section, "branchSlashes", expectedSlashPolicies);

  const rows = [...section.matchAll(/^\|\s*(Bare|Non-bare)\s+`(default|branch|repo-branch)`\s+\+\s+`(preserve|flatten)`\s*\|\s*`([^`]+)`\s*\|\s*$/gm)].map(
    (match) => [match[1], match[2], match[3], match[4]],
  );
  if (JSON.stringify(rows) !== JSON.stringify(expectedRows)) {
    failures.push(`${label} must contain the exact ordered 12-row topology × style × slash mapping table`);
  }

  for (const [claimLabel, claim] of requiredClaims) {
    if (!section.includes(claim)) failures.push(`${label} is missing ${claimLabel}`);
  }
  checkContradictions(label, section);
}

function checkEnum(label: string, section: string, field: string, expected: string[]): void {
  const expression = new RegExp("^- `" + field + "`:\\s*(.+)$", "m");
  const match = section.match(expression);
  if (match === null) {
    failures.push(`${label} is missing the closed ${field} declaration`);
    return;
  }
  const declaration = match[1].match(/^`([^`]+)`$/);
  const values = declaration === null ? [] : declaration[1].split(" | ");
  if (JSON.stringify(values) !== JSON.stringify(expected)) {
    failures.push(`${label} must declare the exact closed ${field} vocabulary: ${expected.join(" | ")}`);
  }
}

function checkCompactContract(label: string, content: string | null, template: boolean): void {
  if (content === null) return;
  const start = content.indexOf("- Configure new worktree paths in the root `worktreeNaming` object:");
  const endMarker = "- Configure switching with one `defaults.switch.mode`";
  const end = content.indexOf(endMarker, start);
  if (start < 0 || end < 0) {
    failures.push(`${label} is missing the scoped compact worktree-naming export block`);
    return;
  }
  const block = content.slice(start, end);
  const expectedLead = "The closed values are `style`: `default | branch | repo-branch` and `branchSlashes`: `preserve | flatten`. Omitting `style` means `default`, and omitting `branchSlashes` means `preserve`; Arashi does not auto-persist either default and does not migrate existing configuration.";
  const expectedScope = "edit `.arashi/config.json` directly. This initial slice is not available in interactive `aw configure`.";
  if (!block.includes(expectedLead)) failures.push(`${label} is missing exact closed enums and omission defaults`);
  if (!block.includes(expectedScope)) failures.push(`${label} is missing direct authored scope`);

  const mappings = [...block.matchAll(/(bare|Non-bare)\s+`(default|branch|repo-branch)`\s+\+\s+`(preserve|flatten)`\s+\|\s+`([^`]+)`/g)].map(
    (match) => [match[1] === "bare" ? "Bare" : match[1], match[2], match[3], match[4]],
  );
  if (JSON.stringify(mappings) !== JSON.stringify(expectedRows)) {
    failures.push(`${label} must contain the exact ordered 12-entry compact destination mapping`);
  }

  for (const [claimLabel, claim] of requiredClaims.slice(17)) {
    const compactClaim = claimLabel === "filesystem-only mapping" ? "changes only the filesystem path" : claim;
    if (!block.includes(compactClaim)) failures.push(`${label} is missing ${claimLabel}`);
  }
  for (const [claimLabel, claim] of requiredClaims.slice(6, 17)) {
    if (!block.includes(claim)) failures.push(`${label} is missing ${claimLabel}`);
  }
  checkContradictions(label, block);

  if (template && !content.includes("writePublicFile(\"llms.txt\", renderLlmsTxt())")) {
    failures.push(`${label} must remain the producer for llms.txt`);
  }
}

function checkContradictions(label: string, content: string): void {
  for (const [claimLabel, pattern, negationAware = false] of contradictions) {
    if (containsContradiction(content, pattern, negationAware)) {
      failures.push(`${label} contains contradictory ${claimLabel}`);
    }
  }
  checkDestinationMappingContradictions(label, content);
  checkCollisionCarveOuts(label, content);
}

function checkDestinationMappingContradictions(label: string, content: string): void {
  const statements = content.split(/(?<=[.!?])\s+|\n+/);
  for (const statement of statements) {
    const topology = /\bnon-bare\b/i.test(statement)
      ? "Non-bare"
      : /\bbare(?:\s+workspaces?)?\b/i.test(statement)
        ? "Bare"
        : null;
    const style = /\brepo-branch\b/i.test(statement)
      ? "repo-branch"
      : /\bdefault\b/i.test(statement)
        ? "default"
        : /\bbranch\b/i.test(statement)
          ? "branch"
          : null;
    const slashes = /\bpreserve\b/i.test(statement)
      ? "preserve"
      : /\bflatten\b/i.test(statement)
        ? "flatten"
        : null;
    const destinationPatterns = [
      /\b(?:maps?|resolves?|places?|puts?|leads?)\b[^.\n]*?\b(?:to|as|at)\s+`?([A-Za-z0-9][A-Za-z0-9_./-]*)`?/i,
      /\b(?:yields?|produces?)\s+`?([A-Za-z0-9][A-Za-z0-9_./-]*)`?/i,
      /\b(?:results?\s+in|ends?\s+up\s+at)\s+`?([A-Za-z0-9][A-Za-z0-9_./-]*)`?/i,
      /\bis\s+placed\s+at\s+`?([A-Za-z0-9][A-Za-z0-9_./-]*)`?/i,
      /\b(?:destination|resulting\s+path)\b[^.\n]*?\bis\s+(?!not\b)`?([A-Za-z0-9][A-Za-z0-9_./-]*)`?/i,
    ];
    const match = destinationPatterns
      .map((pattern) => statement.match(pattern))
      .find((candidate) => candidate !== null);
    const destination = match?.[1];
    if (topology === null || style === null || slashes === null || destination === undefined) continue;
    const claimPrefix = statement.slice(0, match?.index ?? 0);
    const negated = /\b(?:(?:does|do|is|are|will|can)\s+not|doesn't|don't|isn't|aren't|won't|cannot|can't)\b[^.\n]{0,24}$/i.test(
      claimPrefix,
    );
    if (negated) continue;
    const expected = expectedRows.find(
      ([rowTopology, rowStyle, rowSlashes]) =>
        rowTopology === topology && rowStyle === style && rowSlashes === slashes,
    )?.[3];
    if (expected !== undefined && destination !== expected) {
      failures.push(
        `${label} contains contradictory destination mapping for ${topology} ${style} + ${slashes}`,
      );
    }
  }
}

function checkCollisionCarveOuts(label: string, content: string): void {
  const statements = content.split(/(?<=[.!?])\s+|\n+/);
  for (const statement of statements) {
    if (!/\b(?:collision|conflict)\b/i.test(statement)) continue;
    const mentionsAlternate =
      /\bsuffix\b/i.test(statement) ||
      /\b(?:another|alternate|alternative|different|distinct)\b[^.\n]{0,40}\b(?:destination|name|path)\b/i.test(
        statement,
      );
    if (!mentionsAlternate) continue;
    const negatesFallback =
      /\b(?:never|without)\b[^.\n]{0,80}\b(?:append|add|use|choose|retry|fallback|fall\s+back)/i.test(
        statement,
      ) ||
      /\binstead\s+of\b[^.\n]{0,60}\b(?:append|add|use|choose|retry|fallback|fall\s+back)/i.test(
        statement,
      ) ||
      /\b(?:does|do|will|can)\s+not\b[^.\n]{0,60}\b(?:append|add|use|choose|select|pick|retry|fallback|fall\s+back)/i.test(
        statement,
      ) ||
      /\b(?:cannot|can't)\b[^.\n]{0,60}\b(?:append|add|use|choose|select|pick|retry|fallback|fall\s+back)/i.test(
        statement,
      );
    const permitsFallback =
      /\b(?:may|can|might|will)\s+(?:append|add|use|choose|select|pick|retry|fall\s+back)/i.test(statement) ||
      /\b(?:falls?\s+back|retries?\s+with|appends?|adds?|uses?|chooses?|selects?|picks?)\b/i.test(statement) ||
      /\bis\s+(?:resolved|handled)\s+by\s+(?:append|add|use|choos)/i.test(statement);
    if (permitsFallback && !negatesFallback) {
      failures.push(`${label} contains contradictory collision fallback`);
    }
  }
}

function checkReachability(): void {
  let packageJson: { scripts?: Record<string, string> };
  try {
    packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  } catch {
    failures.push("package.json is missing or invalid JSON");
    return;
  }
  const focused = `pnpm sync:content && node scripts/${checkerName}`;
  if (packageJson.scripts?.["validate:worktree-naming-docs"] !== focused) {
    failures.push("package.json must define validate:worktree-naming-docs");
  }
  if (!packageJson.scripts?.validate?.includes("pnpm validate:semantic-docs")) {
    failures.push("package.json validate must retain the stable semantic docs aggregate");
  }

  try {
    const manifest = JSON.parse(
      readFileSync(path.join(root, "scripts/semantic-doc-checks.json"), "utf8"),
    ) as unknown;
    if (!Array.isArray(manifest) || !manifest.includes(checkerName)) {
      failures.push(`scripts/semantic-doc-checks.json must register ${checkerName}`);
    }
  } catch {
    failures.push("scripts/semantic-doc-checks.json is missing or invalid JSON");
  }

  const workflow = read(".github/workflows/docs-validate.yml");
  if (workflow === null) return;
  if (!/^\s*run:\s*pnpm validate\s*$/m.test(workflow)) {
    failures.push("docs workflow must execute the stable pnpm validate aggregate");
  }
  if (workflow.includes(checkerName)) {
    failures.push("docs workflow must not name the focused worktree naming checker");
  }
}
