---
title: Window and Tab Launching
description: Choose Arashi's default independent launch or request a tab for one switch or create invocation.
draft: false
sidebar:
  hidden: false
  order: 6
---

Use this guide when you need to control whether Arashi opens a worktree in its normal independent context or as a tab in the current supported terminal or managed session.

## Default: An Independent Context

Without `--tab`, launch opens a new terminal window or an independent managed session. This avoids inheriting an application's tab-by-default behavior accidentally. In managed tools, the product's independent-session primitive may also be its documented tab equivalent: for example, tmux uses a window and cmux uses a workspace.

Arashi first honors explicit launcher selection and then strictly detected managed contexts. A containing terminal does not outrank its managed child context:

- **Ghostty + tmux** opens a tmux window.
- **Ghostty + Herdr** opens a Herdr workspace by default.
- **cmux** opens a workspace in the active session; cmux presents that workspace as a vertical tab.
- A bare supported native terminal uses its native new-window adapter.

## Request A Tab Once

`--tab` is a CLI-only, one-invocation request. It changes launch disposition and does not replace a launcher explicitly selected in the same invocation. When no explicit selector is present, tab intent also controls default selection by bypassing configured launcher defaults; it does not create a persistent preference.

```bash
# Open an existing worktree as a tab in the selected supported context
aw switch feature-auth --tab

# Create coordinated worktrees, select the primary worktree, and launch it as a tab
aw create feature-auth --tab

# Compose tab disposition with an explicit launcher selector
aw switch feature-auth --herdr --tab
aw create feature-auth --tmux --tab
```

For `switch`, explicit tab intent overrides configured or contextual parent-shell `cd` and bypasses configured behavior and named-launcher defaults, so `--tab` alone uses automatic launcher resolution. It conflicts only with explicit `--cd`; canonical `--launch` and `--ignore-configured-launcher` remain compatible, and it composes with explicit launcher selectors. An explicit launcher supplied with `--tab` remains authoritative while `--tab` controls that launcher's disposition. If the selected launcher cannot provide a supported tab, its adapter returns an unsupported result rather than turning the combination into a generic parser conflict.

Outside tab requests, `--launch --ignore-configured-launcher` is the exact generic automatic-launch combination.

For `create`, create tab implies launch and switch and bypasses configured launcher defaults, using automatic contextual launcher resolution unless `--tmux`, `--sesh`, or `--herdr` explicitly selects the adapter. It wins over `--no-launch` and `--no-switch`; redundant positive `--launch` and `--switch` remain compatible. Explicit launcher selectors still choose the adapter, while `--tab` chooses that adapter's disposition.

## Managed Context Precedence

Managed contexts outrank their containing terminals for both the default disposition and explicit tab requests:

| Invocation context | Default launch | `--tab` request |
| --- | --- | --- |
| Ghostty + tmux | New tmux window | tmux window (managed tab equivalent) |
| Ghostty + Herdr | New/reused Herdr workspace | Herdr tab in the active workspace |
| cmux | New cmux workspace in the active session | cmux workspace / vertical tab in the active session |
| Managed Kitty | Exact managed worktree session/tab | Exact managed worktree tab |
| Bare supported native terminal | Native new window | Native tab adapter |

Nested tmux remains authoritative over Herdr, cmux, Kitty, and its containing terminal. In an active Herdr environment without tmux, explicit tab uses the active Herdr workspace rather than the containing Ghostty window. cmux creates its workspace / vertical tab in the active cmux session rather than launching standalone Ghostty.

## Support Matrix

“Managed equivalent” means the integration's documented tab/session primitive preserves isolation even when the product does not name it a native application tab.

| Launcher or context | Default independent launch | Explicit tab | Required target evidence |
| --- | --- | --- | --- |
| Windows Terminal | New window | True tab | Current window/profile when available |
| WezTerm | New window | True tab | Current exact pane for tab targeting |
| managed Kitty | Exact managed session/tab | Managed tab | Managed remote-control identity |
| tmux / sesh | tmux window or sesh-managed session | Managed tab equivalent | Active tmux/session evidence |
| cmux | Workspace | cmux workspace / vertical tab | Active session identifiers |
| active-workspace Herdr | Workspace | Herdr tab | Active workspace ID |
| Terminal.app | New window | Unsupported | No supported true-tab automation |
| iTerm2 | New window | True tab | Current application/window/session |
| macOS Ghostty older than 1.3 or missing supported-version evidence | New window | Unsupported | No supported tab API |
| macOS Ghostty 1.3+ | New window | True tab | Current Ghostty window and supported version |
| Git Bash / MinTTY | New supported default path only | Unsupported | No stable exact tab-group target |
| unmanaged Kitty | New supported default path only | Unsupported | No managed remote-control identity |
| Linux Ghostty | New window | Unsupported | No external true-tab adapter |
| IDE workspaces | Existing editor behavior | Unsupported | No terminal-tab contract |
| generic fallback | New terminal/platform window | Unsupported | No portable exact tab target |

