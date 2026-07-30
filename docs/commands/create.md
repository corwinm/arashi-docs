---
title: create Command
description: Create a feature branch worktree across workspace repositories.
draft: false
sidebar:
  hidden: false
---

## What It's For

Start feature work across multiple repositories from a single command.

## What It Does

- Creates a worktree for the target branch in each configured repository.
- Ensures repositories are aligned to the same branch name.
- In interactive mode, always creates the parent/meta worktree and prompts only for optional child repositories.
- Reconciles managed ignore rules before creating any parent or child worktree.
- Runs configured lifecycle hooks when present.

## Usage

```bash
arashi create <branch> [options]
```

## Key Options

- `--only <repos>` limit creation to comma-separated repository names.
- `--group <group>` create worktrees only for repositories in the requested group. Repeat for multiple groups.
- `-i, --interactive` pick repositories interactively.
- `--switch` switch to the created parent worktree after create.
- `--no-switch` disable configured create switch defaults for one invocation.
- `--launch` open a terminal/editor context after create.
- `--no-launch` disable configured create launch defaults for one invocation.
- `--tmux` force a new plain tmux window after creation (implies launch and target selection).
- `--sesh` force sesh launch mode (implies launch behavior).
- `--herdr` open or focus the primary created worktree in Herdr (implies launch behavior).
- `--conflict <strategy>` preselect conflict handling (`ABORT`, `REUSE_EXISTING`).
- `--no-hooks` disable hook execution.
- `--no-progress` hide progress indicators.
- `--dry-run` generate a plan without creating worktrees.
- `--move-changes` move compatible uncommitted changes from the current workspace into the new worktree after create.
- `--json` output machine-readable create results or structured unsupported-mode errors.

## Examples

```bash
# Create branch worktrees across the workspace
arashi create feature-auth-refresh

# Create in specific repositories only
arashi create feature-auth-refresh --only api,web

# Create worktrees for the core repository group
arashi create feature-auth-refresh --group core

# Pick child repositories interactively while always creating the parent worktree
arashi create feature-auth-refresh --interactive

# Force launch for this run
arashi create feature-auth-refresh --launch

# Create worktrees and open the primary worktree in a new plain tmux window
arashi create feature-auth-refresh --tmux

# Create worktrees and open the primary worktree in Herdr
arashi create feature-auth-refresh --herdr

# Disable configured launch default for this run
arashi create feature-auth-refresh --no-launch

# Review the plan first
arashi create feature-auth-refresh --dry-run

# Create worktrees and emit JSON for automation
arashi create feature-auth-refresh --no-launch --no-switch --json

# Create worktrees and move current uncommitted work into them
arashi create feature-auth-refresh --move-changes
```

## Notes

