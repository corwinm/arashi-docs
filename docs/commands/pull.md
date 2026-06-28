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
- `-v, --verbose` print full git output.
- `--json` output machine-readable pull results.

## Examples

```bash
# Pull all eligible repositories
arashi pull

# Pull selected repositories only
arashi pull --only api --only web

# Pull with detailed command output
arashi pull --verbose

# Pull selected repositories and emit JSON
arashi pull --only api --json
```

## Notes

- Repositories with no remote changes are skipped.
- Pull failures or manual-update states return a non-zero exit code.
- In JSON mode, stdout contains one result document; verbose diagnostics stay out of stdout.

## Related Commands

- [sync](/commands/sync/)
- [status](/commands/status/)
