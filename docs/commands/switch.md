---
title: switch Command
description: Select an existing worktree to open a terminal, change shell directory, or start a T3 Code task.
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
- With explicit `--t3`, starts a T3 Code task in the selected checkout instead of launching or switching directories.

## Usage

```bash
aw switch [filter] [options]
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
aw switch

# Match child repos by repository name first
aw switch --repos docs

# Include parent workspaces plus child repo worktrees
aw switch --all

# Select one exact worktree by full path
aw switch --path /path/to/worktree

# Force the selected worktree to open in Cursor
aw switch --cursor feature-auth

# Change the current shell directory when shell integration is active
aw switch --cd feature-auth

# Use sesh/tmux switching mode
aw switch --sesh

# Force a new plain tmux window instead of another configured or detected launcher
aw switch --tmux feature-auth

# Request a tab in the current supported terminal or managed context
aw switch --tab feature-auth

# Open or focus the selected worktree in Herdr
aw switch --herdr feature-auth

# Force launch behavior while preserving a configured named launcher
aw switch --launch

# Request generic automatic launch, ignoring a configured named launcher
aw switch --launch --ignore-configured-launcher

# Ask for a structured result instead of human-oriented output
aw switch feature-auth --json
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
- An absent mode preserves automatic launch and does not newly prefer parent-shell `cd` in configured or standalone repositories when neither workspace nor user configuration supplies it. Explicit options override workspace `defaults.switch.mode`, then user `defaults.switch.mode`, per the [configuration precedence](/reference/configuration/#user-configuration).
- `--tab` is a CLI-only, one-invocation disposition. It overrides configured or contextual parent-shell `cd` and bypasses configured `sesh` or `herdr` launch defaults, so `--tab` alone uses automatic launcher resolution. It conflicts only with explicit `--cd`; canonical `--launch` and `--ignore-configured-launcher` remain compatible. It composes with explicit launcher selectors, which stay authoritative while `--tab` controls disposition; unsupported selected adapters fail without opening a window or falling through. See the [Launching](/reference/launching/) for the complete matrix, JSON behavior, and safety boundaries.
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
- Install shell integration with `aw shell install` or print manual wrapper code with `aw shell init <bash|zsh|fish>`.
- If `--cd` cannot act on the parent shell because the wrapper is inactive, Arashi warns and skips launch fallback for that invocation.
- When automatic launch reaches an integrated IDE and its optional CLI is unavailable, Arashi continues to terminal/platform fallback without returning to `cd`. A selected tmux, Herdr, or cmux failure—or an available IDE CLI that fails—remains an actionable launch failure and does not try another launcher or `cd`.
- The VS Code extension passes the matching IDE flag automatically and uses exact-path switching for selected worktrees so duplicate branch names do not cause ambiguous matches.
- JSON mode does not launch editors, terminals, tmux, sesh, or parent-shell `cd` behavior unless the command can return a safe non-mutating plan. `switch --json --tmux` returns exactly one JSON document with `JSON_UNSUPPORTED_FOR_MODE` and the existing `launch` mode label before launcher-conflict or tmux-context validation, including when `TMUX` is blank. It does not switch or invoke tmux.

## Hand off to T3 Code

Start a task in one existing checkout without opening a terminal or moving your current conversation:

```bash
aw switch --path /path/to/worktree --t3 --prompt-file task.md

# Deliberately start another thread after the first handoff is resolved
aw switch --path /path/to/worktree --t3 "Review the changes" --t3-intent review-1

