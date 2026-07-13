---
title: exec Command
description: Run an arbitrary command across selected managed repositories.
draft: false
sidebar:
  hidden: false
---

## What It's For

Run the same ad hoc command in every selected managed repository without writing a shell loop. `arashi exec` is useful for repeated inspection, validation, tests, and maintenance commands across an Arashi workspace.

Each child command runs with its current working directory set to the selected repository path, not the meta-repo root.

## Usage

```bash
arashi exec [options] -- <command> [args...]
```

The `--` delimiter is required before the child command. Arashi parses options before `--`; everything after `--` is passed to the child command without being interpreted as Arashi options.

## Options

- `--only <repos>` run only the named managed repositories. Use a comma-separated list for multiple repositories.
- `--group <group>` run only repositories in the requested group. Repeat for multiple groups.
- `--dirty` run only in selected repositories that have local working-tree changes.
- `--jobs <n>` run up to `n` repositories concurrently. The default is serial execution.
- `--fail-fast` stop scheduling additional repositories after the first child-command failure. Already-running jobs may finish and be reported.
- `--json` emit one machine-readable JSON envelope instead of grouped human output.

## Examples

```bash
# inspect all locally present managed repositories
arashi exec -- git status --short

# validate one repository
arashi exec --only arashi-docs -- pnpm validate

# validate all documentation repositories
arashi exec --group docs -- pnpm validate

# inspect two repositories
arashi exec --only arashi,arashi-docs -- git status --short

# show diffs only for repositories with local changes
arashi exec --dirty -- git diff --stat

# run tests with bounded parallelism
arashi exec --jobs 4 -- pnpm test

# stop starting new test jobs after the first failure
arashi exec --jobs 4 --fail-fast -- pnpm test

# pass child-command flags after the delimiter
arashi exec -- pnpm test -- --watch=false

# capture per-repository stdout, stderr, status, and totals for automation
arashi exec --json -- git status --short
```

## Output And Exit Behavior

Human output is grouped by repository so stdout, stderr, and failures remain attributable even when `--jobs` runs commands in parallel. The final summary reports successful, failed, and skipped or not-started repositories.

`arashi exec` exits with status code `0` when every executed child command succeeds. If any executed child command exits non-zero, the Arashi process exits non-zero and identifies the failing repository or repositories.

When `--dirty` matches no repositories, `arashi exec` exits successfully and reports that no dirty repositories matched.

## JSON Mode

Use `--json` when automation needs to inspect results. JSON mode suppresses grouped human output and writes a single parseable document to stdout using the standard Arashi JSON envelope.

On full success, the result data includes the child command arguments, effective execution options, selected repositories, per-repository stdout and stderr, exit status, duration, and aggregate totals. If any selected repository fails, the JSON envelope uses `ok: false` and includes the same per-repository result details under the structured error details. The Arashi process exits non-zero when any selected repository fails.

## Notes

- Use explicit filters for expensive or mutating commands. Prefer `--group <group>` for known semantic sets and `--only <repo>` for one-off repository lists.
- When combined with `--only`, `--group` narrows the explicit repository list by intersection.
- Prefer serial execution for commands that contend for shared resources or produce large output.
- `--jobs <n>` must be a positive integer.
- `arashi exec` is intended for non-interactive fan-out commands; avoid child commands that require a TTY prompt or editor.
- Missing or unknown repositories named by `--only` are reported as errors instead of silently ignored.

## Related

- [status](/commands/status/) for built-in workspace state inspection.
- [setup](/commands/setup/) for configured repository setup scripts.
- [Agents workflow](/workflows/agents-and-specs/) for automation guidance.
