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

This creates `.worktrees/` and ensures Git ignores it, adding a repository-local rule only when needed. It does not create `.arashi/config.json`.

<span id="create-and-use-a-worktree"></span>

## Work

```bash
aw create feat/docs
aw list
aw switch feat/docs
aw status
aw remove feat/docs
```

Worktrees use `.worktrees/<branch>`. Commands run from the main or a linked worktree discover the same repository.

<span id="choose-a-base-for-one-create"></span>

Choose a base for one create when needed:

```bash
aw create feature/docs --base main
```

<span id="supported-lifecycle"></span>

## Limits

Standalone mode supports the single-repository lifecycle: `create`, `list`, `status`, `switch`, `remove`, `prune`, `doctor`, `move`, and `handoff`.

Repository filters, groups, workspace hooks, persisted defaults, and multi-repository commands require configured mode. Standalone hooks come only from applicable user-global hook locations.

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
