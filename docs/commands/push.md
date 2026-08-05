---
title: push Command
description: Publish coordinated branches across repositories.
draft: false
sidebar:
  hidden: false
---

## What It's For

Publish the current coordinated branch before opening related PRs across the parent repo and any changed child repositories.

## What It Does

- Evaluates the current branch in the parent workspace and configured child repositories.
- Pushes repositories with publishable local branch commits.
- Skips untouched, already up-to-date, detached, or unconfigured repositories with clear reasons.
- Avoids creating remote branches for child repositories that were intentionally untouched.

## Usage

```bash
arashi push [options]
```

## Key Options

- `-o, --only <repo>` include named repositories; repeat it, use commas, or mix both forms.
- `-g, --group <group>` include requested groups; repeat it, use commas, or mix both forms.
- `--set-upstream` publish new branches and configure upstream tracking.
- `-n, --dry-run` preview planned pushes without updating remotes.
- `-j, --json` output a single machine-readable result envelope.

## Examples

```bash
# Publish eligible repositories with existing upstreams
arashi push

# Publish a new coordinated branch
arashi push --set-upstream

# Publish only the CLI repo
arashi push --only arashi --set-upstream

# Publish changed documentation repositories only
arashi push --group docs --set-upstream

# Preview before publishing
arashi push --set-upstream --dry-run

# Use automation-safe output
arashi push --set-upstream --json
```

## Notes

- `push` does not open pull requests; it only publishes branches.
- Repositories without upstream tracking are skipped unless `--set-upstream` is supplied.
- Dry-run is a local preview and does not contact or mutate remotes.
- `--group` narrows publishing to configured semantic sets; when combined with `--only`, both filters must match.
- JSON mode keeps stdout parseable as one envelope and reports skipped repositories as structured warnings.

## Agent Notes

- Use `arashi push --set-upstream` after committing implementation changes and before opening related PRs.
- Use `--group <group>` for known semantic sets and `--only <repo>` for focused child-repo PRs instead of pushing every coordinated worktree.
- Do not manufacture remote branches for clean, untouched child repositories just because the coordinated branch exists locally.

## Related Commands

`push` coordinates configured child repositories and therefore requires configured mode. From standalone mode, run ordinary `arashi init` to upgrade; see the [Standalone Repository workflow](/workflows/standalone/).

- [pull](/commands/pull/)
- [sync](/commands/sync/)
- [status](/commands/status/)
