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
- Uses terminal-aware launch behavior (tmux, Herdr, cmux, VS Code, Cursor, Kiro, and common terminal apps).

## Usage

```bash
arashi switch [filter] [options]
```

## Key Options

- `--repos` target child repositories in the current workspace only.
- `--all` target parent workspaces and nested child repo worktrees.
- `--cd` request parent-shell directory switching for one invocation.
- `--no-cd` force launch behavior for one invocation.
- `--path` treat the argument as an exact worktree path instead of a fuzzy filter.
- `--sesh` run sesh mode in tmux (requires active tmux session and `sesh`).
- `--herdr` open or focus the selected existing worktree in a running Herdr session.
- `--vscode`, `--cursor`, `--kiro` explicitly open the selected worktree in that IDE for one invocation.
- `--no-default-launch` ignore configured switch launch defaults for one invocation.
- `--json` output machine-readable results when the selected mode can be represented safely.

## Examples

```bash
# Pick from parent workspace worktrees
arashi switch

# Match child repos by repository name first
arashi switch --repos docs

# Include parent workspaces plus child repo worktrees
arashi switch --all

# Select one exact worktree by full path
arashi switch --path /path/to/worktree

# Force the selected worktree to open in Cursor
arashi switch --cursor feature-auth

# Change the current shell directory when shell integration is active
arashi switch --cd feature-auth

# Use sesh/tmux switching mode
arashi switch --sesh

# Open or focus the selected worktree in Herdr
arashi switch --herdr feature-auth

# Force launch behavior when switch defaults prefer cd
arashi switch --no-cd

# Ignore configured launch defaults for one run
arashi switch --no-default-launch

# Ask for a structured result instead of human-oriented output
arashi switch feature-auth --json
```

## Notes

- Default scope is parent repository worktrees only.
- In `--repos` mode, filter text matches repository names first:
  - exact repo match wins
  - otherwise a unique partial repo match is selected
- If `--repos` has no repo matches, Arashi prints available child repositories.
- Configure default switch mode in `.arashi/config.json` under `defaults.switch.mode` (`launch`, `cd`, or `auto`).
- `--path` requires an exact worktree path and skips fuzzy branch/path matching.
- Configure default launch mode in `.arashi/config.json` under `defaults.switch.launchMode`; `"herdr"` selects Herdr even outside a Herdr-managed pane when its CLI can reach the running default session.
- Launcher resolution is: switch behavior and shell integration, one explicit launcher, configured launch mode unless `--no-default-launch` bypasses it, automatic tmux, automatic Herdr, then cmux/IDE/terminal/generic fallback.
- Automatic Herdr detection requires `HERDR_ENV` to trim to the exact string `1`. Similar values such as `0` or `true` do not select Herdr, and automatic tmux keeps precedence when both environments are active.
- `--herdr` conflicts with `--sesh`, explicit IDE flags, and `--cd`. Arashi rejects the combination instead of choosing one implicitly.
- Herdr launch requires v0.7.4 on `PATH`, a reachable running default session/socket, and a Git-resolved non-bare main checkout for the selected repository. Bare-only repositories fail before invoking Herdr.
- Herdr opens the existing target through `herdr worktree open`, focuses it, and reuses an already-open workspace. The requested label is `<repo-name>: <branch-name>` and can rename a reused workspace.
- A missing CLI/socket, non-zero process exit, invalid JSON, protocol mismatch, or missing workspace ID produces actionable `LAUNCH_FAILED` output. Once Herdr is selected, Arashi does not fall through to another launcher.
- In a cmux-managed terminal, automatic launch creates and focuses a new cmux workspace at the exact selected worktree. Arashi detects cmux from `CMUX_WORKSPACE_ID` or `CMUX_SURFACE_ID`, not from Ghostty's shared `TERM_PROGRAM` value.
- cmux launch requires cmux v0.64.18 or newer and local CLI socket access. If the CLI/socket is unavailable or its structured response cannot be validated, Arashi reports `LAUNCH_FAILED` instead of opening standalone Ghostty.
- An active tmux session inside cmux or Herdr keeps tmux precedence in automatic mode. Explicit `--sesh`, `--herdr`, `--vscode`, `--cursor`, and `--kiro` behavior remains authoritative.
- `mode: "auto"` prefers parent-shell switching only when shell integration is active and otherwise keeps launch behavior.
- Install shell integration with `arashi shell install` or print manual wrapper code with `arashi shell init <bash|zsh|fish>`.
- If `--cd` cannot act on the parent shell because the wrapper is inactive, Arashi warns and skips launch fallback for that invocation.
- When no explicit IDE flag is provided, `arashi switch` prefers Cursor, Kiro, or VS Code automatically when launched from those IDE-integrated terminals and the matching launcher is available.
- The VS Code extension passes the matching IDE flag automatically and uses exact-path switching for selected worktrees so duplicate branch names do not cause ambiguous matches.
- JSON mode does not launch editors, terminals, tmux, sesh, or parent-shell `cd` behavior unless the command can return a safe non-mutating plan. Unsupported launch modes return a structured `JSON_UNSUPPORTED_FOR_MODE` error.

## Related Commands

`switch` supports standalone repository worktrees; multi-repository scopes such as `--repos` and `--all` are configured-mode features. See the [Standalone Repository workflow](/workflows/standalone/).

- [list](/commands/list/)
- [status](/commands/status/)
- [create](/commands/create/)
- [Herdr workflow guide](/workflows/herdr/)
- [cmux workflow guide](/workflows/cmux/)
