---
title: One Repository
description: Use Arashi in a project without workspace configuration.
draft: false
sidebar:
  hidden: false
  order: 4
---

<!-- markdownlint-disable MD033 -->

Configured mode is preferred when the project can adopt it. Standalone mode provides a smaller, ad hoc workflow.

<span id="bootstrap-with-arashi"></span>

## Start

```bash
aw init --zero-config
```

This creates the effective worktree directory and ensures an in-repository directory is ignored, adding a repository-local rule only when needed. The built-in location is `.worktrees/`; a personal `~/.arashi/config.json` may supply `worktreesDir` and naming/create/switch defaults. Bootstrap never creates `.arashi/config.json`.

<span id="create-and-use-a-worktree"></span>

## Work

```bash
aw create feat/docs
aw list
aw switch feat/docs
aw status
aw remove feat/docs
```

Without a user override, worktrees use `.worktrees/<branch>`. Relative user paths anchor at the main repository, while absolute shared roots receive a repository-qualified directory. Commands run from the main or a linked worktree resolve the same destination root.

<span id="choose-a-base-for-one-create"></span>

Choose a base for one create when needed:

```bash
aw create feature/docs --base main
```

<span id="supported-lifecycle"></span>

## Limits

An existing malformed or invalid workspace or user config produces an error rather than falling back or silently changing modes; fix the named file and field before retrying. Use `aw config effective` to inspect effective values and sources.

Standalone mode supports the single-repository lifecycle: `create`, `list`, `status`, `switch`, `remove`, `prune`, `doctor`, `move`, and `handoff`.

Repository filters, groups, workspace hooks, and multi-repository commands require configured mode. Personal create, switch, editor, worktree-directory, and naming defaults work in standalone mode. Standalone hooks continue to come only from applicable user-global hook locations.

<span id="upgrade-to-configured-mode"></span>

## Adopt configured mode

```bash
aw init
```

Review the proposed paths. Configured mode may not keep the standalone `.worktrees/<branch>` layout.

<span id="related-commands"></span>

## Related

- [init](/commands/init/)
- [create](/commands/create/)
- [switch](/commands/switch/)
- [remove](/commands/remove/)
- [Lifecycle Hooks](/reference/hooks/)

<!-- markdownlint-enable MD033 -->
