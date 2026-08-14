---
title: clone Command
description: Clone repositories that are configured in the workspace but missing locally.
draft: false
sidebar:
  hidden: false
---

## What It's For

Recover missing local repositories without re-adding them to workspace configuration, or complete a partial coordinated worktree after creating only some child repositories.

## What It Does

- Detects repositories already defined in `.arashi/config.json` that are missing on disk.
- Lets you choose which missing repositories to clone in interactive mode.
- Clones all missing repositories in non-interactive mode with `--all`.
- Inside a coordinated worktree, adds missing child repositories as worktrees on the current branch when a local source repository is available.
- Falls back to normal remote clone behavior outside coordinated worktrees or when no source repository is available.
- Reconciles managed ignore rules before materializing a configured repository path.
- Skips repositories that are already present locally.

## Usage

```bash
arashi clone [options]
```

## Key Options

- `--all` clone all missing configured repositories without selection prompts.
- `-j, --json` output machine-readable results for non-interactive clone runs.

## Examples

```bash
# Pick from missing repositories interactively
arashi clone

# Clone every missing configured repository
arashi clone --all

# Complete a partial coordinated worktree from inside it
cd .arashi/worktrees/my-meta-feature-auth-refresh
arashi clone

# Clone every missing repository and emit JSON
arashi clone --all --json
```

## Notes

- `clone` only works on repositories already configured in the workspace.
- If no repositories are missing, the command exits successfully with no clone action.
- From inside a coordinated worktree, `clone` uses the current branch for child worktrees so completed repositories stay aligned with the parent worktree.
- If the matching source repository cannot be found locally, `clone` uses the configured remote URL instead.
- If you're in a non-interactive environment, use `--all`.
- JSON mode does not prompt; combine `--json` with explicit selection flags such as `--all`.
- Before cloning, Arashi honors any effective tracked, repository-local, or global rule. If a safe managed path is still unignored, it uses the stored clone-local scope or the repository-local default; scope `none` warns without writing.
- Repeated reconciliation is idempotent. If no clone is retained after failure, ignore and preference changes are restored; when some selected repositories succeed, required reconciliation is retained and reported with the partial result.
- A fresh clone has no shared ignore preference because `arashi.ignoreScope` is clone-local. It therefore defaults to the common repository's local exclude file and does not unexpectedly change tracked `.gitignore`.
- When a configured remote already uses SSH, `clone` keeps every configured SSH URL byte-for-byte. An SSH preference can still convert a conventional HTTPS remote to SSH, but Arashi never converts an SSH URL to HTTPS because an alias has no trustworthy automatic HTTPS mapping.

## Troubleshooting SSH Remotes

Git and OpenSSH resolve the host and authenticate. Arashi does not read, resolve, or edit `~/.ssh/config`, identity files, or keys, and it does not run a separate SSH connectivity probe. If an alias cannot be resolved or authenticated, review the underlying Git error and test the same remote with Git in your local environment.

In a multi-repository clone, a failed alias is reported for that repository and Arashi continues with the remaining selected repositories. Successful clones are retained under the existing partial-success contract. For an `add` failure, Arashi uses the existing rollback boundary described in the [add command reference](/commands/add/).

## Agent Notes

- Use `arashi status --json` or `arashi status --verbose` to discover missing configured repositories before completing a partial workspace.
- Prefer `arashi clone --all --json` when automation should complete every missing child repository without prompts.
- Inspect managed ignore warnings and final changed/restored state in JSON results instead of editing Git ignore files directly.

## Related Commands

`clone` requires configured mode and persisted child repositories. From standalone mode, run ordinary `arashi init` to upgrade; see the [Standalone Repository workflow](/workflows/standalone/).

- [add](/commands/add/)
- [status](/commands/status/)
- [setup](/commands/setup/)
- [Config workflow](/workflows/config/)
