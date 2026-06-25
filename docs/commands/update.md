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
- `--dry-run` shows the planned update command or manual replacement guidance without changing files.
- `-y, --yes` allows a supported npm-managed update to run non-interactively.

## Behavior

Arashi first detects how the current CLI is installed.

- npm-managed installs can update the package and then refresh the matching platform binary when the package manager can be confidently detected.
- direct binary or manual installs are not replaced automatically. Arashi reports the latest release URL and the platform asset to download.
- ambiguous installs do not mutate files. Arashi prints manual update commands or release guidance instead.

## Examples

```bash
# only check whether an update exists
arashi update --check

# show the command or release guidance without changing files
arashi update --dry-run

# run a supported npm-managed update without prompting
arashi update --yes
```

## Notes

- If release or package metadata cannot be fetched, the command exits non-zero and leaves the existing binary in place.
- If the package update succeeds but binary refresh fails, run `arashi install` to retry the binary installation or download the release asset manually.
