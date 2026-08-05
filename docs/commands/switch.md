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
- Uses terminal-aware launch behavior (tmux, Herdr, cmux, VS Code, Cursor, Kiro, managed Kitty, and common terminal apps).

## Usage

```bash
arashi switch [filter] [options]
```

## Key Options

- `--repos` target child repositories in the current workspace only.
- `--all` target parent workspaces and nested child repo worktrees.
- `--cd` request parent-shell directory switching for one invocation.
- `--launch` force launch behavior while preserving a configured named launcher.
- `--ignore-configured-launcher` ignore a configured named launcher without erasing configured or contextual launch behavior.
- `--path` treat the argument as an exact worktree path instead of a fuzzy filter.
- `--tab` request a tab in the selected supported terminal or managed context for this invocation.
- `--tmux` open the selected worktree in a new plain tmux window for this invocation.
- `--sesh` run sesh mode in tmux (requires active tmux session and `sesh`).
- `--herdr` open or focus the selected existing worktree in a running Herdr session.
- `--vscode`, `--cursor`, `--kiro` explicitly open the selected worktree in that IDE for one invocation.
- `-j, --json` output machine-readable results when the selected mode can be represented safely.

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

# Force a new plain tmux window instead of another configured or detected launcher
arashi switch --tmux feature-auth

# Request a tab in the current supported terminal or managed context
arashi switch --tab feature-auth

# Open or focus the selected worktree in Herdr
arashi switch --herdr feature-auth

# Force launch behavior while preserving a configured named launcher
arashi switch --launch

# Request generic automatic launch, ignoring a configured named launcher
arashi switch --launch --ignore-configured-launcher