### Terminal.app manual tab workflow

Terminal.app's default `window` disposition remains supported and opens a new window. Its supported AppleScript API cannot safely create a true tab in an exact selected window, so an explicit Terminal.app `--tab` request returns `TAB_DISPOSITION_UNSUPPORTED` before target preflight, AppleScript, command execution, or fallback launch.

To work in a true Terminal.app tab, press Command-T manually, then run `aw switch --cd`:

```bash
aw switch --cd
```

This sequential workflow requires active Arashi shell integration so Arashi can change the current shell's directory.

To request Arashi's normal automatic launch instead of parent-shell directory switching or a configured named launcher, run `aw switch --launch --ignore-configured-launcher` directly. It opens a new Terminal window when automatic launcher resolution selects Terminal.app.

Unsupported tab disposition never opens a window or falls through to another launcher. An explicitly selected or positively detected unsupported adapter reports `TAB_DISPOSITION_UNSUPPORTED`; runtime automation or process failures after a supported adapter is selected report `LAUNCH_FAILED`. Neither case retries with the default window disposition.

## JSON Behavior

Tab launch is interactive/external behavior and is rejected in machine-readable mode before launch or mutation:

- `switch --json --tab` returns one `JSON_UNSUPPORTED_FOR_MODE` document using the existing `launch` mode and exit status `2`.
- `create --json --tab` returns one `JSON_UNSUPPORTED_FOR_MODE` document using the existing `interactive-or-launch` mode and exit status `1`.

These guards win before launcher conflicts or runtime-context validation. JSON stdout remains exactly one document.

## Preservation And Path Safety

Every supported adapter preserves the selected application, profile, shell, and working directory where that target exposes them. Arashi passes the exact path as data, never shell-interpolated; spaces, quotes, and shell-significant characters do not change the target path or become executable input.

For `create`, knowable unsupported combinations are resolved after authoritative workspace/config discovery but before worktree mutation, managed-ignore reconciliation, or create hooks. Dry-run previews tab intent without requiring runtime session evidence because it does not launch.

If a supported runtime launch fails after creation, Arashi reports the launch failure and preserves the created worktrees. It does not roll back successful Git creation or fall through to a window or different launcher.

## Configuration Does Not Change

The configuration vocabulary is unchanged. There is no persisted `tab`, launch-disposition field, or new mode value:

- `defaults.switch.mode`: `auto | cd | launch | sesh | herdr`
- `defaults.create.launch`: `none | auto | sesh | herdr`

Use `--tab` only when one invocation should differ from the normal default new-window or independent-session behavior.

## Troubleshooting

### A tab request reports unsupported

Confirm the selected adapter in the error details and compare it with the support matrix. Do not expect Arashi to open a window as a fallback. For WezTerm, run from a context with an exact pane. For Herdr, run inside an active workspace. For Kitty, use the managed remote-control workflow rather than an unmanaged Kitty process.

### A supported tab fails to launch

Treat `LAUNCH_FAILED` separately from `TAB_DISPOSITION_UNSUPPORTED`. Check the selected application's version, target/session evidence, automation permissions, and local socket or remote-control access. Retrying without `--tab` is a deliberate user choice, not an automatic Arashi fallback.

### The wrong containing terminal seems selected

Check nested managed-context markers first. Ghostty containing tmux must select tmux; Ghostty containing Herdr must select Herdr; cmux must use its active session. Remove stale environment markers only after confirming which program owns the current shell.

## Related References

- [switch command](/commands/switch/)
- [create command](/commands/create/)
- [tmux and sesh workflow](/workflows/tmux-and-sesh/)
- [Herdr workflow](/workflows/herdr/)
- [cmux workflow](/workflows/cmux/)
- [Kitty workflow](/workflows/kitty/)
- [Agents and Automation](/workflows/agents-and-specs/#automation-and-json)
