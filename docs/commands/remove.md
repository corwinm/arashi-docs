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
```

## Notes

- Main worktrees are skipped automatically.
- If both `--keep-worktrees` and `--keep-branches` are set, no operation is performed.
- Dirty worktrees require explicit confirmation unless `--no-check-dirty` is used.
- `--dry-run` suppresses confirmation prompts and reports the planned worktree removals, branch deletions, dirty-worktree blockers, skipped main worktrees, missing branches, and configured remove hooks without mutating anything.
- `arashi remove --dry-run --json` returns a single JSON envelope whose `data` includes `dryRun: true`, pending operations, effective options, blockers, and hook previews for automation.
- Stale Git-prunable worktree records are excluded from `remove`; use `arashi prune` to clean stale metadata.
- JSON mode does not prompt; pass explicit safety flags such as `--force` or `--no-check-dirty` when appropriate.
- `remove` does not close Herdr workspaces because they can contain agents or unsaved terminal state. Close a stale workspace manually, or deliberately opt into a pre-remove `herdr workspace close <workspace-id>` hook that resolves the workspace before the checkout disappears. Never use `herdr worktree remove`; Arashi owns Git worktree removal.

## Agent Notes

- Treat `remove` as destructive: confirm the target branch/worktree and inspect `arashi status` before running it.
- Prefer `arashi remove <branch> --force --json` only after the user has asked for cleanup and the relevant work is merged or intentionally abandoned.
- Do not bypass dirty checks unless the user explicitly accepts losing or preserving those changes another way.

## Lifecycle Hooks

`remove` supports scoped `pre-remove.sh` and `post-remove.sh` hooks.

Hook discovery order for each targeted repository:

1. `repos/<repo>/.arashi/hooks/<lifecycle>.sh`
2. `.arashi/hooks/<lifecycle>.sh`
3. `~/.arashi/hooks/<repo>/<lifecycle>.sh`
4. `~/.arashi/hooks/<lifecycle>.sh`

Behavior:

- Any failing `pre-remove` hook aborts destructive remove actions.
- Dry-run mode reports hooks that would be considered but never executes `pre-remove` or `post-remove` scripts.
- `post-remove` hooks still run after partial remove failures.
- Any failing `post-remove` hook returns a non-zero command exit status.
- Hooks receive scope metadata via `ARASHI_HOOK_SCOPE` and `ARASHI_HOOK_SOURCE_PATH`.

## Related Commands

`remove` supports standalone repository worktrees and applicable user-global hooks, but configless local `.arashi/hooks` are inactive. See the [Standalone Repository workflow](/workflows/standalone/).

- [list](/commands/list/)
- [create](/commands/create/)
- [prune](/commands/prune/)
- [Herdr workflow guide](/workflows/herdr/)
