---
title: Kitty
description: Reuse live Kitty tabs for Arashi worktrees.
draft: false
sidebar:
  hidden: false
  order: 7
---

## Requirements

- Kitty 0.43 or newer
- the `kitten` executable
- Kitty remote control

Choose the narrowest `allow_remote_control` and password policy that works. Arashi does not edit `kitty.conf`.

Verify access without printing Kitty's process data:

```bash
kitten @ ls >/dev/null
```

## Use Kitty

```bash
aw switch feature-auth
aw create feature-auth --launch
```

Managed Kitty reuses the exact Arashi worktree identity while keeping a readable `<repo-name>: <branch-name>` label. It focuses and validates an existing tab before creating another.

Kitty is detected automatically after integrated IDE detection and before parent-shell `cd`. There is no `--kitty` flag, and Kitty is not added to persistent launch configuration.

In managed Kitty, `--tab` uses the exact worktree tab. See [Launching](/reference/launching/).

## Ownership

Kitty sessions are live only. Arashi does not write `.kitty-session` files or restore tabs after Kitty exits.

`aw remove` does not close Kitty windows or sessions. Close stale Kitty windows manually.

If launch fails after create, created worktrees remain available. Kitty returns `LAUNCH_FAILED` and does not fall back to another launcher.

## Troubleshoot

- Confirm `kitten --version` reports Kitty 0.43 or newer.
- Run `kitten @ ls >/dev/null` in the same window.
- Check remote-control, socket, and password settings.
- Close duplicate exact worktree windows manually.

## Related

- [switch](/commands/switch/)
- [create](/commands/create/)
- [remove](/commands/remove/)
