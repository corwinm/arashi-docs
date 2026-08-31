---
title: Set Up a Multi-Repository Workspace
description: Initialize a configured Arashi workspace, add repositories, and create the first coordinated change.
draft: false
sidebar:
  hidden: false
  order: 3
---

Arashi is designed to coordinate branches and worktrees across the repositories in a configured meta-repo. Start with the path that matches your workspace.

## Create a new meta-repo

Use this flow when you are starting fresh and want Arashi to initialize the workspace root.

```bash
mkdir my-meta-repo
cd my-meta-repo
aw init
```

When prompted for the repository target, enter `.` to initialize the current directory.

In non-bare repositories, `init` keeps the managed `reposDir` and `worktreesDir` out of Git status by default with repository-local rules in the common repository's `.git/info/exclude`. This protects generated workspace directories without changing the tracked `.gitignore` that your team shares. Bare configured init instead reports paths relative to the bare Git directory as unsafe or non-applicable and does not inspect or write worktree ignore files.

## Add Arashi to an existing meta-repo

Use this flow when you already have a repository that should become your Arashi workspace.

```bash
cd path/to/existing-meta-repo
aw init
```

Run `aw init` from the repository root you want Arashi to manage.

Non-bare workspaces keep managed worktrees inside the workspace by default, while bare workspaces place them alongside the bare repository. See the [init command reference](/commands/init/) for exact directory selection, custom-path, persistence, and compatibility behavior.

Git's effective ignore state wins. If a tracked `.gitignore`, repository-local exclude, or existing global excludes file already ignores a managed path, Arashi preserves that rule and does not add a duplicate. Arashi may read an effective global rule, but it never creates or modifies `core.excludesFile` or other global Git configuration.

Choose a different policy only when you intend it:

```bash
# Commit Arashi-managed rules to the workspace-root .gitignore for the team
aw init --ignore-scope tracked

# Do not let Arashi write ignore files; unignored managed paths produce warnings
aw init --ignore-scope none

# Restore the repository-local default later
aw init --ignore-scope local
```

Explicit `tracked` and `none` preferences are stored in clone-local Git configuration, not `.arashi/config.json`. They therefore apply to later `pull`, `clone`, `add`, and `create` operations in this clone without becoming a shared team setting. Choosing `local` removes that non-default preference.

Once `aw init` completes, continue with the core workflow:

```bash
aw add git@github.com:your-org/frontend.git
aw create feature-docs-bootstrap
aw switch feature-docs-bootstrap
aw status
```

An eligible interactive `aw add` can offer optional repository setup before it completes. See [Repository setup in the add command reference](/commands/add/#repository-setup) for eligibility, suppression behavior, and what the opt-in configures.

New managed worktrees are created under the persisted `worktreesDir`: `.arashi/worktrees` for the non-bare omitted default or the parent of a bare repository for its `..` omitted default.
Set command defaults in `.arashi/config.json` (`defaults.create`, `defaults.switch`) to define preferred switch and launch behavior, and use `aw shell install` if you want `aw switch` to support parent-shell `cd` behavior.

The next configured lifecycle command reconciles missing safe ignore rules before it materializes repositories or worktrees. Run `aw doctor` for a non-mutating check of missing, stale, invalid, or unsafe managed ignore state.

This configured workflow uses `.arashi/config.json` to coordinate repositories, groups, hooks, defaults, and managed paths.
