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

## Repository Placement By Parent Topology

A direct-main add runs when the active configured checkout is the parent repository's canonical non-bare worktree. Arashi clones the child once beneath that checkout's `reposDir`, leaves the canonical clone on the detected child default branch, and updates that checkout's `.arashi/config.json`; it does not create a second child worktree.

A linked-parent add runs when the command starts in a configured linked parent worktree, including from an independent child repository nested beneath it. Arashi resolves the roles through Git topology rather than assuming a `.arashi/worktrees` path:

- The primary parent worktree owns the new canonical clone under its configured `reposDir`. That clone stays on the child's default branch.
- The linked parent is the active execution checkout. It receives an active child worktree at the equivalent configured path, checked out on the active parent branch.
- Only the active parent's `.arashi/config.json` receives the new config-relative `path` and `gitUrl` entry. Arashi does not edit the canonical parent's tracked config.

For the coordinated child branch, Arashi uses a matching `origin/<branch>` remote-tracking ref when one exists; otherwise it creates it from the detected default branch. A detached active parent, either destination already existing, or a conflicting checked-out child branch fails closed rather than overwriting or adopting state. Do not clone the child twice manually: the active child is a linked worktree backed by the canonical clone.

## Managed Ignore Safety Across Both Paths

Before linked-parent materialization, Arashi checks effective ignore coverage independently for the canonical and active destinations:

- `local` reconciles the common repository exclude authority and verifies that its rule covers both paths.
- `tracked` can update only the active branch's `.gitignore`. The canonical destination must already be effectively ignored in the canonical checkout; otherwise `add` stops before any write or clone and asks you to reconcile and commit the rule on the branch checked out in the canonical parent checkout first.
- `none` keeps the explicit opt-out, writes no ignore file, reports each unignored destination, and may continue under that policy.

An absolute `reposDir` remains a shared single-placement destination when `add` is invoked from a linked parent worktree; Arashi does not try to create a canonical clone and active worktree at the same absolute path.

An existing effective tracked, repository-local, or global rule can satisfy either destination. Arashi never writes the canonical checkout's tracked `.gitignore` from the linked parent and never writes global Git configuration.

## Rollback And Surviving State

Config, clone-local preference, managed-ignore, canonical clone, coordinated branch, active worktree, and active config changes share the command's rollback boundary. Cleanup runs in reverse dependency order and removes only invocation-created state.

The canonical clone owns the Git common directory used by the active child worktree. If rollback cannot remove either the active path or its Git worktree metadata—or cannot determine whether either survives—Arashi retains the canonical clone, coordinated branch, and required ignore coverage. Human and JSON failures report the initiating phase, cleanup failures, and final observed state; do not infer complete rollback from the exit code alone.

## Human And JSON Results

Human success output labels the portable config path, canonical clone and default branch, and, when present, the active child worktree and coordinated branch. Setup guidance refers to the active checkout rather than implying the default-branch clone is the feature checkout.

`--json` emits exactly one JSON envelope with no spinner, prompt, warning prose, or human summary on stdout. The existing config-relative `repository.path` remains stable. `data.repository` also includes:

- `materialization`: `"clone"` for direct/bare placement or `"coordinated-worktree"` for linked-parent placement.
- `canonicalPath`: the normalized absolute canonical clone path.
- `worktreePath`: the normalized absolute active path, or `null` without a linked child.
- `defaultBranch`: the detected child default branch.
- `coordinatedBranch`: the active parent branch, or `null` without a linked child.
- `setupScript`: the config-relative setup path or `null`; `setupScriptCreated` remains boolean.

On a rollback failure, inspect `error.details.phase`, `error.details.rollback.complete`, ordered `failures`, and `finalState` for canonical path, active path and metadata, coordinated branch, config entry, exact config-byte restoration (`configRestored`), and managed-ignore state.

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
