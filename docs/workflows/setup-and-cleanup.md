---
title: Setup and Cleanup
description: Prepare new worktrees and run trusted lifecycle cleanup.
draft: false
sidebar:
  hidden: false
  order: 4
---

Choose the simplest tool that fits:

- `copy` for an independent file in each worktree
- `symlink` for intentionally shared state
- `aw setup` for explicit setup
- lifecycle hooks for automatic create or remove behavior

Avoid symlinking `node_modules`; branches can require different dependencies.

## Add a setup hook

A repository `post-create` hook runs in the new child worktree:

```json
{
  "repos": {
    "web": {
      "path": "repos/web",
      "hooks": {
        "post-create": "corepack pnpm install --frozen-lockfile"
      }
    }
  }
}
```

Keep short commands inline. Put substantial logic in one platform-native file.

## Choose a scope

- Repository hooks belong to one child.
- Workspace hooks belong to the meta-repository.
- User-global hooks follow you across workspaces.

Keep hooks fail-fast and idempotent. Shared remove hooks may run once per target repository.

## Test hooks

1. Activate one source for each hook location.
2. Use `aw remove --dry-run` to preview remove-hook discovery.
3. Create or remove a disposable branch and inspect the outcome.

Configured `aw create --dry-run` does not discover or preview create hooks.

Arashi owns Git worktrees. External cleanup must not remove the same worktree independently.

## Related

- [Lifecycle Hooks](/reference/hooks/)
- [Configuration](/reference/configuration/)
- [setup](/commands/setup/)
- [create](/commands/create/)
- [remove](/commands/remove/)
