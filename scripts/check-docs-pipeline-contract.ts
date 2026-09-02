import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

interface PipelineFiles {
  docsValidate: string;
  externalLinks: string;
  netlify: string;
  packageJson: string;
}

const root = process.cwd();
const actual = inspectPipeline({
  docsValidate: read(".github/workflows/docs-validate.yml"),
  externalLinks: read(".github/workflows/docs-link-health.yml"),
  netlify: read("netlify.toml"),
  packageJson: read("package.json"),
});

runControlledDriftTests();

if (actual.length > 0) {
  console.error("Documentation pipeline contract checks failed:");
  for (const failure of actual) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Documentation pipeline contract checks passed with controlled drift coverage.",
);

function inspectPipeline(files: PipelineFiles): string[] {
  const failures: string[] = [];
  const scripts = packageScripts(files.packageJson, failures);
  checkPackageEntrypoints(scripts, failures);
  checkExternalLinkWorkflow(files.externalLinks, failures);
  checkDocsValidationWorkflow(files.docsValidate, failures);
  checkNetlifyCommand(files.netlify, scripts, failures);
  return failures;
}

function checkPackageEntrypoints(
  scripts: Record<string, string>,
  failures: string[],
): void {
  const expected = {
    "test:external-links": "node --test scripts/check-external-links.test.ts",
    "validate:pipeline-contract":
      "node scripts/check-docs-pipeline-contract.ts",
  };

  for (const [name, command] of Object.entries(expected)) {
    if (scripts[name] !== command) {
      failures.push(`package.json ${name} must be ${JSON.stringify(command)}`);
    }
    if (countPnpmScript(scripts.validate ?? "", name) !== 1) {
      failures.push(`package.json validate must invoke ${name} exactly once`);
    }
  }
}

function checkExternalLinkWorkflow(workflow: string, failures: string[]): void {
  const events = yamlChildKeys(yamlTopLevelBlock(workflow, "on"));
  if (
    JSON.stringify(events) !== JSON.stringify(["schedule", "workflow_dispatch"])
  ) {
    failures.push(
      "external-link health must have only schedule and manual dispatch triggers under on",
    );
  }

  const jobs = yamlChildKeys(yamlTopLevelBlock(workflow, "jobs"));
  if (JSON.stringify(jobs) !== JSON.stringify(["external-link-health"])) {
    failures.push("external-link health must define only its checker job");
  }
  if (/^\s*continue-on-error\s*:/m.test(workflow)) {
    failures.push("external-link health must not suppress checker failures");
  }
  if (!/uses:\s*actions\/setup-node@[0-9a-f]{40}/.test(workflow)) {
    failures.push("external-link health must use immutable actions/setup-node");
  }
  if (!/node-version:\s*["']?24\.18\.0["']?/.test(workflow)) {
    failures.push("external-link health must pin Node.js 24.18.0");
  }
  if (!/package-manager-cache:\s*false/.test(workflow)) {
    failures.push(
      "external-link health must explicitly disable setup-node package-manager caching",
    );
  }
  if (
    /pnpm\/setup|cache:\s*true|\b(?:pnpm|npm|yarn|bun)\s+(?:install|ci)\b/.test(
      workflow,
    )
  ) {
    failures.push(
      "external-link health must not install a package manager, restore its cache, or install dependencies",
    );
  }
  if (
    !/^\s*run:\s*node scripts\/check-external-links\.ts\s*$/m.test(workflow)
  ) {
    failures.push(
      "external-link health must invoke its built-in-only checker directly",
    );
  }
}

function checkDocsValidationWorkflow(
  workflow: string,
  failures: string[],
): void {
  const onBlock = yamlTopLevelBlock(workflow, "on");
  const events = yamlChildKeys(onBlock);
  if (JSON.stringify(events) !== JSON.stringify(["pull_request", "push"])) {
    failures.push("docs validation must retain pull-request and push triggers");
  }
  if (
    !/^  pull_request:\n    branches: \[main\]$/m.test(onBlock) ||
    !/^  push:\n    branches: \[main\]$/m.test(onBlock)
  ) {
    failures.push(
      "docs validation must target main for pull requests and pushes",
    );
  }
  if (!/^      - ["']\.github\/workflows\/docs-link-health\.yml["']$/m.test(onBlock)) {
    failures.push(
      "docs validation must validate external-link workflow changes on push",
    );
  }

  const jobs = yamlChildKeys(yamlTopLevelBlock(workflow, "jobs"));
  if (JSON.stringify(jobs) !== JSON.stringify(["validate"])) {
    failures.push(
      "docs validation must define only the canonical validate job",
    );
  }
  if (!/^\s*name:\s*Validate docs quality gates\s*$/m.test(workflow)) {
    failures.push(
      "docs validation must preserve the required check name Validate docs quality gates",
    );
  }

  const validationRuns = [
    ...workflow.matchAll(
      /^\s*run:\s*pnpm\s+(validate(?::[A-Za-z0-9_-]+)?)\s*$/gm,
    ),
  ].map((match) => match[1]);
  if (JSON.stringify(validationRuns) !== JSON.stringify(["validate"])) {
    failures.push(
      "docs validation must invoke only the canonical pnpm validate entrypoint",
    );
  }
  if (/check-semantic-docs-registration\.ts/.test(workflow)) {
    failures.push(
      "docs validation must not invoke semantic registration outside pnpm validate",
    );
  }
}

function checkNetlifyCommand(
  netlify: string,
  scripts: Record<string, string>,
  failures: string[],
): void {
  if (/^\[context\.[^\]]+\]\s*$/m.test(netlify)) {
    failures.push(
      "netlify contexts must inherit the canonical build command instead of overriding it",
    );
  }

  const commands = parseNetlifyCommands(netlify, failures);
  if (JSON.stringify([...commands.keys()]) !== JSON.stringify(["build"])) {
    failures.push(
      "netlify must define exactly one command in the build section",
    );
  }

  const build = commands.get("build") ?? "";
  const expectedBuild =
    "npm install --global corepack@0.35.0 && corepack enable && pnpm install --frozen-lockfile && pnpm build";
  if (build !== expectedBuild) {
    failures.push(
      "netlify must preserve pinned Corepack setup, frozen dependency installation, and pnpm build",
    );
  }
  const buildCount = countBuilds(build, scripts, new Set(), failures);
  if (buildCount !== 1) {
    failures.push(
      `netlify build command must reach exactly one Astro build, found ${buildCount}`,
    );
  }

  for (const script of [
    "validate",
    "validate:build",
    "validate:a11y",
    "validate:a11y:prepared",
    "validate:links:internal",
    "lint",
  ]) {
    if (hasPnpmCommand(build, script)) {
      failures.push(
        `netlify must leave ${script} to GitHub Actions instead of rerunning it`,
      );
    }
  }
}

function yamlTopLevelBlock(yaml: string, key: string): string {
  const lines = yaml.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start < 0) return "";
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^[^\s#][^:]*:/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

function yamlChildKeys(block: string): string[] {
  return [...block.matchAll(/^  ([A-Za-z0-9_-]+):/gm)].map((match) => match[1]);
}

function parseNetlifyCommands(
  netlify: string,
  failures: string[],
): Map<string, string> {
  const commands = new Map<string, string>();
  let section = "";
  for (const line of netlify.split(/\r?\n/)) {
    const sectionMatch = line.match(/^\[([^\]]+)\]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }
    const commandMatch = line.match(/^\s*command\s*=\s*"([^"]*)"\s*$/);
    if (commandMatch && section) commands.set(section, commandMatch[1]);
  }
  if (commands.size === 0) {
    failures.push("netlify commands could not be parsed");
  }
  return commands;
}

