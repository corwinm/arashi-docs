---
title: sync Command
description: Synchronize workspace repositories and worktree state.
draft: false
sidebar:
  hidden: false
---

## What It's For

Reconcile workspace state when repositories drift or after branch lifecycle changes.

## What It Does

- Checks configured repositories against expected workspace metadata.
- Refreshes repository/worktree alignment.
- Surfaces mismatches so maintainers can resolve them quickly.

## Usage

```bash
arashi sync [options]
```

## Key Options

- `--only <repos>` sync comma-separated repository names only.
- `-v, --verbose` show detailed per-repository sync output.

## Examples

```bash
# Sync all managed repositories
arashi sync

# Sync selected repositories
arashi sync --only api,web

# Sync with per-repo details
arashi sync --verbose
```

## Notes

- `sync` aligns repositories to the parent repository's current branch.
- When needed, it can create missing target branches in child repositories.

## Related Commands

- [pull](/commands/pull/)
- [status](/commands/status/)
