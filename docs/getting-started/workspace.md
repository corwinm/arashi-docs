---
title: Set Up a Workspace
description: Initialize a workspace and add repositories.
draft: false
sidebar:
  hidden: false
  order: 3
---

## Initialize

For a new workspace:

```bash
mkdir my-workspace
cd my-workspace
aw init
```

Enter `.` when asked for the repository target. In an existing meta-repository, run `aw init` from its root.

Arashi stores shared workspace settings in `.arashi/config.json`. Commit it when the team should share the configuration.

## Add repositories

```bash
aw add git@github.com:your-org/frontend.git
aw add git@github.com:your-org/backend.git
```

Non-bare workspaces keep managed worktrees inside the workspace by default. Bare workspaces place them alongside the bare repository. See [init](/commands/init/) for custom paths.

## Ignore managed paths

Repository-local ignore rules are the default. Choose another policy only when needed:

```bash
# Share the rules through .gitignore
aw init --ignore-scope tracked

# Do not write ignore rules
aw init --ignore-scope none
```

Use `aw doctor` to inspect managed-ignore state.

## Start work

```bash
aw create feature-auth
aw switch feature-auth
aw status
```

Continue with [Work on a Change](/workflows/change-lifecycle/).
