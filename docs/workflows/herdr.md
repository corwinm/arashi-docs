---
title: Herdr
description: Open and reuse worktrees as Herdr workspaces.
draft: false
sidebar:
  hidden: false
  order: 7
---

## Requirements

- Herdr 0.7.4
- a running default session and reachable socket
- a non-bare main checkout

Arashi creates the Git worktree. Herdr opens it.

## Use Herdr

```bash
aw switch --herdr feature-auth
aw create feature-auth --herdr
```

Set Herdr as the default when wanted:

```json
{
  "defaults": {
    "create": { "launch": "herdr" },
    "switch": { "mode": "herdr" }
  }
}
```

Use `launch: "herdr"` for create and `mode: "herdr"` for switch.

An editor scope at `defaults.editors.<host>.create` does not inherit another editor's setting. `--no-launch` suppresses configured create launch; explicit `--herdr` remains authoritative.

Automatic detection uses Herdr inside an active Herdr environment unless tmux is nested above it. Ghostty containing Herdr selects Herdr. With `--tab`, Arashi opens a Herdr tab in the active Herdr workspace. See [Launching](/reference/launching/).

## Ownership

Arashi owns Git worktree creation and removal. It never delegates those operations to Herdr.

If launch fails after create, Arashi preserves every successfully created worktree and does not fall back to another launcher.

`aw remove` does not close Herdr workspaces. Close stale workspaces manually:

```bash
herdr workspace list
herdr workspace close <workspace-id>
```

Automated cleanup is optional. If used, a trusted pre-remove hook should parse `ARASHI_REMOVE_TARGETS_JSON`, match the exact checkout path from `.worktreePath`, and close only that workspace. Never call `herdr worktree remove`.

## Troubleshoot

Check `herdr --version`, the default session, socket access, and the non-bare main checkout. Contract or process failures return `LAUNCH_FAILED`.

## Related

- [switch](/commands/switch/)
- [create](/commands/create/)
- [remove](/commands/remove/)
- [Lifecycle Hooks](/reference/hooks/)
