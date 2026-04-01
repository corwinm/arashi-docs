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

### `post-create` examples

Create hooks are useful when every new worktree needs the same local setup. Make the hook executable with `chmod +x` after you create it.

Useful create-hook variables include:

- `ARASHI_WORKTREE_PATH` for the new worktree path
- `ARASHI_MAIN_REPO_PATH` for the main workspace path
- `ARASHI_BRANCH` for the new branch name
- `ARASHI_BASE_BRANCH` for the base branch used to create the worktree

#### Install Node dependencies with `pnpm`

Use a repo-specific hook when only one child repo needs package install.

File: `.arashi/hooks/post-create.web.sh`

```bash
#!/bin/sh
set -eu

cd "$ARASHI_WORKTREE_PATH"
pnpm install --frozen-lockfile
```

#### Create a Python virtual environment with `uv`

File: `.arashi/hooks/post-create.api.sh`

```bash
#!/bin/sh
set -eu

cd "$ARASHI_WORKTREE_PATH"
uv venv
uv sync
```

#### Create a Python virtual environment with `pip`

File: `.arashi/hooks/post-create.api.sh`

```bash
#!/bin/sh
set -eu

cd "$ARASHI_WORKTREE_PATH"
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

#### Copy a local `.env` file from the main worktree

This is useful when your team keeps uncommitted local environment files in the main worktree and wants each new worktree to start with the same local config.

File: `.arashi/hooks/post-create.web.sh`

```bash
#!/bin/sh
set -eu

MAIN_ENV="$ARASHI_MAIN_REPO_PATH/repos/web/.env"
WORKTREE_ENV="$ARASHI_WORKTREE_PATH/.env"

if [ -f "$MAIN_ENV" ] && [ ! -f "$WORKTREE_ENV" ]; then
  cp "$MAIN_ENV" "$WORKTREE_ENV"
fi
```

If you want one shared hook for multiple child repos, use `.arashi/hooks/post-create.sh` and branch inside the script based on the target repository or the files present in `ARASHI_WORKTREE_PATH`.

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
