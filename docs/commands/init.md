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

# Reinitialize safely and preview file changes
arashi init --force --dry-run
```

## Notes

- Run this command inside a Git repository.
- `init` creates `.arashi/config.json` and hook templates under `.arashi/hooks/`.
- It updates `.gitignore` to exclude the configured repositories directory.

## Related Commands

- [add](/commands/add/)
- [create](/commands/create/)
