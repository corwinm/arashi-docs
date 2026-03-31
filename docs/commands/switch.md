---
title: switch Command
description: Open a new terminal context in an existing worktree or change the current shell directory when shell integration is active.
draft: false
sidebar:
  hidden: false
---

## What It's For

Move into the right worktree quickly without manually changing directories.

## What It Does

- Selects an existing worktree and opens a new terminal context there.
- Supports parent-only, child-repo-only, or combined worktree scopes.
- Uses terminal-aware launch behavior (tmux, VS Code, Cursor, Kiro, and common terminal apps).

## Usage

```bash
arashi switch [filter] [options]
```

## Key Options

- `--repos` target child repositories in the current workspace only.
- `--all` target parent workspaces and nested child repo worktrees.
- `--cd` request parent-shell directory switching for one invocation.
- `--no-cd` force launch behavior for one invocation.
- `--sesh` run sesh mode in tmux (requires active tmux session and `sesh`).
- `--vscode`, `--cursor`, `--kiro` explicitly open the selected worktree in that IDE for one invocation.
- `--no-default-launch` ignore configured switch launch defaults for one invocation.

## Examples

```bash
# Pick from parent workspace worktrees
arashi switch

# Match child repos by repository name first
arashi switch --repos docs

# Include parent workspaces plus child repo worktrees
arashi switch --all

# Force the selected worktree to open in Cursor
arashi switch --cursor feature-auth

# Change the current shell directory when shell integration is active
arashi switch --cd feature-auth

# Use sesh/tmux switching mode
arashi switch --sesh

# Force launch behavior when switch defaults prefer cd
arashi switch --no-cd

# Ignore configured launch defaults for one run
arashi switch --no-default-launch
```

## Notes

- Default scope is parent repository worktrees only.
- In `--repos` mode, filter text matches repository names first:
  - exact repo match wins
  - otherwise a unique partial repo match is selected
- If `--repos` has no repo matches, Arashi prints available child repositories.
- Configure default switch mode in `.arashi/config.json` under `defaults.switch.mode` (`launch`, `cd`, or `auto`).
- Configure default launch mode in `.arashi/config.json` under `defaults.switch.launchMode`.
- Launch precedence is: explicit launch flag, then `--no-default-launch`, then configured switch default, then automatic environment detection.
- `mode: "auto"` prefers parent-shell switching only when shell integration is active and otherwise keeps launch behavior.
- Install shell integration with `arashi shell install` or print manual wrapper code with `arashi shell init <bash|zsh|fish>`.
- If `--cd` cannot act on the parent shell because the wrapper is inactive, Arashi warns and skips launch fallback for that invocation.
- When no explicit IDE flag is provided, `arashi switch` prefers Cursor, Kiro, or VS Code automatically when launched from those IDE-integrated terminals and the matching launcher is available.
- The VS Code extension passes the matching IDE flag automatically and labels current versus sibling worktrees in the panel when it is opened inside a related worktree.

## Related Commands

- [list](/commands/list/)
- [status](/commands/status/)
- [create](/commands/create/)
