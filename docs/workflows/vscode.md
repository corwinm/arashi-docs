---
title: VS Code
description: Open and manage worktrees in VS Code and compatible editors.
draft: false
sidebar:
  hidden: false
  order: 5
---

## Open a worktree

```bash
aw switch --vscode feature-auth
```

Use `--cursor` or `--kiro` for those editors.

## Use the extension

Install `haphazarddev.arashi-vscode` from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=haphazarddev.arashi-vscode) or [Open VSX](https://open-vsx.org/extension/haphazarddev/arashi-vscode).

The extension provides:

- core Arashi commands in the command palette
- a worktree view with switch and remove actions
- workspace and repository shortcuts
- diagnostics in the **Arashi** output channel

## Show child repositories

If Source Control does not find repositories under `repos/`, increase its scan depth:

```json
{
  "git.repositoryScanMaxDepth": 2
}
```

Custom paths may need a different depth. Repositories outside the workspace must be added as workspace folders.

## Choose a workflow

- Use `aw switch --vscode` from a terminal.
- Use the extension when VS Code is your main workspace.
- Set `arashi.binaryPath` or `arashi.workspaceRoot` only when the defaults are wrong.

## Related

- [switch](/commands/switch/)
- [Integrations](/workflows/environment-integrations/)
