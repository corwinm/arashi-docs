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

## Adding From a Linked Parent Worktree

When run from a linked parent worktree, `arashi add` keeps the child's default-branch canonical clone under the primary parent and creates an active child worktree on the linked parent's branch. Only the linked checkout's `.arashi/config.json` is updated; adding from the primary checkout remains a single-clone workflow.

Arashi uses a matching remote child branch when one exists, otherwise it creates the branch from the child's default branch. It verifies that both destinations follow the configured ignore policy and rolls back state it created if the add fails.

Do not clone the child twice manually—the active child is a worktree backed by the canonical clone.

## Notes

- `add` requires configured mode because it persists child repositories. In standalone mode, run ordinary `arashi init` to upgrade; see the [Standalone Repository workflow](/workflows/standalone/) for the mode boundary.
- Run `arashi init` first so workspace config exists.
- Setup-script detection uses the default-branch canonical clone and reports the setup path separately from the active worktree path.
- Arashi changes only its owned ignore block and never writes global Git configuration.

## Agent Notes

- Surface scope `none`, tracked-scope canonical coverage failures, and unsafe-path warnings rather than silently adding manual rules.
- Use the reported canonical and active roles and final rollback state; do not infer placement or cleanup from the invocation directory or exit code alone.

## Related Commands

- [init](/commands/init/)
- [create](/commands/create/)
- [Config workflow](/workflows/config/)
