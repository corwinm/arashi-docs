---
title: prune Command
description: Clean stale Git worktree metadata across an Arashi workspace.
draft: false
sidebar:
  hidden: false
---

## What It's For

Clean up stale Git worktree metadata when a worktree directory was deleted manually or Git's worktree records otherwise get out of sync.

Use `prune` for stale metadata. Use [`remove`](/commands/remove/) when you want to delete real worktree directories and optionally delete branches.

## What It Does

- Finds worktree records that Git marks as prunable across the main repository and configured child repositories.
- Reports stale entries without changing anything when run with `--dry-run`.
- Runs Git worktree pruning for affected repositories in mutating mode.
- Supports JSON output for automation and agent workflows.

## Usage

```bash
arashi prune [options]
```

## Key Options

- `--dry-run` report stale worktree metadata without pruning it.
- `--expire <time>` pass a Git worktree prune expiry time. Defaults to `now` so stale entries discovered by Arashi are cleaned immediately.
- `--json` output machine-readable results.

## Examples

```bash
# Preview stale worktree metadata
arashi prune --dry-run

# Clean stale worktree metadata now
arashi prune

# Automation-safe cleanup report
arashi prune --json
```

## Notes

- `prune` removes Git metadata for stale worktree records; it does not delete existing worktree directories.
- `remove` excludes prunable entries from its selection list and points stale targets here.
- Branches are not deleted by `prune`; use `remove` for real worktrees and branch cleanup.
- JSON mode emits one JSON envelope on stdout with per-repository stale entries, reasons, totals, and failure details when needed.

## Agent Notes

- Prefer `arashi prune --dry-run --json` before mutating cleanup when diagnosing out-of-sync worktree records.
- Use `arashi prune --json` for non-interactive cleanup after confirming entries are stale metadata, not active worktrees.
- Do not use `arashi remove` to clean prunable entries; `remove` is for real coordinated worktrees and branches.

## Related Commands

- [remove](/commands/remove/)
- [list](/commands/list/)
- [status](/commands/status/)
