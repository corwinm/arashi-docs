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
- `--json` output machine-readable create results or structured unsupported-mode errors.

## Examples

```bash
# Create branch worktrees across the workspace
arashi create feature-auth-refresh

# Create in specific repositories only
arashi create feature-auth-refresh --only api,web

# Force launch for this run
arashi create feature-auth-refresh --launch

# Disable configured launch default for this run
arashi create feature-auth-refresh --no-launch

# Review the plan first
arashi create feature-auth-refresh --dry-run

# Create worktrees and emit JSON for automation
arashi create feature-auth-refresh --no-launch --no-switch --json
```

## Notes

- `create` validates branch names and repository readiness.
- On failure, coordinated operations can roll back to keep repos consistent.
- Configure defaults in `.arashi/config.json` under `defaults.create` (`switch`, `launch`, `launchMode`).
- Precedence for launch/switch behavior is: explicit flag > opt-out flag > config default > built-in default.
- JSON mode is intended for non-interactive automation. Launch modes that would open another app or session return a structured unsupported-mode error instead of mixing launch output with JSON.

## Agent Notes

- Check `arashi status` and `arashi list` before creating a branch so you do not duplicate an existing coordinated worktree.
- Use `--no-launch --no-switch` for unattended agent runs unless the user explicitly wants an editor or shell session opened.
- Prefer `--json` with explicit non-interactive flags when automation needs to verify created worktree paths.

## Related Commands

- [status](/commands/status/)
- [remove](/commands/remove/)
