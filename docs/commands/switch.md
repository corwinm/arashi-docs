---
title: switch Command
description: Open a new terminal context in an existing worktree.
draft: false
sidebar:
  hidden: false
---

## What It's For

Move into the right worktree quickly without manually changing directories.

## What It Does

- Selects an existing worktree and opens a new terminal context there.
- Supports parent-only, child-repo-only, or combined worktree scopes.
- Uses terminal-aware launch behavior (tmux, VS Code, and common terminal apps).

## Usage

```bash
arashi switch [filter] [options]
```

## Key Options

- `--repos` target child repositories in the current workspace only.
- `--all` target parent workspaces and nested child repo worktrees.
- `--sesh` run sesh mode in tmux (requires active tmux session and `sesh`).
- `--no-default-launch` ignore configured switch launch defaults for one invocation.

## Examples

```bash
# Pick from parent workspace worktrees
arashi switch

# Match child repos by repository name first
arashi switch --repos docs

# Include parent workspaces plus child repo worktrees
arashi switch --all

# Use sesh/tmux switching mode
arashi switch --sesh

# Ignore configured launch defaults for one run
arashi switch --no-default-launch
```

## Notes

- Default scope is parent repository worktrees only.
- In `--repos` mode, filter text matches repository names first:
  - exact repo match wins
  - otherwise a unique partial repo match is selected
- If `--repos` has no repo matches, Arashi prints available child repositories.
- Configure default launch mode in `.arashi/config.json` under `defaults.switch.launchMode`.

## Related Commands

- [list](/commands/list/)
- [status](/commands/status/)
- [create](/commands/create/)