function packageScripts(
  packageJson: string,
  failures: string[],
): Record<string, string> {
  try {
    const parsed = JSON.parse(packageJson) as {
      scripts?: Record<string, string>;
    };
    if (!parsed.scripts) throw new Error("scripts object is missing");
    return parsed.scripts;
  } catch (error) {
    failures.push(
      `package.json scripts could not be parsed: ${formatError(error)}`,
    );
    return {};
  }
}

function countBuilds(
  command: string,
  scripts: Record<string, string>,
  visiting: Set<string>,
  failures: string[],
): number {
  let count = [...command.matchAll(/\bastro\s+build\b/g)].length;
  for (const match of command.matchAll(/\bpnpm(?:\s+run)?\s+([\w:-]+)/g)) {
    const script = match[1];
    if (!(script in scripts)) continue;
    if (visiting.has(script)) {
      failures.push(
        `package script cycle encountered while expanding ${script}`,
      );
      continue;
    }
    count += countBuilds(
      scripts[script],
      scripts,
      new Set([...visiting, script]),
      failures,
    );
  }
  return count;
}

function countPnpmScript(command: string, expected: string): number {
  return [...command.matchAll(/\bpnpm(?:\s+run)?\s+([\w:-]+)/g)].filter(
    (match) => match[1] === expected,
  ).length;
}

function hasPnpmCommand(command: string, expected: string): boolean {
  return countPnpmScript(command, expected) > 0;
}

