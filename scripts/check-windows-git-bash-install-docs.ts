import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const landingRequirements = [
  "canonical PowerShell installer",
  "Git Bash",
  "new Git Bash window"
];

const installationRequirements = [
  "canonical Windows installer",
  "extensionless `arashi` command for Git Bash",
  "`arashi.bin.exe`",
  "`arashi`",
  "`arashi.ps1`",
  "`arashi.bat`",
  "one GitHub release",
  "`arashi-checksums.txt`",
  "Verify all four payload assets against `arashi-checksums.txt`",
  "persistent user PATH",
  "new Git Bash window",
  "does not edit Git Bash profile files"
];

const troubleshootingRequirements = [
  "Git Bash reports `arashi: command not found`",
  "open a new Git Bash window",
  "persistent user PATH",
  "`-NoModifyPath`",
  "add the install directory to PATH yourself",
  "Do not add an installer-managed entry to `.bashrc`, `.bash_profile`, or `.profile`"
];

const requirements = new Map<string, string[]>([
  ["docs/index.mdx", landingRequirements],
  ["docs/getting-started/index.md", [...installationRequirements, ...troubleshootingRequirements]],
  ["public/index.md", landingRequirements],
  ["public/getting-started.md", [...installationRequirements, ...troubleshootingRequirements]],
  [
    "public/llms.txt",
    [
      "canonical PowerShell installer",
      "Git Bash",
      "new Git Bash window",
      "https://arashi.haphazard.dev/getting-started/"
    ]
  ],
  [
    "public/llms-full.txt",
    [...landingRequirements, ...installationRequirements, ...troubleshootingRequirements]
  ]
]);

const root = path.resolve(process.cwd());
const errors = checkRoot(root);
if (errors.length > 0) {
  console.error("Windows Git Bash installation documentation contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

runOutOfRepositoryMismatchTest(root);
console.log(
  `Windows Git Bash installation documentation contract passed for ${requirements.size} canonical/generated surfaces and rejected a deliberate out-of-repository mismatch.`
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

  checkValidationWiring(rootPath, found);
  return found;
}

function checkValidationWiring(rootPath: string, found: string[]): void {
  const packageJsonRaw = read(rootPath, "package.json", found);
  if (packageJsonRaw !== null) {
    try {
      const packageJson = JSON.parse(packageJsonRaw);
      if (
        packageJson.scripts?.["validate:windows-git-bash-install-docs"] !==
        "pnpm sync:content && node scripts/check-windows-git-bash-install-docs.ts"
      ) {
        found.push("package.json must define validate:windows-git-bash-install-docs");
      }
      if (!packageJson.scripts?.validate?.includes("pnpm validate:windows-git-bash-install-docs")) {
        found.push("package.json validate must run validate:windows-git-bash-install-docs");
      }
    } catch {
      found.push("package.json is not valid JSON");
    }
  }

  const workflow = read(rootPath, ".github/workflows/docs-validate.yml", found);
  if (
    workflow !== null &&
    !workflow.includes("run: pnpm validate:windows-git-bash-install-docs")
  ) {
    found.push(
      ".github/workflows/docs-validate.yml must run pnpm validate:windows-git-bash-install-docs"
    );
  }
}

function runOutOfRepositoryMismatchTest(sourceRoot: string): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-windows-git-bash-docs-"));
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

    const gettingStartedPath = path.join(fixtureRoot, "docs/getting-started/index.md");
    const valid = readFileSync(gettingStartedPath, "utf8");
    writeFileSync(
      gettingStartedPath,
      valid
        .replaceAll("one GitHub release", "different GitHub releases")
        .replaceAll(
          "Verify all four payload assets against `arashi-checksums.txt`",
          "Copy the payload without verification"
        )
    );
    const mismatchErrors = checkRoot(fixtureRoot);
    if (!mismatchErrors.some((error) => error.includes('"one GitHub release"'))) {
      throw new Error(
        "Windows Git Bash installation documentation checker self-test failed to reject a deliberate same-release mismatch."
      );
    }
    if (
      !mismatchErrors.some((error) =>
        error.includes('"Verify all four payload assets against `arashi-checksums.txt`"')
      )
    ) {
      throw new Error(
        "Windows Git Bash installation documentation checker self-test failed to reject missing four-file checksum verification."
      );
    }
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