- In standalone mode, `create` makes one worktree at the main root's `.worktrees/<branch>` path from either the main or a linked worktree. Before any mutation, Git must report the exact destination as effectively ignored; repository/group filters and interactive multi-repository selection are rejected. See the [Standalone Repository workflow](/workflows/standalone/).
- `create` validates branch names and repository readiness.
- On failure, coordinated operations can roll back to keep repos consistent.
- Reconciliation honors existing effective tracked, repository-local, or global rules before using the clone's stored scope or repository-local default. Scope `none` creates no ignore-file changes and warns for safe paths that remain unignored.
- `--dry-run` previews managed ignore scope, effective sources, planned rules, warnings, and unsafe skips without changing ignore files or clone-local preference state.
- If worktree creation is fully rolled back, reconciliation is restored too. If a worktree survives a partial failure, Arashi retains the ignore state needed for that final filesystem state and reports it.
- Interactive `create` treats the parent/meta repository as the required anchor for the coordinated worktree; the selection prompt only controls child repositories.
- `--group` targets configured semantic sets such as `core`, `docs`, `extensions`, `agents`, or `infra`.
- When combined with `--only`, `--group` narrows the explicit repository list by intersection. Empty intersections fail before creating worktrees.
- A partial coordinated worktree is valid. Add omitted child repositories later with [`arashi clone`](/commands/clone/) from inside that worktree.
- Configure one post-create choice in `.arashi/config.json` at `defaults.create.launch`: `none | auto | sesh | herdr`. The independent `switch` boolean can still select the new primary worktree without launching; every launch mode except `none` selects it too, so launch implies switch.
- `--tmux` is a per-invocation-only override and is not persisted in the generic or editor-scoped create configuration. Configured `auto` can still choose tmux contextually when launch runs inside tmux.
- Explicit `--tmux` takes precedence over generic and editor-scoped create defaults and automatic Herdr, cmux, or IDE detection. `--tmux` + `--no-launch` still implies post-create launch, and `--tmux` + `--no-switch` still selects and launches the primary created worktree.
- `--tmux` conflicts with `--sesh` and `--herdr`. Arashi reports the complete explicit-launcher conflict set before repository mutation.
- Launch precedence is deliberate. Otherwise `--sesh` or `--herdr` selects that explicit launcher even beside `--launch` or `--no-launch`; `--launch` selects `auto`; `--no-launch` selects `none`; then configured launch applies; an absent choice is built-in `none`.
- Terminal and editor-hosted defaults are isolated. See the [Config workflow](/workflows/config/) for matching-host scope and legacy migration rules.
- Explicit tmux requires a non-empty `TMUX` value after trimming. A missing or blank value is an actionable usage error before creating worktrees or running create hooks, so no create rollback is needed.
- After successful preflight, Arashi invokes `tmux new-window -c <primary-worktree-path>` without a shell. Paths containing spaces, quotes, or shell-significant characters remain the exact single argument after `tmux new-window -c`.
- If `tmux new-window` fails after creation, Arashi reports the launch failure, preserves the successfully created worktrees, and does not fall back to another launcher or roll back Git creation.
- Explicit tmux works the same way in a zero-config standalone repository and does not create or persist `.arashi` configuration. The standalone destination and effective-ignore safety checks still apply.
- Explicit `--herdr` implies launch and takes precedence over `--no-launch`, matching explicit `--sesh`. Combining `--herdr` with `--sesh` is rejected before worktree creation; without explicit `--herdr`, `--no-launch` suppresses configured Herdr.
- `create --launch` automatically selects Herdr only when `HERDR_ENV` trims to exactly `1` and no explicit or configured launcher wins. Automatic tmux keeps precedence over automatic Herdr.
- Herdr v0.7.4 requires a reachable default session/socket and a non-bare main checkout for the primary repository. It opens the already-created target, reuses an existing workspace, and applies the `<repo-name>: <branch-name>` label.
- If Herdr is missing, cannot reach its socket, returns an error or invalid response, or cannot use a bare-only source, Arashi reports `LAUNCH_FAILED`, preserves every successfully created worktree, and does not try another launcher or roll back Git creation.
- When post-create launch runs inside a cmux-managed terminal, Arashi creates and focuses a cmux workspace rooted at the new primary worktree. This requires cmux v0.64.18 or newer and local socket access.
- If cmux launch fails after worktree creation, the created worktrees remain available and Arashi reports the launch failure without falling back to standalone Ghostty.
- An active tmux session nested inside cmux keeps the existing tmux/sesh launch behavior.
- In an automatically detected Kitty 0.43+ context, post-create launch uses the same managed Kitty reuse-or-launch flow as `arashi switch`. If remote control, focus, launch, or validation fails after creation, the created worktrees remain available and Arashi reports `LAUNCH_FAILED` without another launcher or Git rollback. See the [Kitty workflow guide](/workflows/kitty/) for setup and ownership boundaries.
- JSON mode is intended for non-interactive automation. `create --json --tmux` returns exactly one JSON document with `JSON_UNSUPPORTED_FOR_MODE` and the existing `interactive-or-launch` mode label before worktree creation, hooks, launcher-conflict checks, or tmux-context validation. The same rejection wins for `--json --tmux --sesh` and blank `TMUX` input.
- Switch flags and defaults resolve independently from launch, but requested launch cannot be suppressed by `--no-switch`.
- Other explicit or configured launch resolving to `auto`, `sesh`, or `herdr` likewise returns one structured unsupported-mode error before worktree creation; resolved `none` may continue. Legacy migration warnings remain on stderr rather than contaminating JSON stdout.
- JSON results include structured managed ignore details and final changed/restored state without mixing human reconciliation output into stdout.
- When the source workspace has uncommitted changes, create output includes guidance for moving compatible changes with [`arashi move`](/commands/move/). In JSON mode, that guidance is returned as structured data instead of human text.

## Agent Notes

- Check `arashi status` and `arashi list` before creating a branch so you do not duplicate an existing coordinated worktree.
- Use `--no-launch --no-switch` for unattended agent runs unless the user explicitly wants an editor or shell session opened.
- Prefer `--json` with explicit non-interactive flags when automation needs to verify created worktree paths.
- Use `--interactive` when a task only needs some child repositories; the parent worktree is still present, so shared metadata and coordination remain available.
- Prefer `--group <group>` over a long `--only` list when a known semantic group matches the task scope.
- Treat managed ignore warnings as actionable workspace state; do not compensate by writing global Git configuration.

## Related Commands

- [status](/commands/status/)
- [remove](/commands/remove/)
- [Config workflow](/workflows/config/)
- [Herdr workflow guide](/workflows/herdr/)
- [cmux workflow guide](/workflows/cmux/)
- [Kitty workflow guide](/workflows/kitty/)
