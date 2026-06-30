---
title: Commands
description: What each Arashi command is for and what it does.
draft: false
sidebar:
  hidden: false
---

Use this section when you want command-level guidance.

## Command Pages

- [init](/commands/init/) - initialize a workspace.
- [add](/commands/add/) - add a repository to management.
- [clone](/commands/clone/) - clone missing configured repositories.
- [create](/commands/create/) - create coordinated worktrees.
- [move](/commands/move/) - move uncommitted changes between coordinated worktrees.
- [list](/commands/list/) - list worktree paths.
- [status](/commands/status/) - inspect repository state.
- [update](/commands/update/) - check for and apply CLI updates.
- [switch](/commands/switch/) - open a terminal context for a worktree.
- [shell](/commands/shell/) - install shell integration and helpers.
- [remove](/commands/remove/) - remove worktrees and branches.
- [pull](/commands/pull/) - pull remote updates across repos.
- [sync](/commands/sync/) - align child repos to parent branch.
- [setup](/commands/setup/) - run setup scripts across repos.

## Typical Flow

```bash
arashi init
arashi add git@github.com:your-org/frontend.git
arashi create feature-branch-name
arashi status
arashi switch
```

## Related

- [Getting Started](/getting-started/)
- [Workflows](/workflows/)
- [Contributing](/contributing/)
