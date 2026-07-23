---
title: tmux and sesh
description: Use tmux and sesh to keep Arashi worktree switching inside terminal-native session workflows.
draft: false
sidebar:
  hidden: false
  order: 6
---

Use this guide when terminal windows, panes, and sessions are the main way you move between Arashi worktrees.

## tmux

Use tmux when you want terminal-native switching and multiple worktrees open at once.

```bash
arashi switch feature-auth
arashi switch --cd feature-auth
```

- `arashi switch` can open a new tmux window during automatic launch when Arashi detects a tmux session.
- `arashi switch --cd` is useful when you want to keep the current shell and jump directly into the worktree path.
- Set `defaults.switch.mode: "auto"` to prefer an active tmux context before parent-shell `cd`, even when shell integration is active. There is no configured `tmux` mode; explicit tmux mode is tracked separately.

## sesh

Use `sesh` when you want tmux session selection to be part of your default worktree navigation.

```bash
arashi switch --sesh feature-auth
```

- Good for teams that treat each worktree as a session-oriented workspace.
- Set `defaults.create.launch: "sesh"` for explicit post-create sesh launch. This bypasses automatic context detection; if sesh validation or execution fails, Arashi preserves created worktrees and does not fall back to another launcher. For switching, set the unified `defaults.switch.mode: "sesh"`.
- Pair with shortcut flows such as `sesh connect "$(arashi list | fzf)"` when you want faster session selection.

## Choosing Between Them

- Pick tmux when you want worktree switching to stay inside terminal windows or panes.
- Pick `tmux` plus `sesh` when you want session-aware switching and consistent multi-window navigation.
- Use `--cd` when you want Arashi to prepare the target path without opening a new terminal context.

## Related References

- [switch command](/commands/switch/)
- [shell command](/commands/shell/)
- [Config workflow guide](/workflows/config/)
- [VS Code workflow guide](/workflows/vscode/)
- [Session shortcuts in the skill package](https://github.com/corwinm/arashi-skills/blob/main/skills/arashi/references/session-shortcuts.md)
