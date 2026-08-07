---
title: remove Command
description: Remove worktrees and optionally delete associated branches.
draft: false
sidebar:
  hidden: false
---

## What It's For

Clean up feature branches and worktrees when work is done or abandoned.

## What It Does

- Removes matching worktree directories from the workspace.
- Can also delete corresponding Git branches.
- Supports safety checks for dirty worktrees and optional force behavior.

## Usage

```bash
arashi remove [target] [options]
```

## Key Options

- `--no-check-dirty` skip uncommitted changes checks.
- `--keep-worktrees` delete branches but keep worktree directories.
- `--keep-branches` remove worktrees but keep branches.
- `-f, --force` skip confirmation prompts.
- `-n, --dry-run` preview planned removals without changing worktrees, branches, or lifecycle hooks.
- `--no-hook-input` execute hooks with immediate EOF on stdin for this invocation only.
- `--path` treat `target` as a worktree path.
- `-j, --json` output machine-readable results.

## Examples

```bash
# Remove a branch across managed repositories
arashi remove feature-login

# Interactive selection mode
arashi remove

# Remove by path
arashi remove ./repos/api/feature-login --path

# Preview the removal plan without changing files or branches
arashi remove feature-login --dry-run

# Emit a machine-readable non-mutating plan for agents and scripts
arashi remove feature-login --dry-run --json

# Remove non-interactively and emit JSON
arashi remove feature-login --force --json

# Execute remove hooks but prevent them from reading the terminal
arashi remove feature-login --no-hook-input
```

## Notes

- Main worktrees are skipped automatically.
- If both `--keep-worktrees` and `--keep-branches` are set, no operation is performed.
- Dirty worktrees require explicit confirmation unless `--no-check-dirty` is used.
- `--dry-run` suppresses confirmation prompts and reports the planned worktree removals, branch deletions, dirty-worktree blockers, skipped main worktrees, missing branches, and configured remove hooks without mutating anything.
- `arashi remove --dry-run --json` returns a single JSON envelope whose `data` includes `dryRun: true`, pending operations, effective options, blockers, and hook previews for automation.
- Stale Git-prunable worktree records are excluded from `remove`; use `arashi prune` to clean stale metadata.
- JSON mode does not prompt; pass explicit safety flags such as `--force` or `--no-check-dirty` when appropriate.
- A normal terminal run exposes `ARASHI_HOOK_INPUT=tty`; `--no-hook-input` or JSON uses `disabled`, and non-TTY automation uses `unavailable`. Disabled and unavailable hooks receive immediate EOF. `--no-hook-input` does not skip hooks or confirmations; hook failures and outcomes remain active.
- `remove` does not close Herdr workspaces because they can contain agents or unsaved terminal state. Close a stale workspace manually, or deliberately opt into a pre-remove `herdr workspace close <workspace-id>` hook that resolves the workspace before the checkout disappears. Never use `herdr worktree remove`; Arashi owns Git worktree removal.

## Agent Notes

- Treat `remove` as destructive: confirm the target branch/worktree and inspect `arashi status` before running it.
- Prefer `arashi remove <branch> --force --json` only after the user has asked for cleanup and the relevant work is merged or intentionally abandoned.
- Do not bypass dirty checks unless the user explicitly accepts losing or preserving those changes another way.

## Lifecycle Hooks

For each configured target repository, `remove` evaluates repository, workspace, global-targeted, and global-shared `pre-remove`/`post-remove` hooks in that order. Every scope is evaluated once per target repository, so workspace and shared hooks must be idempotent and use the current target's context. POSIX uses `.sh`; Windows uses one unambiguous native `.ps1`, `.cmd`, or `.bat` script at each location.

Behavior:

- Any failing or timed-out `pre-remove` hook aborts destructive remove actions.
- Dry-run mode reports hooks that would be considered but never executes `pre-remove` or `post-remove` scripts and never fabricates execution outcomes.
- `post-remove` hooks still run after partial remove failures; removal errors and all hook outcomes remain available in human and JSON results.
- Any failing `post-remove` hook contributes to a nonzero command result without collapsing earlier timeout or removal failures.
- Per-target scalar context comes only from the current repository. Command-wide cleanup parses `ARASHI_REMOVE_TARGETS_JSON`; comma-separated compatibility aggregates are lossy.

See the [Hooks workflow](/workflows/hooks/) for discovery paths, structured target shape, cwd, timeout, compatibility, and outcome contracts.

## Related Commands

`remove` supports standalone repository worktrees and applicable user-global hooks, but configless local `.arashi/hooks` are inactive. See the [Standalone Repository workflow](/workflows/standalone/).

- [list](/commands/list/)
- [create](/commands/create/)
- [prune](/commands/prune/)
- [Herdr workflow guide](/workflows/herdr/)