# Ask for a structured result instead of human-oriented output
arashi switch feature-auth --json
```

## Notes

- Default scope is parent repository worktrees only.
- In `--repos` mode, filter text matches repository names first:
  - exact repo match wins
  - otherwise a unique partial repo match is selected
- If `--repos` has no repo matches, Arashi prints available child repositories.
- Configure one default under `defaults.switch.mode`. The complete mode vocabulary is `auto | cd | launch | sesh | herdr`; `tmux` is deliberately not a configured value. `--tmux` is a per-invocation-only override, while configured `auto` chooses plain tmux contextually inside an active tmux session.
- `--path` requires an exact worktree path and skips fuzzy branch/path matching.
- `launch` always uses automatic launcher selection without preferring parent-shell switching. `sesh` and `herdr` always select that launcher, even when shell integration or another managed context is active.
- An absent mode preserves automatic launch and does not newly prefer parent-shell `cd` in configured or standalone repositories.
- `--tab` is a CLI-only, one-invocation disposition. It overrides configured or contextual parent-shell `cd` and bypasses configured `sesh` or `herdr` launch defaults, so `--tab` alone uses automatic launcher resolution. It conflicts only with explicit `--cd`; canonical `--launch` and `--ignore-configured-launcher` remain compatible. It composes with explicit launcher selectors, which stay authoritative while `--tab` controls disposition; unsupported selected adapters fail without opening a window or falling through. See the [launch disposition workflow](/workflows/launch-disposition/) for the complete matrix, JSON behavior, and safety boundaries.
- Configured `auto` uses this order: tmux → Herdr → cmux → integrated IDE → Kitty → parent-shell `cd` → terminal/platform fallback. Parent-shell switching is considered only when no managed context is strictly detected; it requires shell integration.
- Explicit launcher flags take precedence over configuration and environment detection. `--tmux` therefore overrides configured `cd`, `sesh`, or `herdr` behavior and detected Herdr, cmux, or IDE contexts. `--tmux` conflicts with `--cd`, `--sesh`, `--herdr`, `--vscode`, `--cursor`, and `--kiro`; Arashi reports the complete set instead of choosing by flag order.
- `--tmux` requires a non-empty `TMUX` value after trimming. Run the command from an active tmux client/session or choose another launcher. If the prerequisite is missing or `tmux new-window` fails, explicit tmux does not fall back to sesh, Herdr, cmux, an IDE, parent-shell `cd`, or a platform terminal.
- `--tmux` + `--launch` is compatible launch intent. `--tmux` + `--ignore-configured-launcher` remains explicit and authoritative, bypassing any configured named launcher rather than disabling tmux.
- Arashi invokes `tmux new-window -c <worktree-path>` without a shell; even paths containing spaces, quotes, or shell-significant characters remain the exact single argument after `tmux new-window -c`.
- Explicit tmux has the same behavior in a zero-config standalone repository: Arashi discovers the standalone target and opens it without creating or persisting Arashi configuration. Configured-only `--repos` and `--all` restrictions are unchanged.
- `--launch` preserves configured `sesh` or `herdr`. With only `--ignore-configured-launcher`, configured `auto`, `cd`, or `launch` behavior remains unchanged, while configured `sesh` or `herdr` keeps launch behavior but uses automatic launcher resolution. Combining them as `--launch --ignore-configured-launcher` requests generic automatic launch.
- `--cd` conflicts with `--launch`, `--tab`, and every explicit launcher selector. Canonical and compatibility synonyms for the same intent remain redundant but compatible.
- Explicit `--cd` warns and does not launch if parent-shell switching is unavailable. Configured `cd` warns and falls back to automatic launch in that situation.
- Automatic Herdr detection requires `HERDR_ENV` to trim to the exact string `1`. Similar values such as `0` or `true` do not select Herdr, and automatic tmux keeps precedence when both environments are active.
- `--herdr` conflicts with `--sesh`, explicit IDE flags, and `--cd`. Arashi rejects the combination instead of choosing one implicitly.
- Herdr launch requires v0.7.4 on `PATH`, a reachable running default session/socket, and a Git-resolved non-bare main checkout for the selected repository. Bare-only repositories fail before invoking Herdr.
- Herdr opens the existing target through `herdr worktree open`, focuses it, and reuses an already-open workspace. The requested label is `<repo-name>: <branch-name>` and can rename a reused workspace.
- A missing CLI/socket, non-zero process exit, invalid JSON, protocol mismatch, or missing workspace ID produces actionable `LAUNCH_FAILED` output. Once Herdr is selected, Arashi does not fall through to another launcher.
- In a cmux-managed terminal, automatic launch creates and focuses a new cmux workspace at the exact selected worktree. Arashi detects cmux from `CMUX_WORKSPACE_ID` or `CMUX_SURFACE_ID`, not from Ghostty's shared `TERM_PROGRAM` value.
- cmux launch requires cmux v0.64.18 or newer and local CLI socket access. If the CLI/socket is unavailable or its structured response cannot be validated, Arashi reports `LAUNCH_FAILED` instead of opening standalone Ghostty.
- An active tmux session inside cmux or Herdr keeps tmux precedence during automatic launch. Explicit `--sesh`, `--herdr`, `--vscode`, `--cursor`, and `--kiro` behavior remains authoritative.
- In Kitty 0.43+ with permitted remote control, automatic launch reuses and focuses the exact live worktree window or creates one managed session-backed tab. Once Kitty is selected, prerequisite, inspection, focus, launch, or validation failure reports `LAUNCH_FAILED` and does not fall back. See the [Kitty workflow guide](/workflows/kitty/) for safe setup, live-only ownership, and troubleshooting.
- Install shell integration with `arashi shell install` or print manual wrapper code with `arashi shell init <bash|zsh|fish>`.
- If `--cd` cannot act on the parent shell because the wrapper is inactive, Arashi warns and skips launch fallback for that invocation.
- When automatic launch reaches an integrated IDE and its optional CLI is unavailable, Arashi continues to terminal/platform fallback without returning to `cd`. A selected tmux, Herdr, or cmux failure—or an available IDE CLI that fails—remains an actionable launch failure and does not try another launcher or `cd`.
- The VS Code extension passes the matching IDE flag automatically and uses exact-path switching for selected worktrees so duplicate branch names do not cause ambiguous matches.
- JSON mode does not launch editors, terminals, tmux, sesh, or parent-shell `cd` behavior unless the command can return a safe non-mutating plan. `switch --json --tmux` returns exactly one JSON document with `JSON_UNSUPPORTED_FOR_MODE` and the existing `launch` mode label before launcher-conflict or tmux-context validation, including when `TMUX` is blank. It does not switch or invoke tmux.

## Deprecated compatibility spellings

The legacy `--no-cd` maps to `--launch`, and `--no-default-launch` maps to `--ignore-configured-launcher`. They remain parseable only as deprecated compatibility metadata throughout Arashi 1.x; preferred options, examples, and automation should use the canonical spellings above. Removal may happen no earlier than Arashi 2.0 and requires a separately approved breaking-change issue.

## Related Commands

`switch` supports standalone repository worktrees; multi-repository scopes such as `--repos` and `--all` are configured-mode features. See the [Standalone Repository workflow](/workflows/standalone/).

- [list](/commands/list/)
- [status](/commands/status/)
- [create](/commands/create/)
- [Herdr workflow guide](/workflows/herdr/)
- [cmux workflow guide](/workflows/cmux/)
- [Kitty workflow guide](/workflows/kitty/)
- [launch disposition workflow](/workflows/launch-disposition/)
