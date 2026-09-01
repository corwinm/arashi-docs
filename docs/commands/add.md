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
aw add <git-url> [options]
```

## Key Options

- `-n, --name <name>` override the auto-derived repository name.
- `--create-setup` create a setup template when no setup script is found.
- `-f, --force` skip confirmation prompts.
- `-j, --json` output machine-readable results. On `add`, `-n` remains the alias for `--name`, not dry-run.

## Examples

```bash
# Explicit-user SCP syntax
aw add git@work-github:acme/api.git

# Omitted-user SCP syntax
aw add work-github:acme/api.git

# ssh:// syntax
aw add ssh://git@work-github/acme/api.git

# Add with a custom workspace name
aw add https://github.com/your-org/web.git --name frontend

# Emit JSON output for scripts
aw add git@github.com:your-org/data.git --json
```

## Repository setup

On an eligible human terminal, `aw add` offers optional repository configuration and hook initialization after it inspects the cloned repository and setup state. The offer defaults to **No**. `--force`, `--json`, or a run without both terminal stdin and stdout suppresses the offer and persists only the minimal repository entry.

## SSH Remote Forms

Arashi accepts Git's `[user@]host:path` SCP syntax, including an omitted user, and `ssh://[user@]host/path`. The host is opaque: it may be a hostname or an OpenSSH `Host` alias. For example, `git@work-github:acme/api.git`, `work-github:acme/api.git`, and `ssh://git@work-github/acme/api.git` are supported.

For the command argument, Arashi normalizes outer whitespace once, passes that exact normalized URL to Git, returns it in command output, and stores it unchanged in `.arashi/config.json`. Arashi does not expand the host alias or replace the username, scheme, path, or `.git` suffix.

## Adding From a Linked Parent Worktree

When run from a linked parent worktree, `aw add` keeps the child's default-branch canonical clone under the primary parent and creates an active child worktree on the linked parent's branch. Only the linked checkout's `.arashi/config.json` is updated; adding from the primary checkout remains a single-clone workflow.

Arashi uses a matching remote child branch when one exists, otherwise it creates the branch from the child's default branch. It verifies that both destinations follow the configured ignore policy and rolls back state it created if the add fails.

If `reposDir` cannot be managed as a repository-relative ignore rule—for example, an absolute path or `.`—`add` keeps a single active-workspace clone instead.

Do not clone the child twice manually—the active child is a worktree backed by the canonical clone.

## Notes

- `add` requires configured mode because it persists child repositories. In standalone mode, run ordinary `aw init` to upgrade; see the [One Repository](/getting-started/standalone/) for the mode boundary.
- Run `aw init` first so workspace config exists.
- Setup-script detection uses the default-branch canonical clone and reports the setup path separately from the active worktree path.
- Arashi changes only its owned ignore block and never writes global Git configuration.
- Git and OpenSSH own SSH host resolution and authentication. Arashi does not inspect or configure SSH aliases, keys, or identity files.

## Agent Notes

- Surface scope `none`, tracked-scope canonical coverage failures, and unsafe-path warnings rather than silently adding manual rules.
- Use the reported canonical and active roles and final rollback state; do not infer placement or cleanup from the invocation directory or exit code alone.

## Related Commands

- [init](/commands/init/)
- [create](/commands/create/)
- [Configuration reference](/reference/configuration/)
