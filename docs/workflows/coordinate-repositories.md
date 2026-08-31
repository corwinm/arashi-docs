---
title: Coordinate Repositories
description: Select, validate, and hand off work across repositories.
draft: false
sidebar:
  hidden: false
  order: 3
---

Use the smallest repository set that completes the change.

## Select repositories

```bash
# One repository
aw create feature-auth --only frontend

# A configured group
aw create feature-auth --group web

# A temporary selection
aw create feature-auth --interactive
```

Combining `--group` with `--only` selects their intersection.

## Add a repository later

From a partial coordinated worktree, run:

```bash
aw clone
```

Choose the missing repository. Use `aw clone --all` to add every missing configured child.

## Inspect and validate

```bash
aw status --verbose
aw exec --only frontend -- pnpm test
aw exec --only api -- pnpm test
```

Arashi coordinates worktrees and commands. Each repository keeps its own commits, CI, pull request, and project-specific documentation.

Keep shared plans in the meta-repository. Keep implementation and tests in the child repository that owns them.

## Hand off

```bash
aw handoff \
  --link https://github.com/example/frontend/pull/42 \
  --link https://github.com/example/api/pull/18 \
  --todo "watch CI"
```

## Related

- [Work on a Change](/workflows/change-lifecycle/)
- [Coding Agents](/workflows/agents-and-specs/)
- [Repository groups](/reference/configuration/#repository-groups)
- [clone](/commands/clone/)
- [exec](/commands/exec/)
