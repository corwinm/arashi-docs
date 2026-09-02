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

`style` is `default`, `branch`, or `repo-branch`. `branchSlashes` is `preserve` or `flatten`. Omitting either field uses `default` and `preserve` effectively while leaving the omitted field omitted when configuration is normalized or saved. For branch `feature/auth`, `branch` produces `feature/auth` (or `feature-auth` when flattened); `repo-branch` produces `repo-feature/auth` (or `repo-feature-auth`). The shape-aware `default` uses the branch path for a non-bare configured repository and `repo/feature/auth` for a bare configured repository. Existing worktrees are not renamed when this policy changes; recorded worktree metadata remains authoritative, and a chosen destination collision fails without appending an alternate suffix. Coordinated children retain their configured paths beneath the single resolved parent destination.

`maxPathLength` is optional and must be a positive integer from 1 through 2,147,483,647. It budgets the UTF-16 code units in every absolute newly planned configured-worktree destination, not just one folder component. Omitting `maxPathLength` preserves current destination bytes and does not persist or infer a platform default. When every selected destination already fits, names remain exact. Otherwise only newly planned configured paths may shorten. Arashi shortens the generated parent-relative namespace to a readable prefix plus the first eight lowercase hexadecimal characters of SHA-256 over the portable `/`-separated ordinary generated parent namespace. The longest selected child path determines the shared fitted parent; configured child-relative paths remain exact, including when only children are selected.

If the fixed workspace, worktrees directory, and selected child topology leave fewer than nine UTF-16 units for `-<eight-hex-hash>`, create fails before any mutation with `WORKTREE_PATH_LENGTH_EXCEEDED`. The Git branch stays exact. Existing registered worktree paths are metadata-authoritative and are never renamed, and standalone `.worktrees/<branch>` placement remains unchanged. This setting reserves space at the worktree root; it does not guarantee that repository-internal file paths fit.

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

Entries are direct `repos.<name>.copy` and `repos.<name>.symlink` arrays. Each entry uses the same path in each new worktree: the repository-relative path from the Git-primary child checkout. Repository construction runs `pre-create`, each `copy`, each `symlink`, then `post-create`; `--no-hooks` does not disable materialization. Missing sources are visible non-fatal skips. Arashi never overwrites a destination, every destination must remain inside the worktree, and rejected native symlinks have no copy, hard-link, or junction fallback.

Use `copy` for independent, isolated files and `symlink` only for intentionally shared state. Avoid symlinking `node_modules`; dependencies can differ between branches. Prefer package-manager content-addressed stores and per-worktree installs for dependency isolation. Materialization supports configured workspaces only; standalone mode, globs, and path remapping are unsupported. Use [lifecycle hooks](/reference/hooks/) for globs, remapping, external sources, interpolation, generated files, or conditional behavior. `aw create --dry-run` previews the ordered materialization plan before mutation, and `aw doctor` diagnoses source availability and destination safety without repair.

## Hooks

Short lifecycle commands can live in `hooks.scripts` for the workspace or `repos.<name>.hooks` for one repository. For script files, platform-specific commands, execution order, and timeout settings, see the [Lifecycle Hooks reference](/reference/hooks/).

## Related references

- [init command](/commands/init/) for workspace setup and managed path ignore scope
- [configure command](/commands/configure/)
- [create command](/commands/create/)
- [switch command](/commands/switch/)
- [Full configuration reference](https://github.com/corwinm/arashi/blob/main/docs/configuration.md)
