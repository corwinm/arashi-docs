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
- Reconciles managed ignore rules before config and repository materialization.
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
- `-j, --json` output machine-readable results. On `add`, `-n` remains the alias for `--name`, not dry-run.

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

- `add` requires configured mode because it persists child repositories. In standalone mode, run ordinary `arashi init` to upgrade; see the [Standalone Repository workflow](/workflows/standalone/) for the mode boundary.
- Run `arashi init` first so workspace config exists.
- `add` detects the default branch and tracks setup scripts when present.
- Arashi asks Git for effective tracked, repository-local, and global rules before writing. Missing safe managed paths use the clone's stored scope or the repository-local default; scope `none` warns without changing ignore files.
- Config, clone-local preference, ignore-file, and clone changes share the command's rollback boundary. If cloning fails and config/filesystem state is restored, `add` also attempts to roll back reconciliation; a surviving repository keeps the rule needed to hide its managed path.
- Arashi changes only its owned ignore block and never writes global Git configuration.
- JSON output includes managed ignore sources, warnings or unsafe skips, applied changes, and final `changed`/`restored` state when rollback is involved.

## Agent Notes

- Surface scope `none` and unsafe-path warnings rather than silently adding manual rules.
- On failure, use the reported final state to determine whether config, clone, and reconciliation changes remain; do not infer rollback from the exit code alone.

## Related Commands

- [init](/commands/init/)
- [create](/commands/create/)
- [Config workflow](/workflows/config/)
