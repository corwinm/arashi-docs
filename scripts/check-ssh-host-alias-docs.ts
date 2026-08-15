import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const requirements = new Map<string, string[]>([
  [
    "docs/commands/add.md",
    [
      "`[user@]host:path`",
      "`git@work-github:acme/api.git`",
      "`work-github:acme/api.git`",
      "`ssh://git@work-github/acme/api.git`",
      "normalizes outer whitespace once",
      "passes that exact normalized URL to Git",
      "stores it unchanged in `.arashi/config.json`"
    ]
  ],
  [
    "docs/commands/clone.md",
    [
      "keeps every configured SSH URL byte-for-byte",
      "never converts an SSH URL to HTTPS",
      "Git and OpenSSH resolve the host and authenticate",
      "does not read, resolve, or edit `~/.ssh/config`",
      "does not run a separate SSH connectivity probe",
      "continues with the remaining selected repositories"
    ]
  ],
  [
    "docs/workflows/config.md",
    [
      "SSH aliases are machine-local",
      "define the same alias",
      "commit a canonical remote",
      "`url.<base>.insteadOf`",
      "machine-global Git configuration",
      "`~/.gitconfig`",
      "`--global`",
      "[url \"git@work-github:\"]",
      "insteadOf = git@github.com:",
      "Arashi does not install or synchronize this Git configuration"
    ]
  ],
  [
    "public/commands/add.md",
    [
      "`[user@]host:path`",
      "`git@work-github:acme/api.git`",
      "`work-github:acme/api.git`",
      "`ssh://git@work-github/acme/api.git`",
      "passes that exact normalized URL to Git"
    ]
  ],
  [
    "public/commands/clone.md",
    [
      "keeps every configured SSH URL byte-for-byte",
      "never converts an SSH URL to HTTPS",
      "Git and OpenSSH resolve the host and authenticate",
      "does not run a separate SSH connectivity probe"
    ]
  ],
  [
    "public/workflows/config.md",
    [
      "SSH aliases are machine-local",
      "commit a canonical remote",
      "`url.<base>.insteadOf`",
      "machine-global Git configuration",
      "`--global`",
      "Arashi does not install or synchronize this Git configuration"
    ]
  ],
  [
    "public/llms.txt",
    [
      "SSH aliases are machine-local",
      "preserves configured SSH URLs exactly",
      "never maps them to HTTPS automatically",
      "machine-global Git `url.<base>.insteadOf`",
      "SSH alias guidance",
      "https://arashi.haphazard.dev/workflows/config/"
    ]
  ],
  [
    "public/llms-full.txt",
    [
      "Source: https://arashi.haphazard.dev/commands/add/",
      "Source: https://arashi.haphazard.dev/commands/clone/",
      "Source: https://arashi.haphazard.dev/workflows/config/",
      "`git@work-github:acme/api.git`",
      "`work-github:acme/api.git`",
      "`ssh://git@work-github/acme/api.git`",
      "keeps every configured SSH URL byte-for-byte",
      "never converts an SSH URL to HTTPS",
      "does not read, resolve, or edit `~/.ssh/config`",
      "SSH aliases are machine-local",
      "`url.<base>.insteadOf`",
      "machine-global Git configuration",
      "`--global`"
    ]
  ]
]);

const forbiddenGuidance = [
  {
    text: "https://work-github/acme/api.git",
    message: "must not present an automatically fabricated HTTPS URL for an SSH alias"
  },
  {
    text: "Arashi manages SSH configuration",
    message: "must not claim that Arashi manages SSH configuration"
  },
  {
    text: "Arashi validates SSH credentials before cloning",
    message: "must not claim that Arashi probes SSH credentials"
  },
  {
    text: "use local Git `url.<base>.insteadOf` rewriting",
    message: "must not imply that repository-local Git configuration applies to later clones"
  }
];

const root = path.resolve(process.cwd());
const errors = checkRoot(root);
if (errors.length > 0) {
  printErrors(errors);
  process.exit(1);
}

runOutOfRepositorySelfTests(root);
console.log(
  `SSH host-alias documentation contract passed for ${requirements.size} source/export surfaces and rejected every deliberate semantic and validation-wiring drift.`
);

function checkRoot(rootPath: string): string[] {
  const found: string[] = [];
  for (const [relativePath, expectedText] of requirements) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    for (const text of expectedText) {
      if (!content.includes(text)) {
        found.push(`${relativePath} is missing ${JSON.stringify(text)}`);
      }
    }
  }

  checkForbiddenGuidance(rootPath, found);
  checkValidationReachability(rootPath, found);
  return found;
}

