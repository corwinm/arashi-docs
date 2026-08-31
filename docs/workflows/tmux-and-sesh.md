---
title: tmux and sesh
description: Open worktrees in tmux windows or sesh sessions.
draft: false
sidebar:
  hidden: false
  order: 6
---

## tmux

Run inside an active tmux session:

```bash
aw switch --tmux feature-auth
aw create feature-auth --tmux
```

`--tmux` opens a plain tmux window. It requires a non-empty `TMUX` value, applies to one invocation, and does not fall back to another launcher on failure.

Use automatic selection when tmux should win only in tmux:

```json
{
  "defaults": {
    "switch": { "mode": "auto" },
    "create": { "launch": "auto" }
  }
}
```

The configured `auto` mode detects the current managed context. Ghostty containing tmux still opens a tmux window. See [Launching](/reference/launching/) for precedence.

## sesh

Use sesh when each worktree should be a session:

```bash
aw switch --sesh feature-auth
aw create feature-auth --sesh
```

This requires the `sesh` binary and an active tmux environment. To make it the default, use `mode: "sesh"` for switch and `launch: "sesh"` for create. A named sesh default bypasses automatic context detection and does not fall back on failure.

## Notes

- `--tmux` is per-invocation-only.
- Both modes work in a zero-config standalone repository.
- JSON launch requests return `JSON_UNSUPPORTED_FOR_MODE`; automate the worktree operation and launch separately.

## Related

- [switch](/commands/switch/)
- [create](/commands/create/)
- [Launching](/reference/launching/)
