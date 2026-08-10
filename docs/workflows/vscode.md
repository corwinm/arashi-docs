---
title: VS Code
description: Open and manage Arashi worktrees from VS Code with the CLI or the Arashi extension.
draft: false
sidebar:
  hidden: false
  order: 5
---

Use this guide when VS Code or a VS Code-based editor is your primary destination for opening and managing Arashi worktrees.

Cursor and Kiro are VS Code forks, so the same editor-first workflow generally applies there as well. This page focuses on VS Code because the Arashi extension is published through the standard VS Code extension ecosystems.

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
- browse available worktrees in the **Arashi Worktrees** Explorer view grouped by repository, including repo, branch, path, and change status
- use panel title actions to create worktrees and refresh the current view without leaving the editor
- use inline worktree actions to switch or remove a selected worktree with the exact clicked target
- open the workspace root or a related repository in a new editor window from the panel or command palette
- review command diagnostics in the **Arashi** output channel when setup or command execution fails
- respond to startup warnings in-editor, including a shortcut to run `Arashi: Init Workspace`

If the panel is not immediately visible, open the Explorer sidebar and reveal the **Arashi Worktrees** view from the Explorer view menu.

## Show Child Repositories in Source Control

A configured Arashi workspace keeps child repositories at `repos/<repository>`. Those Git roots are two directories below the workspace folder, while VS Code scans only one level by default. If the built-in **Source Control** view shows the meta-repository but not the child repositories, add this workspace setting:

```json
{
  "git.repositoryScanMaxDepth": 2
}
```

You can add it through **Preferences: Open Workspace Settings (JSON)**. Keep `git.autoRepositoryDetection` set to `true` (the default) or `subFolders`; `false` and `openEditors` disable the recursive workspace scan. Reload the editor window after changing repository-discovery settings if the repositories do not appear immediately.

This requirement comes from the combination of Arashi's directory layout and VS Code's one-level default, not from a recent Arashi change. VS Code [introduced `git.repositoryScanMaxDepth` in version 1.64](https://code.visualstudio.com/updates/v1_64) (January 2022), then [added nested Git repository discovery in version 1.72](https://code.visualstudio.com/updates/v1_72) (September 2022) while retaining the one-level default.

`git.detectWorktrees` is separate and is **not required** for this Source Control fix. It makes VS Code discover sibling linked worktrees belonging to an already-open repository, which can add worktrees outside the current Arashi workspace to the repositories view. Enable it only if you want VS Code's own worktree-management UI. VS Code [introduced that feature in version 1.103](https://code.visualstudio.com/updates/v1_103) (July 2025); after initially enabling it by default, VS Code [changed the default back to `false`](https://github.com/microsoft/vscode/commit/f92a4853f7f9f6c61b63d91dcb59c61f31bdfff0) in version 1.115.

## Recommended Usage Pattern

- Use `arashi switch --vscode <branch>` when you are already in the terminal and want VS Code to open a specific worktree immediately.
- Use the extension when VS Code is your primary shell for day-to-day worktree management and you want a persistent worktree panel.
- Set `arashi.binaryPath`, `arashi.workspaceRoot`, or `arashi.commandTimeoutMs` in VS Code settings when the editor should target a specific binary or workspace root.
- Use `--cursor` or `--kiro` when you want the same VS Code-style workflow in those editors.

## Related References

- [switch command](/commands/switch/)
- [shell command](/commands/shell/)
- [tmux and sesh workflow guide](/workflows/tmux-and-sesh/)
