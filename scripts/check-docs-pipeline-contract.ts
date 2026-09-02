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
  checkExternalLinkWorkflow(files.externalLinks, failures);
  checkDocsValidationWorkflow(files.docsValidate, failures);
  checkNetlifyCommands(files.netlify, scripts, failures);
  return failures;
}

function checkExternalLinkWorkflow(workflow: string, failures: string[]): void {
  if (
    !/^\s*schedule:/m.test(workflow) ||
    !/^\s*workflow_dispatch:/m.test(workflow)
  ) {
    failures.push(
      "external-link health must retain schedule and manual dispatch triggers",
    );
  }
  if (/^\s*(pull_request|push):/m.test(workflow)) {
    failures.push(
      "external-link health must remain outside pull-request and push gates",
    );
  }
  if (/continue-on-error:\s*true/.test(workflow)) {
    failures.push("external-link health must not suppress checker failures");
  }
  if (!/uses:\s*actions\/setup-node@[0-9a-f]{40}/.test(workflow)) {
    failures.push("external-link health must use immutable actions/setup-node");
  }
  if (!/node-version:\s*["']?24\.18\.0["']?/.test(workflow)) {
    failures.push("external-link health must pin Node.js 24.18.0");
  }
  if (/pnpm\/setup|cache:\s*true|pnpm install/.test(workflow)) {
    failures.push(
      "external-link health must not install pnpm, restore its cache, or install dependencies",
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
  if (!/^\s*name:\s*Validate docs quality gates\s*$/m.test(workflow)) {
    failures.push(
      "docs validation must preserve the required check name Validate docs quality gates",
    );
  }
  const validationRuns = [
    ...workflow.matchAll(/^\s*run:\s*pnpm\s+(validate(?::\S+)?)/gm),
  ].map((match) => match[1]);
  if (JSON.stringify(validationRuns) !== JSON.stringify(["validate"])) {
    failures.push(
      "docs validation must invoke only the canonical pnpm validate entrypoint",
    );
  }
  if (
    /publish-gate|Publish gate status|Netlify production deployment may proceed/.test(
      workflow,
    )
  ) {
    failures.push("docs validation must not expose a no-op publication gate");
  }
}

function checkNetlifyCommands(
  netlify: string,
  scripts: Record<string, string>,
  failures: string[],
): void {
  const commands = parseNetlifyCommands(netlify, failures);
  if (!commands.has("build")) {
    failures.push("netlify canonical build command is missing");
  }
  for (const context of commands.keys()) {
    if (context.startsWith("context.")) {
      failures.push(
        `netlify ${context} must inherit the canonical build command instead of overriding it`,
      );
    }
  }

  for (const [context, command] of commands) {
    const buildCount = countBuilds(command, scripts, new Set(), failures);
    if (buildCount !== 1) {
      failures.push(
        `netlify ${context} must reach exactly one Astro build, found ${buildCount}`,
      );
    }
  }

  const build = commands.get("build") ?? "";
  if (!hasPnpmCommand(build, "build")) {
    failures.push(
      "netlify must use pnpm build as its single build-and-publish command",
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

function parseNetlifyCommands(
  netlify: string,
  failures: string[],
): Map<string, string> {
  const commands = new Map<string, string>();
  let section = "";
  for (const line of netlify.split(/\r?\n/)) {
    const sectionMatch = line.match(/^\[([^[][^\]]*)\]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }
    const commandMatch = line.match(/^\s*command\s*=\s*"([^"]*)"\s*$/);
    if (commandMatch && section) commands.set(section, commandMatch[1]);
  }
  if (commands.size === 0)
    failures.push("netlify commands could not be parsed");
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
    const next = new Set(visiting);
    next.add(script);
    count += countBuilds(scripts[script], scripts, next, failures);
  }
  return count;
}

function hasPnpmCommand(command: string, expected: string): boolean {
  return [...command.matchAll(/\bpnpm(?:\s+run)?\s+([\w:-]+)/g)].some(
    (match) => match[1] === expected,
  );
}

function runControlledDriftTests(): void {
  const setupSha = "a".repeat(40);
  const valid: PipelineFiles = {
    docsValidate: "name: Validate docs quality gates\nrun: pnpm validate\n",
    externalLinks: `on:\n  schedule:\n  workflow_dispatch:\nsteps:\n  - uses: actions/setup-node@${setupSha}\n    with:\n      node-version: 24.18.0\n  - name: Run external links\n    run: node scripts/check-external-links.ts\n`,
    netlify: `[build]\ncommand = "pnpm build"\n`,
    packageJson: JSON.stringify({
      scripts: {
        build: "pnpm sync:content && astro check && astro build",
        lint: "markdownlint docs",
        validate: "pnpm validate:build:prepared",
        "validate:a11y":
          "pnpm validate:build && node scripts/check-a11y-smoke.ts",
        "validate:a11y:prepared": "node scripts/check-a11y-smoke.ts",
        "validate:build": "pnpm sync:content && astro check && astro build",
        "validate:build:prepared": "astro check && astro build",
        "validate:links:internal": "node scripts/check-internal-links.ts",
      },
    }),
  };
  assert.deepEqual(inspectPipeline(valid), []);

  const drifts: Array<[string, PipelineFiles, string]> = [
    [
      "suppressed external failure",
      {
        ...valid,
        externalLinks: `${valid.externalLinks}continue-on-error: true\n`,
      },
      "must not suppress",
    ],
    [
      "external dependency install",
      {
        ...valid,
        externalLinks: `${valid.externalLinks}  - run: pnpm install\n`,
      },
      "must not install",
    ],
    [
      "duplicate registration",
      {
        ...valid,
        docsValidate:
          "run: pnpm validate:semantic-docs:registration\nrun: pnpm validate\n",
      },
      "canonical pnpm validate",
    ],
    [
      "no-op gate",
      {
        ...valid,
        docsValidate: `${valid.docsValidate}publish-gate:\n  name: Publish gate status\n`,
      },
      "no-op publication gate",
    ],
    [
      "renamed required check",
      {
        ...valid,
        docsValidate: valid.docsValidate.replace(
          "Validate docs quality gates",
          "Documentation validation",
        ),
      },
      "required check name",
    ],
    [
      "validation in deploy build",
      {
        ...valid,
        netlify: valid.netlify.replace(
          'command = "pnpm build"',
          'command = "pnpm validate && pnpm build"',
        ),
      },
      "leave validate to GitHub Actions",
    ],
    [
      "context command override",
      {
        ...valid,
        netlify: `${valid.netlify}[context.deploy-preview]\ncommand = "pnpm build"\n`,
      },
      "must inherit the canonical build command",
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

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function formatError(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}
