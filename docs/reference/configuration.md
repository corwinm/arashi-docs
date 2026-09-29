---
title: Configuration
description: Configure workspace layout, repositories, worktree behavior, and command defaults.
draft: false
sidebar:
  hidden: false
  order: 2
---

Arashi has two separate configuration files. The in-repo config is primary; the user defaults file is an optional extra.

## In-repo configuration (primary)

File: `.arashi/config.json` inside your workspace.

`aw init` creates this project's configuration. Its explicit settings take priority over user defaults. Commit it when the team should share the configuration.

## User defaults (optional)

File: `~/.arashi/config.json` in your home directory, separate from the repository.

Create this file only if you want personal preferences across repositories. It supplies defaults for fields the in-repo config leaves unset. Arashi does not require it or copy it into a repository. Standalone repositories can use these optional defaults without adopting in-repo configuration.

## User configuration

If you want personal fallback preferences, create `~/.arashi/config.json` in your home directory with the dedicated user schema and version metadata. This example is for the separate user defaults file:

```json
{
  "$schema": "https://unpkg.com/arashi/schema/user-config.schema.json",
  "version": "1.0.0",
  "defaults": {
    "create": {
      "switch": true,
      "launch": "none"
    },
    "switch": {
      "mode": "cd"
    }
  },
  "worktreesDir": ".worktrees",
  "worktreeNaming": {
    "style": "repo-branch",
    "branchSlashes": "flatten"
  }
}
```

The user file is intentionally partial. It accepts only `defaults.create`, `defaults.switch`, `defaults.editors`, `worktreesDir`, and `worktreeNaming`; repository definitions, groups, base branches, materialization, and hooks remain workspace-owned. `version` is required and currently must be `1.0.0`; `$schema` is optional but recommended.

Resolution is field-by-field: **explicit command option > explicit in-repo setting > optional user default > built-in default**. The in-repo config is authoritative for each field it sets. For example, in-repo `defaults.create.switch: false` wins over user `true`, while an unrelated user naming preference still fills an unset in-repo field. Nested objects do not replace one another wholesale. Explicit `false` and `"none"` values override user defaults. Use `aw config effective` or `aw config effective --json` to inspect every supported value, its `cli`, `workspace`, `user`, or `built-in` source, and the files used. The inspection command also accepts create, switch, and worktree-directory options to preview CLI precedence without changing files.

Relative user `worktreesDir` values resolve from the primary repository/workspace root, so main and linked worktree invocations agree. An absolute user directory is treated as a shared root; Arashi appends `<repository-name>-<8-character-path-hash>` before the generated worktree name to isolate unrelated repositories with the same name. Naming changes affect only newly created worktrees. Existing worktrees remain discoverable through Git and are never relocated.

A missing user file preserves existing behavior. Malformed JSON, unsupported fields or versions, and invalid values fail with the user file path and field diagnostics. Arashi does not copy user settings into `.arashi/config.json`; `aw configure` and ordinary initialization continue to edit workspace state only.

## Edit configuration

Run `aw configure` to inspect and edit common settings in the in-repo `<workspace>/.arashi/config.json` interactively:

```bash
aw configure
```

For settings that are not available in the interactive editor, edit `.arashi/config.json` directly. Run `aw doctor` afterward to validate the workspace and catch configuration problems. The examples below show only the fields relevant to each section and can be combined in one config file.

## Workspace layout

The smallest configured workspace names the directories where Arashi keeps repositories and worktrees. Include `$schema` for JSON validation and editor autocomplete:

```json
{
  "$schema": "https://unpkg.com/arashi/schema/config.schema.json",
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

Set shared workspace defaults when the team wants the same behavior. Put personal choices in the user file described above:

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
- `maxPathLength`: optional positive integer from 1 through 2,147,483,647.

These fields affect newly planned configured or standalone worktree destinations; they do not rename existing worktrees or change Git branch names. See [Worktree locations](/commands/create/#worktree-locations) for the topology mapping, path-budget behavior, and create-time failures.

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

`repos.<name>.copy` and `repos.<name>.symlink` are direct arrays. Each entry uses the same path in each new worktree—the repository-relative path from the Git-primary child checkout. Use `copy` for independent, isolated files and `symlink` only for intentionally shared state. Avoid symlinking `node_modules`; dependencies can differ between branches. Prefer package-manager content-addressed stores and per-worktree installs for dependency isolation.

Materialization is available in configured workspaces only; standalone mode, globs, and path remapping are unsupported. Use [lifecycle hooks](/reference/hooks/) for globs, remapping, external sources, interpolation, generated files, or conditional behavior. `aw doctor` provides non-mutating inspection of materialization sources and destinations without repair.

See [Configured file materialization](/commands/create/#configured-file-materialization) for ordering, validation, dry-run, and failure behavior.

## Hooks

Short lifecycle commands can live in `hooks.scripts` for the workspace or `repos.<name>.hooks` for one repository. For script files, platform-specific commands, execution order, and timeout settings, see the [Lifecycle Hooks reference](/reference/hooks/).

For configured repository remove hooks, inline `repos.<repo>.hooks.<lifecycle>`, the workspace-owned `<configurationRoot>/.arashi/hooks/<lifecycle>.<repo><ext>`, and compatible child-local `<activeRepo>/.arashi/hooks/<lifecycle><ext>` are three aliases for one repository slot. The qualified active files are `<configurationRoot>/.arashi/hooks/pre-remove.<repo><ext>` and `<configurationRoot>/.arashi/hooks/post-remove.<repo><ext>`. If multiple aliases overlap and claim the slot, ambiguity fails before hook or remove mutation; aliases never compose and none has precedence.

`aw doctor` and remove dry-run use the same runtime candidate resolver and report the selected source or ambiguity without mutation or hook execution.

## Related references

- [init command](/commands/init/) for workspace setup and managed path ignore scope
- [configure command](/commands/configure/)
- [create command](/commands/create/)
- [switch command](/commands/switch/)
- [Lifecycle Hooks reference](/reference/hooks/)
