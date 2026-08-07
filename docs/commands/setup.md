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

- `-o, --only <repo>` run setup for repositories; repeat it, use commas, or mix both forms.
- `-g, --group <group>` run setup for groups; repeat it, use commas, or mix both forms.
- `-v, --verbose` print full setup script output.
- `-j, --json` output machine-readable setup results.

## Examples

```bash
# Run setup across all repositories
arashi setup

# Run setup for selected repositories
arashi setup --only api --only web

# Run setup for extension repositories
arashi setup --group extensions

# Show full script output while setup runs
arashi setup --verbose

# Run setup for one repo and emit JSON
arashi setup --only api --json
```

## Notes

- Setup targets without scripts are reported as skipped.
- `--group` targets configured semantic sets; with `--only`, it narrows the explicit repository selection by intersection.
- Failed or timed-out setup runs return a non-zero exit code.
- In JSON mode, stdout contains one result document; setup script diagnostics are captured or kept off stdout.

## Related Commands

`setup` depends on configured repositories and setup scripts, so it requires configured mode. From standalone mode, run ordinary `arashi init` to upgrade; see the [Standalone Repository workflow](/workflows/standalone/).

A setup script is not a lifecycle hook and does not receive the create/remove terminal-input contract. See the [Hooks workflow](/workflows/hooks/) when automation belongs at a lifecycle boundary instead.

- [add](/commands/add/)
- [sync](/commands/sync/)