# Select a child checkout, not its enclosing parent
aw switch --repos --path /path/to/child-worktree --t3 --prompt-file task.md
```

### Selection and options

Normal discovery and filtering still apply: the default scope is parent worktrees; `--repos` selects children; `--all` includes both. `--repos --all` is invalid. Only the selected checkout receives the task, including a main checkout when discovery lists it. Standalone repositories use their own worktrees and reject `--repos` and `--all`. `--path` is a Boolean making the positional argument exact, not an option taking a path value; arbitrary directories or checkout subdirectories are not targets. Interactive selection is available in human mode; ambiguous noninteractive or JSON selection fails with candidates instead of choosing silently.

| Option | Contract |
| --- | --- |
| `--t3 [task]` | Explicitly select T3; provide one nonempty inline task or use `--prompt-file`. |
| `--prompt-file <path>` | Read a non-whitespace UTF-8 task file relative to the original invocation directory. |
| `--permission <mode>` | `approval-required`, `auto-accept-edits`, or `full-access`; initial omission uses `full-access`. |
| `--t3-base-dir <path>` | Select the local T3 data environment (the supported profile selection). |
| `--t3-cli <path>` | Select the official T3 executable. |
| `--t3-provider <id>` | Select a configured provider instance, or a driver identifying exactly one instance. |
| `--t3-model <model>` | Select an available model or supported alias. |
| `--t3-effort <effort>` | Select an effort supported by the chosen model. |
| `--t3-intent <id>` | Local session/retry identity; omission is the stable literal `default`. |

Every T3-only option requires explicit `--t3`. There is no default task, `--t3-profile`, or switch `--dry-run`. Do not combine T3 with `--cd`, `--launch`, `--tab`, `--tmux`, `--sesh`, `--herdr`, `--vscode`, `--cursor`, or `--kiro`. `--ignore-configured-launcher` is accepted but redundant.

T3 bypasses all configured switch modes (`auto`, `cd`, `launch`, `sesh`, `herdr`), personal switch defaults, managed-terminal detection, and shell directory directives. It never falls back to a launcher after failure. It creates no worktrees, moves no changes, installs no dependencies, and runs no create/setup hooks.

### Defaults and deliberate sessions

Initial settings resolve per leaf: explicit CLI > current workspace configuration > user configuration, then native T3 environment/catalog defaults. Configuration comes from the invocation workspace, not the destination checkout; invalid applicable configuration still fails. The base directory falls back to `T3CODE_HOME`, then `~/.t3`; the executable falls back to installed `t3`. Provider/model/effort use the native project's selection, then server selection and live catalog defaults; there is no hardcoded model. See [T3 Code](/workflows/t3-code/#choose-a-model).

An intent ID must match `[A-Za-z0-9][A-Za-z0-9._-]{0,63}` exactly. IDs are case-sensitive and preserved literally, including portable IDs such as `CON`, `NUL.txt`, and `followup.`. Do not normalize or rewrite them. `Followup` and `followup` are different intents; explicit `default` equals omission. This is not a T3 thread ID.

Reusing an intent is always a retry: an accepted retry returns the saved success without another submission. To deliberately start a new thread, choose a different ID, such as `review-2`, after earlier handoffs for that checkout are resolved. Distinct IDs can use the same task; changed task text under an existing ID is an error, not a new session.

Retries retain the original environment, provider instance, model/options, and permission. Omitted permission or model flags use receipt-pinned values, not changed defaults. Explicit changes to the task, target, settings, or permission reject intent reuse. Permissions never come from the originating conversation or a T3 profile. Saved selections must remain valid in the live catalog.

### Prerequisites, output, and recovery

Use a running local T3 environment on the repository host, matching stable official CLI/server versions 0.0.43 or later, protocol 1, authenticated orchestration read/operate scopes, and an available provider/catalog. Arashi uses the official CLI to issue and revoke a short-lived session. It does not install T3, scan ports, guess profiles, or read private databases. See [setup and compatibility](/workflows/t3-code/#set-up-t3-code).

Arashi reports the exact branch, repository, checkout, intent, permission/selection, and available environment/project/thread/message identifiers. Manually select the reported project/thread in a desktop, web, or mobile T3 client connected to the same host environment. No client opens or focuses automatically, and the original conversation remains attached to its original checkout.

`--json` is supported for T3 only: stdout contains one `command: switch` envelope with selected-target and `t3Handoff` details, including `intentId`, stage/dispatch status, known IDs, receipt path, retry guidance, and UI `none`/`skipped`. Unknown IDs are null. Accepted outcomes, including accepted retries, exit `0`; invalid input/configuration/selection exits `2`; prerequisite, lock, receipt, uncertainty, or cleanup failures exit `1`. A persistence or cleanup error after acceptance retains dispatch success and IDs even though the command exits nonzero. Ordinary switch JSON restrictions remain unchanged; T3 launcher conflicts return a structured conflict error.

Follow the reported recovery instructions with the same exact checkout, intent, task source/content, and original environment. A retry after uncertain submission only reconciles positive evidence of the saved message; it never resends. A missing message or deleted/changed thread is not proof of rejection. Preparation recovery reuses saved IDs only after official evidence permits continuation.

Unresolved create/switch handoffs, stale locks, unsafe/corrupt receipts, or orphan temporary files block another handoff for the affected checkout (unassignable root temporary files can block the repository). Do not choose a new intent, delete state, recreate a thread, or switch environments to bypass uncertainty. Preserve recovery state and inspect the reported project/thread. Manual backup/reconciliation and retirement of the exact reported state is a last resort, not proof redispatch is safe; confirm a lock owner has stopped and reconcile before removing its lock. There is no automatic expiry, eviction, or lock takeover. Unlike switch's accepted retry, create's successful receipt still blocks a duplicate create handoff.

## Deprecated compatibility spellings

The legacy `--no-cd` maps to `--launch`, and `--no-default-launch` maps to `--ignore-configured-launcher`. They remain parseable only as deprecated compatibility metadata throughout Arashi 1.x; preferred options, examples, and automation should use the canonical spellings above. Removal may happen no earlier than Arashi 2.0 and requires a separately approved breaking-change issue.

In T3 mode, deprecated `--no-cd` conflicts with `--t3`; deprecated `--no-default-launch` is accepted but redundant.

## Related Commands

`switch` supports standalone repository worktrees; multi-repository scopes such as `--repos` and `--all` are configured-mode features. See the [One Repository](/getting-started/standalone/).

- [list](/commands/list/)
- [status](/commands/status/)
- [create](/commands/create/)
- [Herdr workflow guide](/workflows/herdr/)
- [cmux workflow guide](/workflows/cmux/)
- [Kitty workflow guide](/workflows/kitty/)
- [Launching](/reference/launching/)
