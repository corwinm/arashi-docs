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
- Runs configured lifecycle hooks when present.

## Usage

```bash
arashi create <branch> [options]
```

## Key Options

- `--only <repos>` limit creation to comma-separated repository names.
- `-i, --interactive` pick repositories interactively.
- `--switch` switch to the created parent worktree after create.
- `--no-switch` disable configured create switch defaults for one invocation.
- `--launch` open a terminal/editor context after create.
- `--no-launch` disable configured create launch defaults for one invocation.
- `--sesh` force sesh launch mode (implies launch behavior).
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

# Pick child repositories interactively while always creating the parent worktree
arashi create feature-auth-refresh --interactive

# Force launch for this run
arashi create feature-auth-refresh --launch

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

- `create` validates branch names and repository readiness.
- On failure, coordinated operations can roll back to keep repos consistent.
- Interactive `create` treats the parent/meta repository as the required anchor for the coordinated worktree; the selection prompt only controls child repositories.
- A partial coordinated worktree is valid. Add omitted child repositories later with [`arashi clone`](/commands/clone/) from inside that worktree.
- Configure defaults in `.arashi/config.json` under `defaults.create` (`switch`, `launch`, `launchMode`).
- Precedence for launch/switch behavior is: explicit flag > opt-out flag > config default > built-in default.
- JSON mode is intended for non-interactive automation. Launch modes that would open another app or session return a structured unsupported-mode error instead of mixing launch output with JSON.
- When the source workspace has uncommitted changes, create output includes guidance for moving compatible changes with [`arashi move`](/commands/move/). In JSON mode, that guidance is returned as structured data instead of human text.

## Agent Notes

- Check `arashi status` and `arashi list` before creating a branch so you do not duplicate an existing coordinated worktree.
- Use `--no-launch --no-switch` for unattended agent runs unless the user explicitly wants an editor or shell session opened.
- Prefer `--json` with explicit non-interactive flags when automation needs to verify created worktree paths.
- Use `--interactive` when a task only needs some child repositories; the parent worktree is still present, so shared metadata and coordination remain available.

## Related Commands

- [status](/commands/status/)
- [remove](/commands/remove/)
