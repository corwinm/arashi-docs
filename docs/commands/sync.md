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

- `-o, --only <repos>` sync repositories; repeat it, use commas, or mix both forms.
- `-g, --group <group>` sync groups; repeat it, use commas, or mix both forms.
- `-v, --verbose` show detailed per-repository sync output.
- `-j, --json` output machine-readable sync results.

## Examples

```bash
# Sync all managed repositories
arashi sync

# Sync selected repositories
arashi sync --only api,web

# Sync agent-support repositories
arashi sync --group agents

# Sync with per-repo details
arashi sync --verbose

# Sync selected repositories and emit JSON
arashi sync --only api,web --json
```

## Notes

- `sync` aligns repositories to the parent repository's current branch.
- When needed, it can create missing target branches in child repositories.
- `--group` targets configured semantic sets; with `--only`, it narrows the explicit repository selection by intersection.
- JSON mode keeps stdout parseable as a single result document for programmatic callers.

## Agent Notes

- Use `arashi sync` when branch/worktree state has drifted and you need the child repos aligned to the current parent branch.
- Prefer `--group <group>` when only a known semantic set should be synchronized.
- Inspect `arashi status` before and after sync so any remaining mismatches are visible before implementation or handoff.
- Avoid using sync as a substitute for understanding dirty worktrees; resolve or preserve local changes deliberately.

## Related Commands

`sync` requires configured mode and a persisted repository map. From standalone mode, run ordinary `arashi init` to upgrade; see the [Standalone Repository workflow](/workflows/standalone/).

- [pull](/commands/pull/)
- [push](/commands/push/)
- [status](/commands/status/)
