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
aw setup [options]
```

## Key Options

- `-o, --only <repo>` run setup for repositories; repeat it, use commas, or mix both forms.
- `-g, --group <group>` run setup for groups; repeat it, use commas, or mix both forms.
- `-v, --verbose` print full setup script output.
- `-j, --json` output machine-readable setup results.

## Examples

```bash
# Run setup across all repositories
aw setup

# Run setup for selected repositories
aw setup --only api --only web

# Run setup for extension repositories
aw setup --group extensions

# Show full script output while setup runs
aw setup --verbose

# Run setup for one repo and emit JSON
aw setup --only api --json
```

## Notes

- Setup targets without scripts are reported as skipped.
- `--group` targets configured semantic sets; with `--only`, it narrows the explicit repository selection by intersection.
- Failed or timed-out setup runs return a non-zero exit code.
- In JSON mode, stdout contains one result document; setup script diagnostics are captured or kept off stdout.

## Related Commands

`setup` depends on configured repositories and setup scripts, so it requires configured mode. From standalone mode, run ordinary `aw init` to upgrade; see the [One Repository](/getting-started/standalone/).

A setup script is not a lifecycle hook and does not receive the create/remove terminal-input contract. See the [Lifecycle Hooks reference](/reference/hooks/) when automation belongs at a lifecycle boundary instead.

- [add](/commands/add/)
- [sync](/commands/sync/)
