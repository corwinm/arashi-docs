---
title: Hooks and Config
description: Set command defaults and lifecycle hooks so Arashi behaves predictably after workspace setup.
draft: false
sidebar:
  hidden: false
---

Use this guide after `arashi init` when you want Arashi to create, switch, and clean up worktrees in a repeatable way.

## Command Defaults

Set defaults in `.arashi/config.json` when you want consistent behavior without repeating flags.

```json
{
  "defaults": {
    "create": {
      "switch": true,
      "launch": true,
      "launchMode": "sesh"
    },
    "switch": {
      "mode": "auto",
      "launchMode": "sesh"
    }
  }
}
```

- `defaults.create.switch` controls whether Arashi switches into the new worktree after `create`.
- `defaults.create.launch` and `defaults.create.launchMode` control how create opens the new context.
- `defaults.switch.mode` chooses between launch behavior, parent-shell `cd`, or automatic detection.
- `defaults.switch.launchMode` controls how `arashi switch` opens when launch behavior is used.

Install shell integration with `arashi shell install` if you want `defaults.switch.mode: "cd"` or `"auto"` to support parent-shell directory changes.

## Lifecycle Hooks

Use hooks when your workspace needs setup or cleanup automation around `create` and `remove`.

### Create hooks

- `.arashi/hooks/pre-create.sh`
- `.arashi/hooks/post-create.sh`
- `.arashi/hooks/pre-create.<repo>.sh`
- `.arashi/hooks/post-create.<repo>.sh`

### Remove hooks

- `repos/<repo>/.arashi/hooks/pre-remove.sh`
- `repos/<repo>/.arashi/hooks/post-remove.sh`
- `.arashi/hooks/pre-remove.sh`
- `.arashi/hooks/post-remove.sh`
- `~/.arashi/hooks/<repo>/pre-remove.sh`
- `~/.arashi/hooks/<repo>/post-remove.sh`
- `~/.arashi/hooks/pre-remove.sh`
- `~/.arashi/hooks/post-remove.sh`

Typical uses:

- run repository bootstrap after worktree creation
- stop tmux sessions before worktree removal
- clear generated files after branch cleanup
- apply repository-specific setup without hard-coding it into every workflow command

## Suggested Setup Sequence

1. Start with `defaults.create` and `defaults.switch` so the default behavior matches your team.
2. Enable shell integration if you want `arashi switch --cd` behavior.
3. Add workspace-level hooks only after you confirm the command flow you want.
4. Add repository-scoped or global hooks only for trusted scripts and narrow use cases.

## Related References

- [create command](/commands/create/)
- [remove command](/commands/remove/)
- [switch command](/commands/switch/)
- [shell command](/commands/shell/)
- [Full configuration reference](https://github.com/corwinm/arashi/blob/main/docs/configuration.md)
- [Full hooks reference](https://github.com/corwinm/arashi/blob/main/docs/hooks.md)
