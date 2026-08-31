---
title: Coordinate a Change Across Repositories
description: Select the repositories a change needs and keep their worktrees, validation, and handoff aligned.
draft: false
sidebar:
  hidden: false
  order: 3
---

Use this workflow when one change spans several independently versioned repositories, or when a configured workspace contains more repositories than the task needs.

## Choose the participating repositories

Create worktrees in one named repository:

```bash
aw create feature-auth --only frontend
```

Use a configured group for a recurring set:

```bash
aw create feature-auth --group web
```

Use interactive selection when the combination is temporary:

```bash
aw create feature-auth --interactive
```

Combining `--group` with `--only` selects their intersection. Prefer the smallest complete repository set for the task.

## Add an omitted repository later

An intentionally partial coordinated worktree does not need to remain partial. From that worktree, clone another configured child on the same branch:

```bash
aw clone
```

Choose `api` from the interactive repository selection. Use `aw clone --all` instead when every missing configured child should join the coordinated worktree.

Use verbose or JSON status when you need to distinguish participating children from configured repositories that were intentionally omitted:

```bash
aw status --verbose
aw status --json
```

## Inspect and validate consistently

Run targeted checks across the repositories that own the change:

```bash
aw exec --only frontend -- pnpm test
aw exec --only api -- pnpm test
```

Arashi coordinates paths and command execution; it does not combine repository-specific test suites or release rules. Validate each affected repository using its own documented commands.

## Keep Git ownership separate

Each repository keeps its own:

- commits and branch history,
- remote branch,
- CI checks,
- pull request,
- repository-specific documentation.

Keep shared plans and cross-repository coordination in the meta-repository. Keep implementation, tests, and project-specific documentation in the child repository that owns them. Open focused, cross-linked pull requests when a change spans repositories.

## Hand off the coordinated state

Use a single Arashi handoff to summarize the workspace, then attach repository-specific links and remaining work:

```bash
aw handoff \
  --link https://github.com/example/frontend/pull/42 \
  --link https://github.com/example/api/pull/18 \
  --todo "watch both CI runs"
```

## Related guides

- [Start, Resume, and Finish a Change](/workflows/change-lifecycle/)
- [Work with Coding Agents](/workflows/agents-and-specs/)
- [Repository groups](/reference/configuration/#repository-groups)
- [create command](/commands/create/)
- [clone command](/commands/clone/)
- [exec command](/commands/exec/)