function runControlledDriftTests(): void {
  const setupSha = "a".repeat(40);
  const valid: PipelineFiles = {
    docsValidate: `on:\n  pull_request:\n    branches: [main]\n  push:\n    branches: [main]\n    paths:\n      - "docs/**"\n      - ".github/workflows/docs-link-health.yml"\njobs:\n  validate:\n    name: Validate docs quality gates\n    steps:\n      - name: Validate documentation\n        run: pnpm validate\n`,
    externalLinks: `on:\n  schedule:\n    - cron: "0 13 * * 1"\n  workflow_dispatch:\njobs:\n  external-link-health:\n    steps:\n      - uses: actions/setup-node@${setupSha}\n        with:\n          node-version: 24.18.0\n          package-manager-cache: false\n      - name: Check external links\n        run: node scripts/check-external-links.ts\n`,
    netlify: `[build]\ncommand = "npm install --global corepack@0.35.0 && corepack enable && pnpm install --frozen-lockfile && pnpm build"\n`,
    packageJson: JSON.stringify({
      scripts: {
        build: "pnpm sync:content && astro check && astro build",
        "test:external-links":
          "node --test scripts/check-external-links.test.ts",
        validate:
          "pnpm test:external-links && pnpm validate:pipeline-contract && pnpm validate:build:prepared",
        "validate:build:prepared": "astro check && astro build",
        "validate:pipeline-contract":
          "node scripts/check-docs-pipeline-contract.ts",
      },
    }),
  };
  assert.deepEqual(inspectPipeline(valid), []);

  const drifts: Array<[string, PipelineFiles, string]> = [
    [
      "wrong default branch",
      {
        ...valid,
        docsValidate: valid.docsValidate.replace(
          "  push:\n    branches: [main]",
          "  push:\n    branches: [develop]",
        ),
      },
      "must target main",
    ],
    [
      "external-link workflow omitted from push paths",
      {
        ...valid,
        docsValidate: valid.docsValidate.replace(
          '      - ".github/workflows/docs-link-health.yml"\n',
          "",
        ),
      },
      "must validate external-link workflow changes",
    ],
    [
      "validation script lookalike",
      {
        ...valid,
        docsValidate: valid.docsValidate.replace(
          "        run: pnpm validate\n",
          "        run: pnpm validate-disabled\n",
        ),
      },
      "canonical pnpm validate entrypoint",
    ],
    [
      "extra docs job",
      {
        ...valid,
        docsValidate: `${valid.docsValidate}  publication-status:\n    steps:\n      - run: echo ready\n`,
      },
      "only the canonical validate job",
    ],
    [
      "duplicate direct registration",
      {
        ...valid,
        docsValidate: valid.docsValidate.replace(
          "        run: pnpm validate",
          "        run: node scripts/check-semantic-docs-registration.ts\n      - name: Validate documentation\n        run: pnpm validate",
        ),
      },
      "outside pnpm validate",
    ],
    [
      "schedule outside on",
      {
        ...valid,
        externalLinks: valid.externalLinks
          .replace('  schedule:\n    - cron: "0 13 * * 1"\n', "")
          .replace("jobs:\n", "env:\n  schedule: placeholder\njobs:\n"),
      },
      "triggers under on",
    ],
    [
      "expression suppresses failure",
      {
        ...valid,
        externalLinks: valid.externalLinks.replace(
          "    steps:\n",
          "    continue-on-error: ${{ true }}\n    steps:\n",
        ),
      },
      "must not suppress",
    ],
    [
      "npm dependency install",
      {
        ...valid,
        externalLinks: valid.externalLinks.replace(
          "      - name: Check external links\n        run: node scripts/check-external-links.ts",
          "      - name: Install dependencies\n        run: npm install\n      - name: Check external links\n        run: node scripts/check-external-links.ts",
        ),
      },
      "must not install",
    ],
    [
      "implicit setup-node package-manager cache",
      {
        ...valid,
        externalLinks: valid.externalLinks.replace(
          "          package-manager-cache: false\n",
          "",
        ),
      },
      "must explicitly disable setup-node package-manager caching",
    ],
    [
      "single-quoted context override",
      {
        ...valid,
        netlify: `${valid.netlify}[context.deploy-preview]\ncommand = 'pnpm build'\n`,
      },
      "must inherit",
    ],
    [
      "netlify setup removed",
      {
        ...valid,
        netlify: valid.netlify.replace(
          "npm install --global corepack@0.35.0 && corepack enable && pnpm install --frozen-lockfile && ",
          "",
        ),
      },
      "must preserve pinned Corepack",
    ],
    [
      "pipeline checker disabled",
      {
        ...valid,
        packageJson: replacePackageScript(
          valid.packageJson,
          "validate:pipeline-contract",
          "node -e \"console.log('skipped')\"",
        ),
      },
      "validate:pipeline-contract must be",
    ],
    [
      "HTTP tests disabled",
      {
        ...valid,
        packageJson: replacePackageScript(
          valid.packageJson,
          "test:external-links",
          "node -e \"console.log('skipped')\"",
        ),
      },
      "test:external-links must be",
    ],
  ];

  for (const [name, fixture, expected] of drifts) {
    const failures = inspectPipeline(fixture);
    assert.ok(
      failures.some((failure) => failure.includes(expected)),
      `${name} drift was not rejected: ${failures.join("; ")}`,
    );
  }
}

function replacePackageScript(
  packageJson: string,
  name: string,
  command: string,
): string {
  const parsed = JSON.parse(packageJson) as {
    scripts: Record<string, string>;
  };
  parsed.scripts[name] = command;
  return JSON.stringify(parsed);
}

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function formatError(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}
