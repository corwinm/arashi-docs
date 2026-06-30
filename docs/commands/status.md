---
title: status Command
description: Inspect workspace and repository state for a branch.
draft: false
sidebar:
  hidden: false
---

## What It's For

Understand branch and repository state before pulling, syncing, or removing worktrees.

## What It Does

- Summarizes repository and worktree status across the workspace.
- Highlights mismatches and potential issues.
- Keeps intentionally omitted child repositories out of the default and short human views for partial coordinated worktrees.
- Provides a quick health check for current feature work.

## Usage

```bash
arashi status [options]
```

## Key Options

- `-v, --verbose` show full `git status` output for each repository.
- `-s, --short` show one-line summaries per repository.
- `--json` output machine-readable workspace status.

## Examples

```bash
# Default colorized status view
arashi status

# Full details per repository
arashi status --verbose

# Compact one-line summary
arashi status --short

# Emit structured status for automation
arashi status --json
```

## Notes

- `--verbose` and `--short` are mutually exclusive.
- Default and short human output hide configured child repositories that are missing from a partial coordinated worktree.
- Use `--verbose` or `--json` when you need to see every configured repository, including omitted or missing child repositories.
- Non-zero exit codes are returned if repository status checks fail.
- JSON mode is useful for agents and scripts that need to decide whether repositories are clean, dirty, behind, or ahead without scraping text.

## Agent Notes

- Run `arashi status` before creating, pulling, syncing, removing, or handing off work.
- Prefer `arashi status --json` when an agent needs to branch on clean, dirty, ahead, or behind state.
- Prefer `arashi status --json` or `arashi status --verbose` before deciding whether to complete a partial workspace with [`arashi clone`](/commands/clone/).
- Do not assume a workspace is safe to edit or merge until status confirms the affected repositories are in the expected state.

## Related Commands

- [pull](/commands/pull/)
- [sync](/commands/sync/)
