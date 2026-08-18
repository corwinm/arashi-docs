---
title: tmux and sesh
description: Use plain tmux or sesh to keep Arashi worktree switching inside terminal-native session workflows.
draft: false
sidebar:
  hidden: false
  order: 6
---

Use this guide when terminal windows, panes, and sessions are the main way you move between Arashi worktrees.

## Force a Plain tmux Window

Use `--tmux` when this invocation must open the selected or newly created worktree in a new plain tmux window, regardless of configured launch defaults or other detected managed environments.

```bash
# Open an existing worktree in a new plain tmux window
aw switch --tmux feature-auth

# Create worktrees, then open the primary worktree in a new plain tmux window
aw create feature-auth --tmux
```

- Explicit tmux requires an active tmux client or session: Arashi requires a non-empty `TMUX` environment value after trimming.
- `--tmux` is per-invocation-only. It is not a `defaults.switch.mode` or `defaults.create.launch` value.
- A configured `auto` mode already chooses plain tmux contextually when Arashi runs inside tmux. The configuration vocabularies remain `auto | cd | launch | sesh | herdr` for switch and `none | auto | sesh | herdr` for create.
- Explicit tmux wins over configured `cd`, `sesh`, or `herdr` behavior and over detected Herdr, cmux, or integrated IDE contexts.
- Arashi passes the exact worktree path as one argv value to `tmux new-window -c`; spaces, quotes, and shell-significant characters are not interpolated by a shell.
- If tmux context is missing or `tmux new-window` fails, Arashi does not fall back to another launcher.
- Ghostty containing tmux still selects a tmux window for both the default independent launch and `--tab` managed equivalent; the containing Ghostty adapter does not outrank tmux. See the [launch disposition workflow](/workflows/launch-disposition/) for disposition precedence and the complete support matrix.

For `switch`, `--tmux` conflicts with `--cd`, `--sesh`, `--herdr`, `--vscode`, `--cursor`, and `--kiro`. It is compatible with `--launch` and remains authoritative with `--ignore-configured-launcher`.

For `create`, `--tmux` conflicts with `--sesh` and `--herdr`. It implies launch and target selection, so it remains active with `--no-launch` or `--no-switch`. Missing tmux context fails before worktrees or hooks are created. If the tmux process fails only after successful creation, Arashi preserves those worktrees and reports the launch failure.

## Use Automatic tmux Selection

Use automatic launch when tmux should win only because the current environment is inside tmux:

```bash
aw switch feature-auth
aw create feature-auth --launch
```

Configured `auto` preserves Arashi's managed-context order: tmux, Herdr, cmux, integrated IDE, parent-shell `cd`, then terminal/platform fallback. Set `defaults.switch.mode: "auto"` for this persistent contextual behavior. Without `--tmux`, named configured launchers and existing opt-outs retain their normal behavior.

```json
{
  "defaults": {
    "switch": {
      "mode": "auto"
    }
  }
}
```

## Use sesh Session Integration

Use `--sesh` when you want sesh's tmux session integration rather than a plain window. Unlike plain `--tmux`, this mode requires the `sesh` binary as well as an active tmux environment.

```bash
aw switch --sesh feature-auth
aw create feature-auth --sesh
```

- `--tmux` opens a plain tmux window with `tmux new-window`; `--sesh` delegates to sesh's session-aware workflow.
- Good for teams that treat each worktree as a session-oriented workspace.
- Set `defaults.create.launch: "sesh"` for explicit post-create sesh launch. This bypasses automatic context detection; if sesh validation or execution fails, Arashi preserves created worktrees and does not fall back to another launcher. For switching, set the unified `defaults.switch.mode: "sesh"`.
- Pair with shortcut flows such as `sesh connect "$(aw list | fzf)"` when you want faster session selection.

## Standalone Repositories

Explicit tmux has parity in a zero-config standalone repository. You do not need to adopt workspace configuration:

```bash
# From a standalone main or linked worktree inside tmux
aw switch --tmux feature-auth
aw create feature-auth --tmux
```

Arashi uses standalone discovery and safety rules and does not synthesize or persist `.arashi` configuration. Configured-only multi-repository options remain unavailable.

## JSON Automation

External tmux launch is intentionally unavailable in JSON mode. `switch --json --tmux` and `create --json --tmux` emit one structured `JSON_UNSUPPORTED_FOR_MODE` document before launch, mutation, launcher-conflict checks, or tmux-context validation. Use non-launching JSON invocations to automate worktree operations, then launch separately in an interactive step.

## Choosing Between Them

- Pick explicit `--tmux` for a deterministic plain window on one invocation.
- Pick configured `auto` when tmux should be selected contextually and other environments should retain their normal fallback order.
- Pick `--sesh` or a configured `sesh` mode for session-aware integration.
- Use `--cd` when you want Arashi to prepare the target path without opening a new terminal context.

## Related References

- [switch command](/commands/switch/)
- [create command](/commands/create/)
- [shell command](/commands/shell/)
- [Config workflow guide](/workflows/config/)
- [VS Code workflow guide](/workflows/vscode/)
- [Session shortcuts in the skill package](https://github.com/corwinm/arashi-skills/blob/main/skills/arashi/references/session-shortcuts.md)
