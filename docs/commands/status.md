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
- `-o, --only <repo>` inspect configured child repositories by identity; repeat it, use commas, or mix both forms.
- `-g, --group <group>` inspect requested groups; repeat it, use commas, or mix both forms.
- `-j, --json` output machine-readable workspace status.

## Examples

```bash
# Default colorized status view
arashi status

# Full details per repository
arashi status --verbose

# Compact one-line summary
arashi status --short

# Inspect documentation repositories only
arashi status --group docs

# Inspect one configured child and emit one JSON envelope
arashi status -o arashi-docs -j

# Emit structured status for automation
arashi status --json
```

## Notes

- `--verbose` and `--short` are mutually exclusive.
- Default and short human output hide configured child repositories that are missing from a partial coordinated worktree.
- `--group` filters status to repositories in the requested semantic group, such as `docs`, `core`, or `infra`.
- Repeated, comma-separated, or mixed `--only` and `--group` values use the shared normalization contract. When both are supplied, they intersect; unknown, explicitly empty, and empty-intersection filters fail closed before status work.
- `--only` selects configured child repositories only. Unselected child repositories are not fetched or inspected, while parent repository reporting remains unchanged in human and JSON summaries.
- In JSON output, `data.filters` reports the effective normalized `only` and `groups` values. `data.repositories` contains the selected child set plus the unchanged parent record, so the repository records and effective-filter metadata agree with the applied selection.
- Implicit standalone mode rejects `--only` and `--group` before Git fetch or inspection; ordinary standalone status remains unchanged when selectors are omitted.
- Use `--verbose` or `--json` when you need to see every configured repository, including omitted or missing child repositories.
- Non-zero exit codes are returned if repository status checks fail.
- JSON mode is useful for agents and scripts that need to decide whether repositories are clean, dirty, behind, or ahead without scraping text.

## Agent Notes

- Run `arashi status` before creating, pulling, syncing, removing, or handing off work.
- Prefer `arashi status --json` when an agent needs to branch on clean, dirty, ahead, or behind state.
- Prefer `arashi status --json` or `arashi status --verbose` before deciding whether to complete a partial workspace with [`arashi clone`](/commands/clone/).
- Do not assume a workspace is safe to edit or merge until status confirms the affected repositories are in the expected state.

## Related Commands

`status` supports standalone repositories and reports standalone mode and exact paths in human or JSON output. See the [Standalone Repository workflow](/workflows/standalone/).

- [list](/commands/list/)
- [pull](/commands/pull/)
- [sync](/commands/sync/)
