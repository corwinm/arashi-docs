---
title: Config
description: Set command defaults so Arashi creates and switches worktrees the way your team expects.
draft: false
sidebar:
  hidden: false
---

Use this guide after `arashi init` when you want Arashi to create and switch worktrees in a repeatable way without repeating flags on every command.

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

## Suggested Setup Sequence

1. Start with `defaults.create` and `defaults.switch` so the default behavior matches your team.
2. Enable shell integration if you want `arashi switch --cd` behavior.
3. Add hooks after you confirm the create and switch flow you want to automate.
4. Keep shared defaults in config and move environment-specific setup into hooks.

## Related References

- [create command](/commands/create/)
- [switch command](/commands/switch/)
- [shell command](/commands/shell/)
- [Hooks workflow guide](/workflows/hooks/)
- [Full configuration reference](https://github.com/corwinm/arashi/blob/main/docs/configuration.md)
