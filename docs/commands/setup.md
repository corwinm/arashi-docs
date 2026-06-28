---
title: setup Command
description: Run setup scripts across repositories in one workspace operation.
draft: false
sidebar:
  hidden: false
---

## What It's For

Bootstrap development environments consistently across repositories.

## What It Does

- Runs repository setup scripts in workspace order.
- Supports targeting selected repositories with `--only`.
- Reports skipped repositories and setup failures in a final summary.

## Usage

```bash
arashi setup [options]
```

## Key Options

- `--only <repo>` run setup for specific repositories (repeatable).
- `-v, --verbose` print full setup script output.
- `--json` output machine-readable setup results.

## Examples

```bash
# Run setup across all repositories
arashi setup

# Run setup for selected repositories
arashi setup --only api --only web

# Show full script output while setup runs
arashi setup --verbose

# Run setup for one repo and emit JSON
arashi setup --only api --json
```

## Notes

- Setup targets without scripts are reported as skipped.
- Failed or timed-out setup runs return a non-zero exit code.
- In JSON mode, stdout contains one result document; setup script diagnostics are captured or kept off stdout.

## Related Commands

- [add](/commands/add/)
- [sync](/commands/sync/)
