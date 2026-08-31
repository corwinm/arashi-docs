---
title: Environment Integrations
description: Choose how Arashi opens and reuses worktrees in your editor, terminal, or workspace manager.
draft: false
sidebar:
  hidden: false
  order: 7
---

Arashi owns Git worktree creation, discovery, and removal. Your editor, terminal, or workspace manager owns the context where you work. Choose the integration that matches how you normally move between tasks.

## Choose an environment

| Environment | Use it when | Arashi behavior |
| --- | --- | --- |
| [VS Code, Cursor, or Kiro](/workflows/vscode/) | Your editor is the primary place you manage work | Opens a worktree in the selected editor; VS Code also has an Arashi extension. |
| [tmux](/workflows/tmux-and-sesh/) | Terminal windows and panes organize your work | Automatically uses a nested tmux context or accepts explicit `--tmux`. |
| [sesh](/workflows/tmux-and-sesh/#use-sesh-session-integration) | Each worktree should participate in session-oriented tmux navigation | Delegates opening to sesh instead of creating a plain tmux window. |
| [Herdr](/workflows/herdr/) | You want persistent, reusable workspaces with Git provenance | Opens or focuses the existing Arashi worktree as a Herdr workspace. |
| [cmux](/workflows/cmux/) | cmux is your primary terminal | Detects the managed cmux terminal and creates a focused workspace. |
| [Kitty](/workflows/kitty/) | You want repeated switches to reuse an exact live Kitty worktree tab | Detects managed Kitty and focuses or creates the exact worktree session. |
| Ordinary terminal | You prefer a new window or current-shell navigation | Uses the supported terminal adapter or shell integration. |

## Configure a default or rely on context

Use `defaults.switch.mode: "auto"` when Arashi should detect the current managed environment. Use a named supported mode such as `herdr` or `sesh` when that tool should be authoritative:

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

Some integrations are intentionally automatic only. cmux and Kitty do not add explicit launcher flags or persistent named modes; they participate in automatic environment detection.

## Override one invocation

Use an explicit selector when one change should open somewhere different from your normal default:

```bash
aw switch feature-auth --vscode
aw switch feature-auth --tmux
aw switch feature-auth --herdr
```

Use `--tab` when one supported invocation should target a tab or the integration's managed equivalent instead of the normal independent context. See [Launching, Tabs, and Precedence](/reference/launching/) for exact support and precedence.

## Respect ownership boundaries

Arashi does not automatically close potentially stateful external contexts when removing a Git worktree. Editors, Herdr, cmux, Kitty, tmux, and other tools may still contain terminals, agents, or unsaved work. Inspect and close those contexts deliberately.

## Related references

- [Configuration](/reference/configuration/#create-and-switch-defaults)
- [Launching, Tabs, and Precedence](/reference/launching/)
- [switch command](/commands/switch/)
- [create command](/commands/create/)
- [shell integration](/commands/shell/)
