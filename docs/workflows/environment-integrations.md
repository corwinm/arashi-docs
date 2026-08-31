---
title: Integrations
description: Open Arashi worktrees in your editor, terminal, or workspace manager.
draft: false
sidebar:
  hidden: false
  order: 7
---

Arashi owns Git worktrees. Your development tool owns the context where you work.

## Choose a tool

| Tool | Best fit |
| --- | --- |
| [VS Code, Cursor, or Kiro](/workflows/vscode/) | Editor-first work |
| [tmux or sesh](/workflows/tmux-and-sesh/) | Terminal windows and sessions |
| [Herdr](/workflows/herdr/) | Persistent workspaces with Git provenance |
| [cmux](/workflows/cmux/) | cmux-managed terminals |
| [Kitty](/workflows/kitty/) | Reusable live Kitty tabs |
| Ordinary terminal | New windows or current-shell navigation |

## Use automatic detection

```json
{
  "defaults": {
    "create": {
      "switch": true,
      "launch": "auto"
    },
    "switch": {
      "mode": "auto"
    }
  }
}
```

cmux and Kitty are automatic-only integrations. Herdr and sesh can be named defaults.

## Override once

```bash
aw switch feature-auth --vscode
aw switch feature-auth --tmux
aw switch feature-auth --herdr
```

Use `--tab` for a supported tab or managed equivalent. See [Launching](/reference/launching/) for support and precedence.

Arashi does not close stateful external contexts when removing a worktree. Close them deliberately.

## Related

- [Configuration](/reference/configuration/#create-and-switch-defaults)
- [switch](/commands/switch/)
- [create](/commands/create/)
- [shell](/commands/shell/)
