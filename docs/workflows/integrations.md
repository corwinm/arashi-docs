---
title: Integrations
description: Choose the editor or terminal workflow that fits how you switch between Arashi worktrees.
draft: false
sidebar:
  hidden: false
---

Use this guide when you know the branch you want to open and need the right launch flow for your editor or terminal setup.

## VSCode

Use VSCode when you want Arashi to open the selected worktree directly in the editor.

Install the [Arashi VS Code extension](https://marketplace.visualstudio.com/items?itemName=haphazarddev.arashi-vscode) when you want Arashi controls inside the editor, not just a one-off CLI launch.

```bash
arashi switch --vscode feature-auth
```

- Best for editor-first workflows where the terminal is secondary.
- Good default when your team reviews changes primarily inside VSCode.
- One-off IDE flags are useful when you do not want to change workspace defaults.

With the extension installed, you can:

- run core Arashi commands from the command palette, including `init`, `add`, `clone`, `create`, `pull`, `sync`, `switch`, and `remove`
- browse available worktrees in the **Arashi Worktrees** explorer view, including repo, branch, path, and change status
- use inline worktree actions to switch, remove, or add repositories without leaving the editor
- review command diagnostics in the **Arashi** output channel when setup or command execution fails
- respond to startup warnings in-editor, including a shortcut to run `Arashi: Init Workspace`

Recommended usage pattern:

- Use `arashi switch --vscode <branch>` when you are already in the terminal and want VSCode to open a specific worktree immediately.
- Use the extension when VSCode is your primary shell for day-to-day worktree management and you want a persistent worktree panel.
- Set `arashi.binaryPath`, `arashi.workspaceRoot`, or `arashi.commandTimeoutMs` in VSCode settings when the editor should target a specific binary or workspace root.

## tmux

Use tmux when you want terminal-native switching and multiple worktrees open at once.

```bash
arashi switch feature-auth
arashi switch --cd feature-auth
```

- `arashi switch` can open a new tmux window when Arashi detects a tmux session.
- `arashi switch --cd` is useful when you want to keep the current shell and jump directly into the worktree path.
- Combine tmux with `defaults.switch.mode` when your team wants a consistent terminal flow.

## tmux + sesh

Use `sesh` when you want tmux session selection to be part of your default worktree navigation.

```bash
arashi switch --sesh feature-auth
```

- Good for teams that treat each worktree as a session-oriented workspace.
- Works well with `defaults.create.launchMode` or `defaults.switch.launchMode` set to `"sesh"`.
- Pair with shortcut flows such as `sesh connect "$(arashi list | fzf)"` when you want faster session selection.

## Choosing Between Them

- Pick VSCode when the editor should be the primary destination.
- Pick tmux when you want worktree switching to stay inside terminal windows or panes.
- Pick `tmux` plus `sesh` when you want session-aware switching and consistent multi-window navigation.

Arashi also supports other one-off IDE launch flags such as `--cursor` and `--kiro`, but VSCode, tmux, and `tmux` plus `sesh` cover the most common documented flows.

## Related References

- [switch command](/commands/switch/)
- [shell command](/commands/shell/)
- [setup command](/commands/setup/)
- [Session shortcuts in the skill package](https://github.com/corwinm/arashi-skills/blob/main/skills/arashi/references/session-shortcuts.md)
