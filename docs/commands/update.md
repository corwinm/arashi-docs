---
title: update Command
description: Check for and apply Arashi CLI updates.
draft: false
sidebar:
  hidden: false
---

Use `aw update` when you want Arashi to check whether a newer CLI release is available.

## Usage

```bash
aw update [--check] [--dry-run] [--yes]
```

## Options

- `--check` checks whether an update is available without changing files.
- `-n, --dry-run` shows the planned update command or installer invocation without changing files.
- `-y, --yes` applies a supported update non-interactively.
- `-j, --json` output machine-readable update check, plan, or result data.

## Behavior

Arashi first detects how the current CLI is installed.

For supported npm-managed and direct-installer installations, an update refreshes both `arashi` and `aw`; both names continue to use the same release.

- npm-managed installs can update the package and then refresh the matching platform binary when the package manager can be confidently detected.
- Package-manager detection supports npm, pnpm, Yarn, Bun, and Vite+ managed globals.
- Vite+ installs update with `vp update -g arashi`.
- official direct-installer installs can rerun the platform installer against the current binary directory when you pass `--yes`: the POSIX curl installer on macOS/Linux and a deferred PowerShell installer on Windows after the current Arashi process exits.
- manual release-asset installs use the same installer-based plan when possible; use `--dry-run` first if you need to inspect the target directory.
- ambiguous npm-managed installs do not mutate files. Arashi prints manual update commands instead.
- `--check` conflicts with `--dry-run` and `-n`. The npm wrapper and direct binary both reject that combination before release lookup, installer planning, or mutation rather than choosing one mode by flag order.
- Human mode returns an actionable usage error. JSON mode returns exactly one structured error envelope with both options identified and no human text mixed into stdout.
- Bare `--json` is inspection-only: it reports the available update and selected plan in one envelope, never prompts or applies an update, and behaves identically in the npm wrapper and direct binary.
- `--json --yes` returns `JSON_UNSUPPORTED_FOR_MODE` for `installer-apply` before update mutation.

## Examples

```bash
# only check whether an update exists
aw update --check

# show the command or release guidance without changing files
aw update --dry-run

# inspect the Vite+ managed-global update plan
aw update --dry-run
# Selected update command: vp update -g arashi

# run a supported npm-managed update without prompting
aw update --yes

# check for updates and emit JSON
aw update --check --json
```

## Notes

- If release or package metadata cannot be fetched, the command exits non-zero and leaves the existing binary in place.
- If the package update succeeds but binary refresh fails, run `aw install` to retry the binary installation or download the release asset manually.
- JSON mode is supported for inspection. Use `--check --json`, `--dry-run --json`, or bare `--json`; applying an update requires human output or `--yes` without JSON.
