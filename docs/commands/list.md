---
title: list Command
description: Show known worktree paths for quick navigation.
draft: false
sidebar:
  hidden: false
---

## What It's For

Find and jump to worktrees quickly.

## What It Does

- Prints known worktree paths from the workspace.
- Supports shell workflows like `fzf` selection.
- Helps users navigate without manually searching directory trees.

## Usage

```bash
aw list [options]
```

## Key Options

- `-v, --verbose` include detailed sub-repository information.
- `-j, --json` output JSON.
- `-t, --table` print a table with headers.
- `--max-depth <depth>` set sub-repo discovery depth (default `3`).

## Examples

```bash
# Pipe-friendly path list
aw list

# Table output
aw list --table

# Interactive navigation
cd "$(aw list | fzf)"

# Emit structured worktree data
aw list --json
```

## Notes

- Default output is intentionally simple for shell composition.
- Use `--json` when another tool needs structured output.
- Standalone mode never traverses sub-repositories. `--max-depth` is not supported there, and `--verbose` reports detailed Git metadata for the standalone repository's worktrees only.

## Related Commands

`list` supports standalone repositories from the main or a linked worktree. See the [Use Arashi in One Repository](/getting-started/standalone/) for discovery and lifecycle scope.

- [status](/commands/status/)
- [remove](/commands/remove/)
