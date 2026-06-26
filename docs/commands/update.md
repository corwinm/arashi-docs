---
title: update
description: Check for and apply Arashi CLI updates.
draft: false
---

Use `arashi update` when you want Arashi to check whether a newer CLI release is available.

## Usage

```bash
arashi update [--check] [--dry-run] [--yes]
```

## Options

- `--check` checks whether an update is available without changing files.
- `--dry-run` shows the planned update command or installer invocation without changing files.
- `-y, --yes` applies a supported update non-interactively.

## Behavior

Arashi first detects how the current CLI is installed.

- npm-managed installs can update the package and then refresh the matching platform binary when the package manager can be confidently detected.
- Package-manager detection supports npm, pnpm, Yarn, Bun, and Vite+ managed globals.
- Vite+ installs update with `vp update -g arashi`.
- official curl installer installs can rerun the installer against the current binary directory when you pass `--yes`.
- manual release-asset installs use the same installer-based plan when possible; use `--dry-run` first if you need to inspect the target directory.
- ambiguous npm-managed installs do not mutate files. Arashi prints manual update commands instead.

## Examples

```bash
# only check whether an update exists
arashi update --check

# show the command or release guidance without changing files
arashi update --dry-run

# inspect the Vite+ managed-global update plan
arashi update --dry-run
# Selected update command: vp update -g arashi

# run a supported npm-managed update without prompting
arashi update --yes
```

## Notes

- If release or package metadata cannot be fetched, the command exits non-zero and leaves the existing binary in place.
- If the package update succeeds but binary refresh fails, run `arashi install` to retry the binary installation or download the release asset manually.
