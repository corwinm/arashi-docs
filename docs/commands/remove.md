---
title: remove Command
description: Remove worktrees and optionally delete associated branches.
draft: false
sidebar:
  hidden: false
---

## What It's For

Clean up feature branches and worktrees when work is done or abandoned.

`remove` deletes branch worktrees (and optionally their branches). To delete a configured repository dependency instead, use the separate [delete command](/commands/delete/); `delete` can remove one explicit or multiple interactively selected configured repositories and is not a `remove` alias.

## What It Does

- Removes matching worktree directories from the workspace.
- Can also delete corresponding Git branches.
- Supports safety checks for dirty worktrees and optional force behavior.

## Usage

```bash
aw remove [target] [options]
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
aw remove feature-login

# Interactive selection mode
aw remove

# Remove by path
aw remove ./repos/api/feature-login --path

# Preview the removal plan without changing files or branches
aw remove feature-login --dry-run

# Emit a machine-readable non-mutating plan for agents and scripts
aw remove feature-login --dry-run --json

# Remove non-interactively and emit JSON
aw remove feature-login --force --json

# Execute remove hooks but prevent them from reading the terminal
aw remove feature-login --no-hook-input
```

## Notes

- Main worktrees are skipped automatically.
- If both `--keep-worktrees` and `--keep-branches` are set, no operation is performed.
- Dirty worktrees require explicit confirmation unless `--no-check-dirty` is used.
- `--dry-run` suppresses confirmation prompts and reports the planned worktree removals, branch deletions, dirty-worktree blockers, skipped main worktrees, missing branches, and configured remove hooks without mutating anything.
- `aw remove --dry-run --json` returns a single JSON envelope whose `data` includes `dryRun: true`, pending operations, effective options, blockers, and hook previews for automation.
- Stale Git-prunable worktree records are excluded from `remove`; use `aw prune` to clean stale metadata.
- JSON mode does not prompt; pass explicit safety flags such as `--force` or `--no-check-dirty` when appropriate.
- A normal terminal run exposes `ARASHI_HOOK_INPUT=tty`; `--no-hook-input` or JSON uses `disabled`, and non-TTY automation uses `unavailable`. Disabled and unavailable hooks receive immediate EOF. `--no-hook-input` does not skip hooks or confirmations; hook failures and outcomes remain active.
- `--no-hooks` is create-only and remove does not provide it; `--no-hook-input` is shared by create and remove.
- `remove` does not close Herdr workspaces because they can contain agents or unsaved terminal state. Close a stale workspace manually, or deliberately opt into a pre-remove `herdr workspace close <workspace-id>` hook that resolves the workspace before the checkout disappears. Never use `herdr worktree remove`; Arashi owns Git worktree removal.

## Agent Notes

- Treat `remove` as destructive: confirm the target branch/worktree and inspect `aw status` before running it.
- Prefer `aw remove <branch> --force --json` only after the user has asked for cleanup and the relevant work is merged or intentionally abandoned.
- Do not bypass dirty checks unless the user explicitly accepts losing or preserving those changes another way.

## Lifecycle Hooks

For each configured target repository, `remove` evaluates repository, workspace, global-targeted, and global-shared `pre-remove`/`post-remove` hooks in that order. Every scope is evaluated once per target repository, so workspace and shared hooks must be idempotent and use the current target's context. POSIX uses `.sh`; Windows uses one unambiguous native `.ps1`, `.cmd`, or `.bat` script at each location.

The repository slot accepts inline `repos.<repo>.hooks.<lifecycle>`, workspace-owned `<configurationRoot>/.arashi/hooks/<lifecycle>.<repo><ext>`, or compatible child-local `<activeRepo>/.arashi/hooks/<lifecycle><ext>`. These are three aliases for one repository logical slot. The qualified active paths are `<configurationRoot>/.arashi/hooks/pre-remove.<repo><ext>` and `<configurationRoot>/.arashi/hooks/post-remove.<repo><ext>`. Two or more claims are ambiguous and fail before hook execution or removal mutation; aliases never compose and have no precedence.

Whichever alias is selected retains repository scope and a plain lifecycle hook name. A native result reports the exact selected source path, while cwd is the active target checkout rather than the script's storage directory. Scope order remains repository → workspace → global-targeted → global-shared. Doctor and dry-run use the same runtime candidate discovery and report selection or ambiguity without mutation or execution.

Behavior:

- Any failing or timed-out `pre-remove` hook aborts destructive remove actions.
- Dry-run mode reports hooks that would be considered but never executes `pre-remove` or `post-remove` scripts and never fabricates execution outcomes.
- Remove dry-run provides source-aware previews with source kind and source owner metadata. Inline sources are identified by `sourceKind: "inline-config"`, `sourceOwnerKind`, and `sourceOwnerName`; outcomes, previews, diagnostics, and logs do not reveal snippet text.
- `post-remove` hooks still run after partial remove failures; removal errors and all hook outcomes remain available in human and JSON results.
- Any failing `post-remove` hook contributes to a nonzero command result without collapsing earlier timeout or removal failures.
- Per-target scalar context comes only from the current repository. Command-wide cleanup parses `ARASHI_REMOVE_TARGETS_JSON`; comma-separated compatibility aggregates are lossy.

See the [Lifecycle Hooks reference](/reference/hooks/) for discovery paths, structured target shape, cwd, timeout, compatibility, and outcome contracts.

## Related Commands

`remove` supports standalone repository worktrees and applicable user-global hooks, but configless local `.arashi/hooks` are inactive. See the [One Repository](/getting-started/standalone/).

- [list](/commands/list/)
- [create](/commands/create/)
- [prune](/commands/prune/)
- [Herdr workflow guide](/workflows/herdr/)
