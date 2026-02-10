---
title: add Command
description: Register a repository with the current Arashi workspace.
draft: false
sidebar:
  hidden: false
---

## What It's For

Bring another repository under workspace management.

## What It Does

- Adds a repository URL to Arashi workspace configuration.
- Clones or connects the repository into the workspace structure.
- Makes the repository available for create, pull, sync, and setup operations.

## Usage

```bash
arashi add <git-url> [options]
```

## Key Options

- `-n, --name <name>` override the auto-derived repository name.
- `--create-setup` create a setup template when no setup script is found.
- `-f, --force` skip confirmation prompts.
- `--json` output machine-readable results.

## Examples

```bash
# Add a repository using SSH
arashi add git@github.com:your-org/api.git

# Add with a custom workspace name
arashi add https://github.com/your-org/web.git --name frontend

# Emit JSON output for scripts
arashi add git@github.com:your-org/data.git --json
```

## Notes

- Run `arashi init` first so workspace config exists.
- `add` detects the default branch and tracks setup scripts when present.

## Related Commands

- [init](/commands/init/)
- [create](/commands/create/)
