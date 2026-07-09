---
title: pull Command
description: Pull the latest changes across workspace repositories.
draft: false
sidebar:
  hidden: false
---

## What It's For

Update repositories in your workspace without entering each one manually.

## What It Does

- Runs pull operations across managed repositories.
- Brings local branches up to date with remote changes.
- Reports which repositories succeeded or failed.

## Usage

```bash
arashi pull [options]
```

## Key Options

- `--only <repo>` limit pull to specific repositories (repeatable).
- `--group <group>` pull only repositories in the requested group (repeatable).
- `-v, --verbose` print full git output.
- `--json` output machine-readable pull results.

## Examples

```bash
# Pull all eligible repositories
arashi pull

# Pull selected repositories only
arashi pull --only api --only web

# Pull infrastructure repositories only
arashi pull --group infra

# Pull with detailed command output
arashi pull --verbose

# Pull selected repositories and emit JSON
arashi pull --only api --json
```

## Notes

- Repositories with no remote changes are skipped.
- `--group` targets configured semantic sets; with `--only`, it narrows the explicit repository selection by intersection.
- Pull failures or manual-update states return a non-zero exit code.
- In JSON mode, stdout contains one result document; verbose diagnostics stay out of stdout.

## Agent Notes

- Use `arashi pull` before starting a new coordinated worktree when `arashi status` shows repositories are behind.
- Prefer `--group <group>` when the user has scoped work to a known semantic set, or `--only <repo>` when the work is limited to one repository.
- Re-run `arashi status` after pulling to confirm the workspace is ready for edits.

## Related Commands

- [sync](/commands/sync/)
- [status](/commands/status/)
