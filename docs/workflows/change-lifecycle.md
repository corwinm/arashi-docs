---
title: Start, Resume, and Finish a Change
description: Carry an Arashi change from coordinated worktree creation through handoff and cleanup.
draft: false
sidebar:
  hidden: false
  order: 2
---

Use this workflow for the ordinary lifecycle of a change in a configured Arashi workspace.

## Start a change

Create the same branch across the configured repositories that participate in the work:

```bash
aw create feature-auth
```

Use `--only`, `--group`, or `--interactive` when the change needs fewer than all configured repositories. Arashi creates the selected worktrees beneath the configured `worktreesDir` and keeps each repository's Git history independent.

If you normally open new work immediately, set `defaults.create.switch` and `defaults.create.launch` once in [Configuration](/reference/configuration/). You can also choose an environment for one invocation:

```bash
aw create feature-auth --tmux
aw create feature-auth --herdr
```

## Work in the change

Open an existing branch from the workspace root or another coordinated worktree:

```bash
aw switch feature-auth
```

Arashi resolves the coordinated worktree and opens its primary location using your explicit choice, configured default, or detected environment. See [Environment Integrations](/workflows/environment-integrations/) to connect this step with your editor, terminal, or workspace manager.

Inspect the participating repositories before making or publishing changes:

```bash
aw status
```

Run the same inspection or validation in selected repositories when useful:

```bash
aw exec --only frontend -- git status --short
aw exec --group web -- pnpm test
```

Apply the narrowest selector that matches the task so unrelated repositories are not mutated or asked to perform expensive work.

## Resume later

List available worktrees and switch back to the branch:

```bash
aw list
aw switch feature-auth
aw status
```

When work is paused or transferred, produce a read-only handoff and add only context Arashi cannot infer:

```bash
aw handoff \
  --validation "pnpm test — passed" \
  --todo "review the API migration"
```

Report validation only after it has run. Put pending checks under `--todo` or `--risk`.

## Publish and finish

Check each repository's state before publishing. `aw push` coordinates branch publication, but each child repository still owns its commits, remote branch, CI, and pull request:

```bash
aw status
aw push --set-upstream
```

After the work is merged or otherwise no longer needed, preview cleanup and then remove the coordinated worktrees:

```bash
aw remove feature-auth --dry-run
aw remove feature-auth
```

Use `remove` for branch worktrees. Use [`delete`](/commands/delete/) only when you intend to remove a configured repository dependency from the workspace. Arashi does not automatically discard unsaved state in external tools such as Herdr or Kitty.

## Related guides

- [Coordinate a Change Across Repositories](/workflows/coordinate-repositories/)
- [Automate Worktree Setup and Cleanup](/workflows/setup-and-cleanup/)
- [Work with Coding Agents](/workflows/agents-and-specs/)
- [create command](/commands/create/)
- [switch command](/commands/switch/)
- [remove command](/commands/remove/)
