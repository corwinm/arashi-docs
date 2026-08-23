---
title: init Command
description: Initialize Arashi in the current workspace.
draft: false
sidebar:
  hidden: false
---

## What It's For

Set up a workspace so Arashi can track repositories and worktrees.

## What It Does

- Creates Arashi configuration in the current project.
- Offers to bootstrap a Git repository when you run it from a non-repository directory in an interactive terminal.
- Prepares workspace metadata used by other commands.
- Makes the workspace ready for repository registration.
- Reconciles safe configured repository and worktree paths with Git before creating managed directories.

## Usage

```bash
aw init [options]
```

## Key Options

- `--repos-dir <path>` set a custom repos directory (default `./repos`).
- `--worktrees-dir <path>` set a custom worktree base directory (when omitted, bare repositories use `..` and non-bare repositories use `.arashi/worktrees`).
- `--ignore-scope <local|tracked|none>` choose repository-local rules, tracked rules, or no ignore-file writes.
- `-f, --force` overwrite an existing Arashi config (with backup).
- `--no-discover` skip automatic repository discovery.
- `-n, --dry-run` preview changes without writing files.
- `-v, --verbose` print detailed initialization steps.
- `-j, --json` output machine-readable initialization results.
- `--zero-config` bootstrap the root `.worktrees/` convention for ad hoc use in a non-bare Git project that has not adopted Arashi configuration.

## Examples

```bash
# Standard initialization
aw init

# Share missing managed rules in the workspace-root .gitignore
aw init --ignore-scope tracked

# Manage ignore rules manually and receive warnings for unignored paths
aw init --ignore-scope none

# Reset an existing clone to the repository-local default without --force
aw init --ignore-scope local

# Run from a parent directory, then enter '.' at the prompt to initialize the current directory
aw init

# Run from a parent directory, then enter 'my-arashi-repo' at the prompt to create a child repo
aw init

# Use a custom repositories directory
aw init --repos-dir ../workspace-repos

# Use a custom worktree base directory
aw init --worktrees-dir ../workspace-worktrees

# Reinitialize safely and preview file changes
aw init --force --dry-run

# Initialize and emit JSON for automation
aw init --json

# Use Arashi ad hoc in a project without persisted Arashi configuration
aw init --zero-config

# Preview the standalone bootstrap as structured output
aw init --zero-config --dry-run --json
```

## Notes

- Run this command inside an existing Git repository root, or from a parent directory in an interactive terminal when you want Arashi to create the repository for you.
- In bootstrap mode, the repository target prompt accepts only `.` or a direct child directory name such as `my-arashi-repo`.
- If `init` is run outside a Git repository without an interactive terminal, it exits with guidance instead of prompting.
- JSON mode does not prompt; provide explicit options when running initialization from automation.
- `init` creates `.arashi/config.json` and inert lifecycle examples under `.arashi/hooks/`. Activate one example at a time: on POSIX, `install -m 755 <chosen>.sh.example <chosen>.sh` creates the active executable; on native Windows, copy one matching `.ps1.example`, `.cmd.example`, or `.bat.example` to the same filename without `.example`.
- POSIX setup guidance uses `.arashi/setup.sh.example`; activate it with `install -m 755 .arashi/setup.sh.example .arashi/setup.sh`. Setup uses its documented cwd rather than lifecycle variables. No native Windows setup example is introduced because setup discovery does not support it. See the [Hooks workflow](/workflows/hooks/).
- Non-bare repositories default to `.arashi/worktrees`; bare repositories default to `..`.
- With the bare default, Arashi namespaces linked worktrees beside the source: `/projects/example.git` and branch `feature/auth` produce `/projects/example/feature/auth` rather than checked-out files inside the bare Git directory.
- An explicit `--worktrees-dir` takes precedence in either repository type. New and forced initialization normalizes the selected value, which is persisted as `worktreesDir` in `.arashi/config.json`; later commands use that configured value instead of re-inferring the repository type.
- Existing configurations are not migrated automatically. If an older config omits `worktreesDir`, `.arashi/worktrees` remains its compatibility fallback; preference-only init reports that configured value or fallback without rewriting the config.
- `local` is the default ignore scope. Missing safe `reposDir` and `worktreesDir` rules are written to the common repository's exclude file resolved through Git, normally `.git/info/exclude`; tracked `.gitignore` is unchanged.
- `tracked` writes missing safe rules to the workspace-root `.gitignore`. `none` does not write tracked, local, or global ignore files and warns when a safe path remains unignored.
- Explicit `tracked` and `none` choices are stored as `arashi.ignoreScope` in clone-local Git configuration, not shared `.arashi/config.json`. Selecting `local` removes the stored non-default preference.
- On an existing valid workspace, supplying only `--ignore-scope` updates the preference and reconciles current paths without requiring `--force` or recreating config, hooks, or repositories. A forced init with no explicit scope preserves a valid stored preference.
- Bare configured init treats the parent default `..` as external and unsafe, and treats administrative subdirectories beneath the bare Git directory, such as `reposDir`, as non-applicable to working-tree ignore rules. It does not run `git check-ignore` or write ignore files for these paths, even when a linked worktree exists.
- For bare configured init, `local` reports local scope and the unsafe or non-applicable classifications without changing the common exclude file. `tracked` may preserve the clone-local scope preference but does not create or edit `.gitignore` or require a linked or temporary worktree. `none` reports classifications without ignore-file changes. The same policy applies to linked, committed-without-linked-worktree, and unborn bare repositories.
- For non-bare configured init, Arashi asks Git for each path's effective ignore rule before writing. Existing tracked, repository-local, nested, or global rules are preserved without duplication regardless of the selected scope.
- Arashi never creates or modifies `core.excludesFile` or other global Git configuration.
- Only normalized repository-relative subdirectories are safe to write. Repository root (`.`/`./`), absolute paths, and parent traversal (`../` variants) are reported and skipped.
- Reconciliation updates only Arashi-owned ignore blocks and removes stale owned entries in the active writable scope. User-authored rules remain untouched; `none` freezes existing ignore content.
- `--dry-run` includes planned scope, preference, and ignore changes without modifying them. JSON results expose effective sources, planned or applied rules, warnings, unsafe skips, and final changed/restored state under structured managed ignore data.
- Prefer ordinary `aw init` whenever the project can adopt Arashi, including single-repository projects that benefit from repository/workspace hooks, persisted defaults, or custom paths.
- `--zero-config` creates the main-root `.worktrees/` directory and adds the literal `.worktrees/` rule to the Git-resolved repository-local exclude only when no effective tracked, local, or global rule already covers the bootstrap probe. It is an ad hoc path for otherwise-unconfigured projects and never writes tracked or global ignore state, `.arashi/`, hooks, or config.
- Zero-config mode accepts `--dry-run`, `--verbose`, and `--json`; it rejects configured-init options such as `--repos-dir`, `--worktrees-dir`, `--ignore-scope`, `--force`, and `--no-discover` before mutation.
- Use the [Standalone Repository workflow](/workflows/standalone/) for lifecycle scope, exact-destination ignore checks, and upgrading through ordinary `aw init`.

## Related Commands

- [add](/commands/add/)
- [create](/commands/create/)
- [Config workflow](/workflows/config/)
