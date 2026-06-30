---
title: move Command
description: Move uncommitted changes between coordinated worktrees.
draft: false
sidebar:
  hidden: false
---

## What It's For

Carry in-progress edits from one Arashi workspace into another after work started in the wrong place.

## What It Does

- Finds dirty repositories in the source coordinated workspace.
- Matches each dirty source repository to the same repository in the target workspace.
- Moves changes with a stash-backed transfer that includes staged and untracked files.
- Refuses to apply changes into a target repository that already has uncommitted changes.
- Preserves recovery guidance if a move cannot be completed safely.

## Usage

```bash
arashi move [options]
```

## Key Options

- `--from <workspace>` source branch, worktree name, or full worktree path.
- `--to <workspace>` target branch, worktree name, or full worktree path.
- `--json` output machine-readable move results or structured unsupported-mode errors.

When `--from` is omitted, Arashi uses the current dirty workspace when it can. When `--to` is omitted, Arashi prompts for a target workspace. JSON mode requires enough flags to avoid prompts.

## Examples

```bash
# Move current workspace changes into a feature workspace
arashi move --to feature-auth-refresh

# Move changes between two named coordinated workspaces
arashi move --from main --to feature-auth-refresh

# Use exact worktree paths when branch names are ambiguous
arashi move --from /path/to/source --to /path/to/target

# Emit structured output for automation
arashi move --from main --to feature-auth-refresh --json
```

## Notes

- `move` only moves uncommitted changes. It does not move commits or rename branches.
- Target repositories must be clean before receiving changes.
- Clean source repositories are skipped.
- If target apply fails, Arashi attempts to restore the source and reports a recovery command when manual recovery is needed.
- `arashi create` can suggest this command when it detects uncommitted changes in the source workspace. Use `arashi create <branch> --move-changes` to move compatible changes immediately after creating the target worktree.

## Agent Notes

- Prefer `arashi create <branch> --move-changes --json --no-launch --no-switch` when a user explicitly wants to create a worktree and carry current uncommitted work into it.
- Use `arashi move --from <source> --to <target> --json` for unattended automation.
- Do not use `move` when the target workspace is intentionally dirty; ask the user how to reconcile the target edits first.
- Preserve and surface any recovery command exactly as printed.

## Related Commands

- [create](/commands/create/)
- [list](/commands/list/)
- [status](/commands/status/)
