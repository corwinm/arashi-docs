---
title: Kitty Worktree Sessions
description: Reuse live Kitty windows for Arashi worktrees with exact identity, readable labels, and safe remote-control prerequisites.
draft: false
sidebar:
  hidden: false
  order: 7
---

Use this workflow when running Arashi inside Kitty and you want repeated switches or post-create launches to focus the same live worktree window instead of opening duplicate tabs.

## Prerequisites

- Kitty 0.43 or newer.
- The `kitten` executable available on the inherited Kitty `PATH`. On macOS, Arashi can also use the standard Kitty application-bundle executable.
- Kitty remote control permitted by your Kitty configuration and password policy.

Check the client version from a Kitty window:

```bash
kitten --version
```

Kitty controls remote access with `allow_remote_control`, optional listening-socket settings, and remote-control passwords. Choose the narrowest policy that fits your environment by following [Kitty's remote-control documentation](https://sw.kovidgoyal.net/kitty/remote-control/). Arashi uses the current Kitty window's inherited remote-control context; it does not choose an arbitrary socket, weaken a password policy, or edit `kitty.conf` for you.

After configuring Kitty, restart it when the changed option requires a restart. Then verify access without printing Kitty's structured state:

```bash
kitten @ ls >/dev/null
```

Do not paste raw `kitten @ ls` output into logs or issue reports. It can contain child-process environment data.

## Switch and Reuse

```bash
arashi switch feature-auth
```

When automatic launch is active, managed Kitty runs after integrated IDE detection and before parent-shell `cd`. Higher-precedence explicit or configured launchers remain authoritative, and tmux nested inside Kitty remains tmux.

Arashi derives an exact Arashi worktree identity from the canonical worktree path and keeps it separate from the readable `<repo-name>: <branch-name>` label. On the first switch, Arashi creates and validates a session-backed tab at the exact worktree path. On later switches, it finds the exact marked window, focuses and validates it, and does not open a duplicate during ordinary reuse. Readable title or session-label drift does not change the stable exact identity.

## Post-create Launch

Automatic post-create launch uses the same managed Kitty behavior:

```bash
arashi create feature-auth --launch
```

Both configured and standalone creation route through the shared reuse-or-launch path when Kitty is automatically detected. If Kitty launch fails after creation, the created worktrees remain available; Arashi reports the launch failure separately instead of rolling back successful Git worktree creation.

Kitty is auto-detected only. There is no `--kitty` flag, and this integration does not add Kitty to persistent Arashi launch configuration. Continue to use `auto` when you want environment-aware selection.

## Live-session Ownership

Managed Kitty sessions are live only. Arashi does not generate or update a persistent `.kitty-session` file, restore windows after Kitty exits, or configure layouts and startup commands.

Arashi owns Git worktrees; Kitty owns its windows and sessions. `arashi remove` does not close Kitty windows or sessions and does not perform automatic cleanup. Close stale Kitty windows manually when you no longer need them.

## Troubleshooting

### Kitty is too old or `kitten` is unavailable

Upgrade to Kitty 0.43 or newer and confirm `kitten --version` works in the same Kitty environment where you run Arashi. Once Kitty is positively selected, a missing executable, malformed version, or unsupported version returns `LAUNCH_FAILED` and does not fall back to parent-shell switching or another terminal.

### Remote control is denied or unreachable

Run `kitten @ ls >/dev/null` from the same Kitty window. Review `allow_remote_control`, listening-socket settings, and your password policy in Kitty's configuration. Keep permissions as narrow as your workflow allows; do not bypass a denied policy merely to make Arashi launch.

After Kitty is selected, permission, socket, malformed-response, focus, launch, duplicate-state, or post-launch validation failures return actionable `LAUNCH_FAILED` detail. Arashi does not fall back to an ungrouped Kitty tab, another terminal, an IDE, or parent-shell `cd`.

### More than one exact window is reported

Arashi fails closed rather than choosing or closing one automatically. Inspect your live Kitty windows, close stale duplicates manually, and retry. Removing the Git worktree does not resolve or close Kitty windows for you.

## Related References

- [switch command](/commands/switch/)
- [create command](/commands/create/)
- [remove command](/commands/remove/)
- [tmux and sesh workflow guide](/workflows/tmux-and-sesh/)
