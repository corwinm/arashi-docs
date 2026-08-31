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
- Uses the refreshed configured base as the publishability baseline only when the current branch has no upstream.

## Usage

```bash
aw push [options]
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
aw push

# Publish a new coordinated branch
aw push --set-upstream

# Publish only the CLI repo
aw push --only arashi --set-upstream

# Publish changed documentation repositories only
aw push --group docs --set-upstream

# Preview before publishing
aw push --set-upstream --dry-run

# Use automation-safe output
aw push --set-upstream --json
```

## Notes

- `push` does not open pull requests; it only publishes branches.
- Repositories without upstream tracking are skipped unless `--set-upstream` is supplied.
- Existing upstream branches continue to compare with and push to their upstream. A no-upstream branch uses root or repository-specific `baseBranch` when configured, but the destination remains the current branch on the selected remote. An unavailable configured base fails planning rather than silently falling back to the remote default.
- Dry-run never updates remote branches, but it may fetch a configured base into a local remote-tracking ref to produce an accurate plan.
- `--group` narrows publishing to configured semantic sets; when combined with `--only`, both filters must match.
- JSON mode keeps stdout parseable as one envelope and reports skipped repositories as structured warnings.

## Agent Notes

- Use `aw push --set-upstream` after committing implementation changes and before opening related PRs.
- Use `--group <group>` for known semantic sets and `--only <repo>` for focused child-repo PRs instead of pushing every coordinated worktree.
- Do not manufacture remote branches for clean, untouched child repositories just because the coordinated branch exists locally.

## Related Commands

`push` coordinates configured child repositories and therefore requires configured mode. From standalone mode, run ordinary `aw init` to upgrade; see the [One Repository](/getting-started/standalone/).

- [pull](/commands/pull/)
- [sync](/commands/sync/)
- [status](/commands/status/)
