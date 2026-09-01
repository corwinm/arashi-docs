---
title: Configuration
description: Configure workspace layout, repositories, worktree behavior, and command defaults.
draft: false
sidebar:
  hidden: false
  order: 2
---

`aw init` creates `.arashi/config.json`. Commit this file when the workspace configuration should be shared with your team.

## Edit configuration

Run `aw configure` to inspect and edit common settings interactively:

```bash
aw configure
```

For settings that are not available in the interactive editor, edit `.arashi/config.json` directly. Run `aw doctor` afterward to validate the workspace and catch configuration problems. The examples below show only the fields relevant to each section and can be combined in one config file.

## Workspace layout

The smallest configured workspace names the directories where Arashi keeps repositories and worktrees:

```json
{
  "version": "1.0.0",
  "reposDir": "repos",
  "worktreesDir": ".arashi/worktrees",
  "repos": {
    "web": {
      "path": "repos/web",
      "gitUrl": "git@github.com:example/web.git"
    }
  }
}
```

Each key under `repos` is the name used by commands such as `aw create --only web`. `path` points to the canonical checkout. Add `gitUrl` when Arashi may need to clone it.

## Base branches

Set `baseBranch` once for the workspace, then override it only where a repository differs:

```json
{
  "baseBranch": "main",
  "meta": {
    "baseBranch": "integration"
  },
  "repos": {
    "api": {
      "path": "repos/api",
      "baseBranch": "release"
    }
  }
}
```

`meta.baseBranch` applies to the parent repository. `repos.<name>.baseBranch` applies to one child. Command-line `--base` and `--repo-base` options override configured values for one invocation.

## Repository groups

Add `groups` when you frequently target the same repositories together:

```json
{
  "repos": {
    "api": {
      "path": "repos/api",
      "groups": ["core"]
    },
    "docs": {
      "path": "repos/docs",
      "groups": ["docs"]
    }
  }
}
```

Use a group with any command that supports `--group`:

```bash
aw status --group core
aw create feature/update-docs --group docs
```

A repository may belong to more than one group. Combining `--group` with `--only` selects the intersection.

## Create and switch defaults

Set defaults when you want the same behavior without repeating flags:

```json
{
  "defaults": {
    "create": {
      "switch": true,
      "launch": "herdr"
    },
    "switch": {
      "mode": "auto"
    }
  }
}
```

- `defaults.create.switch` selects the new primary worktree after creation.
- `defaults.create.launch` accepts `none | auto | sesh | herdr`.
- `defaults.switch.mode` accepts `auto | cd | launch | sesh | herdr`.

Editor integrations use their own matching scope under `defaults.editors.<editor>.create`. Install [shell integration](/commands/shell/) when `auto` or `cd` should change the current shell directory.

## Worktree paths

Customize newly created configured-worktree paths with `worktreeNaming`:

```json
{
  "worktreeNaming": {
    "style": "repo-branch",
    "branchSlashes": "flatten",
    "maxPathLength": 180
  }
}
```

- `style`: `default`, `branch`, or `repo-branch`.
- `branchSlashes`: `preserve` or `flatten`.
- `maxPathLength`: optional maximum absolute worktree path length.

These settings affect new worktree paths only; they do not rename existing worktrees or change Git branch names.

## Copy or share worktree files

Use `copy` for files that each worktree should edit independently. Use `symlink` only for state that should intentionally be shared:

```json
{
  "repos": {
    "web": {
      "path": "repos/web",
      "copy": [".env"],
      "symlink": [".turbo"]
    }
  }
}
```

Entries are repository-relative and appear at the same path in each new worktree. Avoid symlinking `node_modules`; dependencies can differ between branches. Prefer package-manager content-addressed stores and per-worktree installs for dependency isolation. Use [lifecycle hooks](/reference/hooks/) for generated files, conditional setup, or more complex preparation.

## Hooks

Short lifecycle commands can live in `hooks.scripts` for the workspace or `repos.<name>.hooks` for one repository. For script files, platform-specific commands, execution order, and timeout settings, see the [Lifecycle Hooks reference](/reference/hooks/).

## Related references

- [init command](/commands/init/) for workspace setup and managed path ignore scope
- [configure command](/commands/configure/)
- [create command](/commands/create/)
- [switch command](/commands/switch/)
- [Full configuration reference](https://github.com/corwinm/arashi/blob/main/docs/configuration.md)
