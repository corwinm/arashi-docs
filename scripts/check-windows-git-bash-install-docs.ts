import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const landingRequirements = [
  'powershell -c "irm https://arashi.haphazard.dev/install.ps1 | iex"',
  "View install.ps1"
];

const landingForbiddenText =
  "The canonical PowerShell installer also installs the `arashi` command for Git Bash.";

const installationRequirements = [
  "canonical Windows installer",
  "extensionless `arashi` command for Git Bash",
  "extensionless `aw` command for Git Bash",
  "`arashi.bin.exe`",
  "`arashi`",
  "`arashi.ps1`",
  "`arashi.bat`",
  "`aw`",
  "`aw.ps1`",
  "`aw.bat`",
  "one GitHub release",
  "`arashi-checksums.txt`",
  "Verify all seven payload assets against `arashi-checksums.txt`",
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
  ["docs/getting-started/installation.md", [...installationRequirements, ...troubleshootingRequirements]],
  ["public/index.md", landingRequirements],
  ["public/getting-started/installation.md", [...installationRequirements, ...troubleshootingRequirements]],
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

const forbiddenText = new Map<string, string[]>([
  ["docs/index.mdx", [landingForbiddenText]],
  ["public/index.md", [landingForbiddenText]]
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

  for (const [relativePath, disallowedText] of forbiddenText) {
    const content = read(rootPath, relativePath, found);
    if (content === null) continue;
    for (const text of disallowedText) {
      if (content.includes(text)) {
        found.push(`${relativePath} must not include ${JSON.stringify(text)}`);
      }
    }
  }

  return found;
}

function runOutOfRepositoryMismatchTest(sourceRoot: string): void {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "arashi-windows-git-bash-docs-"));
  try {
    for (const relativePath of new Set(requirements.keys())) {
      const destination = path.join(fixtureRoot, relativePath);
      mkdirSync(path.dirname(destination), { recursive: true });
      cpSync(path.join(sourceRoot, relativePath), destination);
    }

    const gettingStartedPath = path.join(fixtureRoot, "docs/getting-started/installation.md");
    const valid = readFileSync(gettingStartedPath, "utf8");
    writeFileSync(
      gettingStartedPath,
      valid
        .replaceAll("one GitHub release", "different GitHub releases")
        .replaceAll(
          "Verify all seven payload assets against `arashi-checksums.txt`",
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
        error.includes('"Verify all seven payload assets against `arashi-checksums.txt`"')
      )
    ) {
      throw new Error(
        "Windows Git Bash installation documentation checker self-test failed to reject missing seven-file checksum verification."
      );
    }

    const landingPath = path.join(fixtureRoot, "docs/index.mdx");
    writeFileSync(
      landingPath,
      `${readFileSync(landingPath, "utf8")}\n${landingForbiddenText}\n`
    );
    const landingErrors = checkRoot(fixtureRoot);
    if (!landingErrors.some((error) => error.includes("must not include"))) {
      throw new Error(
        "Windows Git Bash installation documentation checker self-test failed to reject verbose Git Bash guidance on the landing page."
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
