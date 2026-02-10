---
title: status Command
description: Inspect workspace and repository state for a branch.
draft: false
sidebar:
  hidden: false
---

## What It's For

Understand branch and repository state before pulling, syncing, or removing worktrees.

## What It Does

- Summarizes repository and worktree status across the workspace.
- Highlights mismatches and potential issues.
- Provides a quick health check for current feature work.

## Usage

```bash
arashi status [options]
```

## Key Options

- `-v, --verbose` show full `git status` output for each repository.
- `-s, --short` show one-line summaries per repository.

## Examples

```bash
# Default colorized status view
arashi status

# Full details per repository
arashi status --verbose

# Compact one-line summary
arashi status --short
```

## Notes

- `--verbose` and `--short` are mutually exclusive.
- Non-zero exit codes are returned if repository status checks fail.

## Related Commands

- [pull](/commands/pull/)
- [sync](/commands/sync/)
