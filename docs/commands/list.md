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
arashi list [options]
```

## Key Options

- `-v, --verbose` include detailed sub-repository information.
- `-j, --json` output JSON.
- `-t, --table` print a table with headers.
- `--max-depth <depth>` set sub-repo discovery depth (default `3`).

## Examples

```bash
# Pipe-friendly path list
arashi list

# Table output
arashi list --table

# Interactive navigation
cd "$(arashi list | fzf)"
```

## Notes

- Default output is intentionally simple for shell composition.
- Use `--json` when another tool needs structured output.

## Related Commands

- [status](/commands/status/)
- [remove](/commands/remove/)
