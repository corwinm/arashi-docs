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

## Optional repository setup

After cloning and inspecting the new repository, `aw add` can offer repository-owned setup when both stdin and stdout are TTYs. The top-level setup prompt defaults to no. Declining preserves the minimal `path` and `gitUrl` add; `--json`, `--force`, and non-TTY runs preserve minimal add without discovery or onboarding prompts.

Onboarding is limited to `copy`, `symlink`, and four repository lifecycle hooks: `pre-create`, `post-create`, `pre-remove`, and `post-remove`. Suggestions remain unselected; a bounded root-only scan provides suggestions, and Arashi never reads or displays candidate contents. Manual entries receive canonical path validation. A manual dependency-directory choice is retained only after a warning; review the [configuration materialization guidance](/workflows/config/#worktree-file-materialization) before sharing dependencies. Setup-script context never prefills or infers a hook command.

For each selected lifecycle, choose exactly one source: a user-supplied inline command or an editable active native script. Create scripts use the active configuration root at `.arashi/hooks/<lifecycle>.<repo><ext>`. Remove scripts use the runtime-resolved target repository at `.arashi/hooks/<lifecycle><ext>`; in linked mode, remove resolves to the active child rather than the canonical clone. See the [Hooks workflow](/workflows/hooks/#add-onboarding-active-scripts) for source ownership and runtime discovery details.

A generated file is a safe silent no-op that is ready immediately: POSIX uses one executable `.sh` with mode `0755`, and Windows creates one `.ps1` that is runtime-ready. Arashi never overwrites an existing active file. There is no rename/chmod activation step; edit the installed file in place when ready. The sanitized summary never includes inline bodies or generated contents.

The pure Node/Bun installation boundary uses private complete-file preparation and atomic no-replace publication; it does not require Rust or a native helper. It rejects observable symlink traversal and performs pre/post ancestor-identity validation around publication. These checks provide practical safety, but a narrow residual race remains where another local process with workspace write access substitutes an ancestor between validation and publication.

Onboarding performs no prompt-time writes. One final sanitized confirmation authorizes one config save plus transaction-owned scripts. Declining that final confirmation or pressing Ctrl+C after opting in is cancellation, so `add` uses its rollback boundary instead of preserving a partial setup. Top-level decline is different: it completes the minimal add. Editing an existing registered repository remains follow-up [issue #316](https://github.com/corwinm/arashi-arashi/issues/316), not an `aw add` workflow.

## SSH Remote Forms

Arashi accepts Git's `[user@]host:path` SCP syntax, including an omitted user, and `ssh://[user@]host/path`. The host is opaque: it may be a hostname or an OpenSSH `Host` alias. For example, `git@work-github:acme/api.git`, `work-github:acme/api.git`, and `ssh://git@work-github/acme/api.git` are supported.

For the command argument, Arashi normalizes outer whitespace once, passes that exact normalized URL to Git, returns it in command output, and stores it unchanged in `.arashi/config.json`. Arashi does not expand the host alias or replace the username, scheme, path, or `.git` suffix.

## Adding From a Linked Parent Worktree

When run from a linked parent worktree, `aw add` keeps the child's default-branch canonical clone under the primary parent and creates an active child worktree on the linked parent's branch. Only the linked checkout's `.arashi/config.json` is updated; adding from the primary checkout remains a single-clone workflow.

Arashi uses a matching remote child branch when one exists, otherwise it creates the branch from the child's default branch. It verifies that both destinations follow the configured ignore policy and rolls back state it created if the add fails.

If `reposDir` cannot be managed as a repository-relative ignore rule—for example, an absolute path or `.`—`add` keeps a single active-workspace clone instead.

Do not clone the child twice manually—the active child is a worktree backed by the canonical clone.

## Notes

- `add` requires configured mode because it persists child repositories. In standalone mode, run ordinary `aw init` to upgrade; see the [Standalone Repository workflow](/workflows/standalone/) for the mode boundary.
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
- [Config workflow](/workflows/config/)
