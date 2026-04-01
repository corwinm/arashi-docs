---
title: Hooks
description: Use lifecycle hooks to automate setup and cleanup around Arashi create and remove workflows.
draft: false
sidebar:
  hidden: false
---

Use this guide after `arashi init` when your workspace needs setup or cleanup automation around `create` and `remove`.

## Create Hooks

- `.arashi/hooks/pre-create.sh`
- `.arashi/hooks/post-create.sh`
- `.arashi/hooks/pre-create.<repo>.sh`
- `.arashi/hooks/post-create.<repo>.sh`

## Remove Hooks

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

## `post-create` Examples

Create hooks are useful when every new worktree needs the same local setup. Make the hook executable with `chmod +x` after you create it.

Useful create-hook variables include:

- `ARASHI_WORKTREE_PATH` for the new worktree path
- `ARASHI_MAIN_REPO_PATH` for the main workspace path
- `ARASHI_BRANCH` for the new branch name
- `ARASHI_BASE_BRANCH` for the base branch used to create the worktree

### Install Node Dependencies With `pnpm`

Use a repo-specific hook when only one child repo needs package install.

File: `.arashi/hooks/post-create.web.sh`

```bash
#!/bin/sh
set -eu

cd "$ARASHI_WORKTREE_PATH"
pnpm install --frozen-lockfile
```

### Create a Python Virtual Environment With `uv`

File: `.arashi/hooks/post-create.api.sh`

```bash
#!/bin/sh
set -eu

cd "$ARASHI_WORKTREE_PATH"
uv venv
uv sync
```

### Create a Python Virtual Environment With `pip`

File: `.arashi/hooks/post-create.api.sh`

```bash
#!/bin/sh
set -eu

cd "$ARASHI_WORKTREE_PATH"
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

### Copy a Local `.env` File From the Main Worktree

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

1. Confirm the create and remove flow you want first.
2. Add workspace-level hooks only after you know which steps should be automatic.
3. Add repository-scoped or global hooks only for trusted scripts and narrow use cases.
4. Keep hooks focused on environment setup and cleanup, not on core project behavior.

## Related References

- [create command](/commands/create/)
- [remove command](/commands/remove/)
- [Config workflow guide](/workflows/config/)
- [Full hooks reference](https://github.com/corwinm/arashi/blob/main/docs/hooks.md)