function checkForbiddenGuidance(rootPath: string, found: string[]): void {
  for (const relativePath of requirements.keys()) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    for (const forbidden of forbiddenGuidance) {
      if (content.includes(forbidden.text)) {
        found.push(`${relativePath} ${forbidden.message}`);
      }
    }
  }
}

function checkValidationReachability(rootPath: string, found: string[]): void {
  const packageJson = parseJson(rootPath, "package.json", found);
  const focusedCommand = "pnpm sync:content && node scripts/check-ssh-host-alias-docs.ts";
  if (packageJson !== null) {
    if (packageJson.scripts?.["validate:ssh-host-alias-docs"] !== focusedCommand) {
      found.push("package.json must define validate:ssh-host-alias-docs");
    }
    if (!packageJson.scripts?.validate?.includes("pnpm validate:ssh-host-alias-docs")) {
      found.push("package.json validate must run validate:ssh-host-alias-docs");
    }
  }

  const workflow = read(rootPath, ".github/workflows/docs-validate.yml", found);
  if (workflow !== null && !workflow.includes("run: pnpm validate:ssh-host-alias-docs")) {
    found.push(".github/workflows/docs-validate.yml must run pnpm validate:ssh-host-alias-docs");
  }
}

function runOutOfRepositorySelfTests(sourceRoot: string): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-ssh-alias-docs-"));
  try {
    for (const relativePath of new Set([
      ...requirements.keys(),
      "package.json",
      ".github/workflows/docs-validate.yml"
    ])) {
      const destination = path.join(fixtureRoot, relativePath);
      mkdirSync(path.dirname(destination), { recursive: true });
      cpSync(path.join(sourceRoot, relativePath), destination);
    }

    for (const [relativePath, expectedText] of requirements) {
      for (const text of expectedText) {
        const target = path.join(fixtureRoot, relativePath);
        const valid = readFileSync(target, "utf8");
        const drifted = valid.replaceAll(text, "[deliberate semantic drift]");
        if (drifted === valid || drifted.includes(text)) {
          throw new Error(`SSH host-alias checker self-test could not remove ${JSON.stringify(text)} from ${relativePath}.`);
        }
        writeFileSync(target, drifted);
        const mismatchErrors = checkRoot(fixtureRoot);
        if (!mismatchErrors.some((error) => error === `${relativePath} is missing ${JSON.stringify(text)}`)) {
          throw new Error(`SSH host-alias checker self-test did not reject missing ${JSON.stringify(text)} in ${relativePath}.`);
        }
        writeFileSync(target, valid);
      }
    }

    const forbiddenTarget = path.join(fixtureRoot, "docs/commands/clone.md");
    for (const forbidden of forbiddenGuidance) {
      const valid = readFileSync(forbiddenTarget, "utf8");
      writeFileSync(forbiddenTarget, `${valid}\n${forbidden.text}\n`);
      const mismatchErrors = checkRoot(fixtureRoot);
      if (!mismatchErrors.some((error) => error.includes(forbidden.message))) {
        throw new Error(`SSH host-alias checker self-test did not reject ${JSON.stringify(forbidden.text)}.`);
      }
      writeFileSync(forbiddenTarget, valid);
    }

    const packagePath = path.join(fixtureRoot, "package.json");
    const validPackage = readFileSync(packagePath, "utf8");
    writeFileSync(packagePath, validPackage.replaceAll("validate:ssh-host-alias-docs", "validate:ssh-alias-drift"));
    let mismatchErrors = checkRoot(fixtureRoot);
    if (!mismatchErrors.some((error) => error.includes("package.json must define"))) {
      throw new Error("SSH host-alias checker self-test did not reject focused-script drift.");
    }
    writeFileSync(packagePath, validPackage);

    const workflowPath = path.join(fixtureRoot, ".github/workflows/docs-validate.yml");
    const validWorkflow = readFileSync(workflowPath, "utf8");
    writeFileSync(workflowPath, validWorkflow.replaceAll("run: pnpm validate:ssh-host-alias-docs", "run: pnpm validate:ssh-alias-drift"));
    mismatchErrors = checkRoot(fixtureRoot);
    if (!mismatchErrors.some((error) => error.includes(".github/workflows/docs-validate.yml must run"))) {
      throw new Error("SSH host-alias checker self-test did not reject CI-wiring drift.");
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function parseJson(rootPath: string, relativePath: string, found: string[]): any | null {
  const raw = read(rootPath, relativePath, found);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    found.push(`${relativePath} is not valid JSON`);
    return null;
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

function printErrors(found: string[]): void {
  console.error("SSH host-alias documentation contract failed:");
  for (const error of found) console.error(`- ${error}`);
}
