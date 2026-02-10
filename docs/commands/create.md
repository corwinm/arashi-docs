---
title: create Command
description: Create a feature branch worktree across workspace repositories.
draft: false
sidebar:
  hidden: false
---

## What It's For

Start feature work across multiple repositories from a single command.

## What It Does

- Creates a worktree for the target branch in each configured repository.
- Ensures repositories are aligned to the same branch name.
- Runs configured lifecycle hooks when present.

## Usage

```bash
arashi create <branch> [options]
```

## Key Options

- `--only <repos>` limit creation to comma-separated repository names.
- `-i, --interactive` pick repositories interactively.
- `--conflict <strategy>` preselect conflict handling (`ABORT`, `REUSE_EXISTING`).
- `--no-hooks` disable hook execution.
- `--no-progress` hide progress indicators.
- `--dry-run` generate a plan without creating worktrees.

## Examples

```bash
# Create branch worktrees across the workspace
arashi create feature-auth-refresh

# Create in specific repositories only
arashi create feature-auth-refresh --only api,web

# Review the plan first
arashi create feature-auth-refresh --dry-run
```

## Notes

- `create` validates branch names and repository readiness.
- On failure, coordinated operations can roll back to keep repos consistent.

## Related Commands

- [status](/commands/status/)
- [remove](/commands/remove/)
