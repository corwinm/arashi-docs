---
title: cmux
description: Open Arashi worktrees as focused cmux workspaces through automatic terminal detection.
draft: false
sidebar:
  hidden: false
  order: 7
---

Use this guide when [cmux](https://cmux.com/) is your primary terminal and you want each Arashi worktree to open as its own cmux workspace.

## Prerequisites

- cmux v0.64.18 or newer.
- The `cmux` CLI installed with the application and available from the managed terminal.
- Local cmux socket access enabled. The normal **cmux processes only** access mode works for Arashi launched inside a cmux terminal.

cmux-managed terminals set `CMUX_WORKSPACE_ID` and `CMUX_SURFACE_ID`. Arashi uses those identifiers for detection because cmux and standalone Ghostty both report `TERM_PROGRAM=ghostty`.

## Switch to an Existing Worktree

```bash
aw switch feature-auth
```

From a cmux-managed terminal, Arashi runs the structured equivalent of:

```bash
cmux workspace create --cwd /absolute/path/to/worktree --focus true --json
```

The worktree path is passed as a distinct process argument, so paths containing spaces, quotes, or shell-significant characters are not interpolated through a shell. Arashi validates the returned workspace reference or UUID before reporting success.

## Launch After Create

```bash
aw create feature-auth --launch
```

The same cmux-aware launcher is used for post-create launch defaults. If coordinated worktree creation succeeds but cmux launch fails, the worktrees remain created and the command reports the launch failure separately.

You can also enable post-create launch in `.arashi/config.json`:

```json
{
  "defaults": {
    "create": {
      "switch": true,
      "launch": "auto"
    }
  }
}
```

## Precedence

Set `defaults.switch.mode: "auto"` when you want strict managed-context detection to select cmux before parent-shell switching. Set `defaults.switch.mode: "cd"` when parent-shell switching should remain authoritative even inside cmux.

Arashi preserves explicit launch, configured mode, and nested-session precedence:

1. Explicit `--sesh`, `--herdr`, or IDE launch flags such as `--vscode`, `--cursor`, and `--kiro` take precedence.
2. Configured `sesh`, `herdr`, and available `cd` modes take precedence over automatic context detection.
3. An active tmux session nested inside cmux opens a tmux window during automatic launch.
4. Otherwise, a cmux-managed terminal creates and focuses a cmux workspace before integrated IDE detection.
5. Standalone Ghostty and other detected terminal apps keep their existing launch behavior.

Arashi does not currently provide an explicit `--cmux` flag. Automatic detection is limited to managed cmux terminals; setting `CMUX_SOCKET_PATH` alone does not activate cmux launch behavior.

For explicit `--tab`, the supported managed equivalent is a cmux workspace / vertical tab in the active cmux session. Arashi does not launch the containing standalone Ghostty window, and a cmux failure never falls through to one. See the [launch disposition workflow](/workflows/launch-disposition/) for the full matrix and failure boundaries.

## Troubleshooting

### Arashi opens standalone Ghostty

Confirm the invocation is running inside a cmux-managed terminal:

```bash
printf '%s\n' "$CMUX_WORKSPACE_ID" "$CMUX_SURFACE_ID"
```

At least one identifier must be non-empty. A socket path by itself is intentionally insufficient because external processes can point at a cmux socket without being inside a cmux surface.

### `cmux workspace create` is unavailable

Update cmux to v0.64.18 or newer and verify the namespaced command:

```bash
cmux workspace create --help
```

Arashi relies on `--cwd`, `--focus`, and structured JSON output rather than parsing the legacy `new-workspace` text response.

### Socket access fails

Check that cmux socket access is not **Off**. For calls made from a cmux terminal, the default **cmux processes only** mode is sufficient. If cmux reports an inaccessible or disabled socket, Arashi returns `LAUNCH_FAILED` with the cmux error and does not silently open another terminal.

## Related References

- [switch command](/commands/switch/)
- [create command](/commands/create/)
- [tmux and sesh workflow guide](/workflows/tmux-and-sesh/)
- [cmux CLI/API documentation](https://cmux.com/docs/api)
