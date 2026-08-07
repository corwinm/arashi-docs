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
- [create](/commands/create/) - create a coordinated or standalone worktree.
- [move](/commands/move/) - move uncommitted changes between worktrees.
- [doctor](/commands/doctor/) - diagnose workspace health without making changes.
- [exec](/commands/exec/) - run an arbitrary command across selected managed repositories.
- [handoff](/commands/handoff/) - generate a Markdown or JSON workspace handoff report.
- [list](/commands/list/) - list worktree paths.
- [status](/commands/status/) - inspect repository state.
- [update](/commands/update/) - check for and apply CLI updates.
- [switch](/commands/switch/) - open a terminal context for a worktree.
- [shell](/commands/shell/) - install shell integration and helpers.
- [completion](/commands/completion/) - generate native Bash, Zsh, or Fish completion.
- [remove](/commands/remove/) - remove worktrees and branches.
- [prune](/commands/prune/) - clean stale Git worktree metadata.
- [pull](/commands/pull/) - pull remote updates across repos.
- [push](/commands/push/) - publish coordinated branches across repos.
- [sync](/commands/sync/) - align child repos to parent branch.
- [setup](/commands/setup/) - run setup scripts across repos.

## Typical Flow

```bash
arashi init
arashi add git@github.com:your-org/frontend.git
arashi create feature-branch-name
arashi doctor
arashi status
arashi exec -- git status --short
arashi handoff --link https://github.com/your-org/project/issues/123
arashi switch
```

## Related

- [JSON Automation](/workflows/json-automation/)
- [Getting Started](/getting-started/)
- [Workflows](/workflows/)
- [Contributing](/contributing/)
- [Standalone Repository](/workflows/standalone/)
