---
title: VS Code
description: Open and manage Arashi worktrees from VS Code with the CLI or the Arashi extension.
draft: false
sidebar:
  hidden: false
---

Use this guide when VS Code is your primary destination for opening and managing Arashi worktrees.

Arashi also supports other editors through one-off launch flags such as `--cursor` and `--kiro`. This page focuses on VS Code because it also has a dedicated extension.

## Open a Worktree in VS Code

Use the CLI when you are already in the terminal and want to open a specific worktree immediately.

```bash
arashi switch --vscode feature-auth
```

- Best for editor-first workflows where the terminal is secondary.
- Good default when your team reviews changes primarily inside VS Code.
- Useful when you want a one-off editor launch without changing workspace defaults.

## Install the VS Code Extension

Install the Arashi extension when you want Arashi controls inside the editor, not just a one-off CLI launch.

- VS Code Marketplace: [haphazarddev.arashi-vscode](https://marketplace.visualstudio.com/items?itemName=haphazarddev.arashi-vscode)
- Open VSX: [haphazarddev.arashi-vscode](https://open-vsx.org/extension/haphazarddev/arashi-vscode)

With the extension installed, you can:

- run core Arashi commands from the command palette, including `init`, `add`, `clone`, `create`, `pull`, `sync`, `switch`, and `remove`
- browse available worktrees in the **Arashi Worktrees** explorer view, including repo, branch, path, and change status
- use inline worktree actions to switch, remove, or add repositories without leaving the editor
- review command diagnostics in the **Arashi** output channel when setup or command execution fails
- respond to startup warnings in-editor, including a shortcut to run `Arashi: Init Workspace`

## Recommended Usage Pattern

- Use `arashi switch --vscode <branch>` when you are already in the terminal and want VS Code to open a specific worktree immediately.
- Use the extension when VS Code is your primary shell for day-to-day worktree management and you want a persistent worktree panel.
- Set `arashi.binaryPath`, `arashi.workspaceRoot`, or `arashi.commandTimeoutMs` in VS Code settings when the editor should target a specific binary or workspace root.
- Use `--cursor`, `--kiro`, or other supported launch flags when you want editor integration without the VS Code extension workflow.

## Related References

- [switch command](/commands/switch/)
- [shell command](/commands/shell/)
- [tmux and sesh workflow guide](/workflows/tmux-and-sesh/)
