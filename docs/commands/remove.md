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
- `--path` treat `target` as a worktree path.
- `--json` output machine-readable results.

## Examples

```bash
# Remove a branch across managed repositories
arashi remove feature-login

# Interactive selection mode
arashi remove

# Remove by path
arashi remove ./repos/api/feature-login --path
```

## Notes

- Main worktrees are skipped automatically.
- If both `--keep-worktrees` and `--keep-branches` are set, no operation is performed.
- Dirty worktrees require explicit confirmation unless `--no-check-dirty` is used.

## Lifecycle Hooks

`remove` supports scoped `pre-remove.sh` and `post-remove.sh` hooks.

Hook discovery order for each targeted repository:

1. `repos/<repo>/.arashi/hooks/<lifecycle>.sh`
2. `.arashi/hooks/<lifecycle>.sh`
3. `~/.arashi/hooks/<repo>/<lifecycle>.sh`
4. `~/.arashi/hooks/<lifecycle>.sh`

Behavior:

- Any failing `pre-remove` hook aborts destructive remove actions.
- `post-remove` hooks still run after partial remove failures.
- Any failing `post-remove` hook returns a non-zero command exit status.
- Hooks receive scope metadata via `ARASHI_HOOK_SCOPE` and `ARASHI_HOOK_SOURCE_PATH`.

## Related Commands

- [list](/commands/list/)
- [create](/commands/create/)
