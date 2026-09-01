---
title: cmux
description: Open worktrees as cmux workspaces.
draft: false
sidebar:
  hidden: false
  order: 7
---

## Requirements

- cmux 0.64.18 or newer
- the `cmux` CLI
- local socket access

Run Arashi inside a cmux-managed terminal so it can detect the active workspace.

## Use cmux

```bash
aw switch feature-auth
aw create feature-auth --launch
```

Arashi creates and focuses a cmux workspace at the worktree path. If launch fails after create, the worktrees remain created.

Use automatic launch for persistent behavior:

```json
{
  "defaults": {
    "create": { "switch": true, "launch": "auto" },
    "switch": { "mode": "auto" }
  }
}
```

There is no `--cmux` flag. Use `mode: "cd"` when current-shell switching should win. Explicit launchers such as `--herdr` still take precedence.

For `--tab`, cmux uses a workspace / vertical tab in the active cmux session. See [Launching](/reference/launching/).

## Troubleshoot

- Confirm `CMUX_WORKSPACE_ID` or `CMUX_SURFACE_ID` is set.
- Run `cmux workspace create --help` to verify the required CLI.
- Check that socket access is not **Off**.

cmux failures return `LAUNCH_FAILED` and do not open standalone Ghostty.

## Related

- [switch](/commands/switch/)
- [create](/commands/create/)
- [Integrations](/workflows/environment-integrations/)
