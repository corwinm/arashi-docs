---
title: init Command
description: Initialize Arashi in the current workspace.
draft: false
sidebar:
  hidden: false
---

## What It's For

Set up a workspace so Arashi can track repositories and worktrees.

## What It Does

- Creates Arashi configuration in the current project.
- Prepares workspace metadata used by other commands.
- Makes the workspace ready for repository registration.

## Usage

```bash
arashi init [options]
```

## Key Options

- `--repos-dir <path>` set a custom repos directory (default `./repos`).
- `--worktrees-dir <path>` set a custom worktree base directory (default `.arashi/worktrees`).
- `--force` overwrite an existing Arashi config (with backup).
- `--no-discover` skip automatic repository discovery.
- `--dry-run` preview changes without writing files.
- `--verbose` print detailed initialization steps.

## Examples

```bash
# Standard initialization
arashi init

# Use a custom repositories directory
arashi init --repos-dir ../workspace-repos

# Use a custom worktree base directory
arashi init --worktrees-dir ../workspace-worktrees

# Reinitialize safely and preview file changes
arashi init --force --dry-run
```

## Notes

- Run this command inside a Git repository.
- `init` creates `.arashi/config.json` and hook templates under `.arashi/hooks/`.
- `init` sets `worktreesDir` to `.arashi/worktrees` by default.
- It updates `.gitignore` to exclude the configured repositories directory.
- When the default `worktreesDir` is used, `.gitignore` also includes `.arashi/worktrees/`.
- Custom `worktreesDir` values are not auto-added to `.gitignore`.

## Related Commands

- [add](/commands/add/)
- [create](/commands/create/)
