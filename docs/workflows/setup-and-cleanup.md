---
title: Automate Worktree Setup and Cleanup
description: Prepare new worktrees and run trusted cleanup at the correct Arashi lifecycle scope.
draft: false
sidebar:
  hidden: false
  order: 4
---

Use this workflow when every new worktree needs dependencies, generated files, or other repeatable preparation.

## Choose the simplest mechanism

- Use `copy` when each worktree should receive an independent file such as `.env`.
- Use `symlink` when worktrees should intentionally share the same state.
- Use `aw setup` for an explicit, repeatable workspace setup operation.
- Use lifecycle hooks when setup or cleanup must run automatically around `aw create` or `aw remove`.

Configure copied and linked paths in [Configuration](/reference/configuration/#copy-or-share-worktree-files). Avoid symlinking `node_modules`; branches can require different dependencies.

## Add a repository setup hook

A repository-specific `post-create` hook runs in the new child worktree. Keep short commands inline:

```json
{
  "repos": {
    "web": {
      "path": "repos/web",
      "hooks": {
        "post-create": "corepack pnpm install --frozen-lockfile"
      }
    }
  }
}
```

For substantial or reusable logic, activate one platform-native file from the examples created by `aw init`. Keep the script fail-fast and idempotent.

For Python, a repository-specific script can bind package installation to the worktree's interpreter:

```bash
#!/bin/sh
set -eu

[ "$PWD" = "$ARASHI_HOOK_TARGET_WORKTREE_PATH" ] || exit 1
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
```

## Choose the narrowest scope

- Use a repository hook when the work belongs to one child repository.
- Use a workspace hook for coordination that truly belongs to the meta-repository.
- Use user-global hooks only for trusted behavior that should follow you across workspaces.

Workspace and shared remove hooks can run once for each target repository. Write cleanup so repeated execution is safe.

## Test before relying on automation

1. Confirm the lifecycle and scope.
2. Activate exactly one source for each logical hook location.
3. Use `aw remove --dry-run` to preview remove-hook discovery without execution. Configured `aw create --dry-run` does not discover or preview create hooks.
4. Create a disposable branch to observe create-hook outcomes, or remove one to observe remove-hook outcomes.
5. Confirm failure stops or finalizes the lifecycle where expected.

Use `--no-hook-input` for non-interactive invocations that should provide immediate EOF to hooks. JSON and non-TTY execution also disable interactive hook input.

## Keep ownership boundaries clear

Hooks may call external tools, but Arashi remains responsible for Git worktree creation and removal. Do not let cleanup integrations independently remove the same Git worktree. For example, a Herdr cleanup may close a known workspace, but it must not call `herdr worktree remove`.

See [Lifecycle Hooks](/reference/hooks/) for lifecycle order, discovery, platform extensions, environment variables, input policy, timeouts, dry-run behavior, and failure contracts.

## Related references

- [Lifecycle Hooks](/reference/hooks/)
- [Configuration](/reference/configuration/)
- [setup command](/commands/setup/)
- [create command](/commands/create/)
- [remove command](/commands/remove/)
