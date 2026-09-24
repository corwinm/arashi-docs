---
title: Work on a Change
description: Create, resume, publish, hand off, and clean up an Arashi change.
draft: false
sidebar:
  hidden: false
  order: 2
---

Use this workflow for day-to-day work in a configured workspace.

## Start

```bash
aw create feature-auth
aw switch feature-auth
aw status
```

Use `--only`, `--group`, or `--interactive` when the change needs fewer than all configured repositories. See [Integrations](/workflows/environment-integrations/) to open work in your editor or terminal.

## Resume

```bash
aw list
aw switch feature-auth
aw status
```

## Validate

Run checks only where they are needed:

```bash
aw exec --only frontend -- pnpm test
aw exec --group web -- pnpm test
```

Each repository keeps its own test and release rules.

## Hand off

```bash
aw handoff \
  --validation "pnpm test — passed" \
  --todo "review the API migration"
```

Report validation only after it has run. Put pending work under `--todo` or `--risk`.

## Publish and clean up

```bash
aw status
aw push --set-upstream
aw finish feature-auth --dry-run
aw finish feature-auth
```

Each repository still owns its commits, CI, and pull request. Check that each change is actually complete before cleanup; [`finish`](/commands/finish/) assesses integration and asks for manual judgment where proof is unavailable. Use [`remove`](/commands/remove/) for branch worktrees when you want direct cleanup, including abandoned work. Use [`delete`](/commands/delete/) only to remove a configured repository dependency.

## Related

- [Coordinate Repositories](/workflows/coordinate-repositories/)
- [Setup and Cleanup](/workflows/setup-and-cleanup/)
- [create](/commands/create/)
- [switch](/commands/switch/)
- [remove](/commands/remove/)
- [finish](/commands/finish/)
