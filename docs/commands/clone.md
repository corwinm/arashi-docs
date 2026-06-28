---
title: clone Command
description: Clone repositories that are configured in the workspace but missing locally.
draft: false
sidebar:
  hidden: false
---

## What It's For

Recover missing local repositories without re-adding them to workspace configuration.

## What It Does

- Detects repositories already defined in `.arashi/config.json` that are missing on disk.
- Lets you choose which missing repositories to clone in interactive mode.
- Clones all missing repositories in non-interactive mode with `--all`.
- Skips repositories that are already present locally.

## Usage

```bash
arashi clone [options]
```

## Key Options

- `--all` clone all missing configured repositories without selection prompts.
- `--json` output machine-readable results for non-interactive clone runs.

## Examples

```bash
# Pick from missing repositories interactively
arashi clone

# Clone every missing configured repository
arashi clone --all

# Clone every missing repository and emit JSON
arashi clone --all --json
```

## Notes

- `clone` only works on repositories already configured in the workspace.
- If no repositories are missing, the command exits successfully with no clone action.
- If you're in a non-interactive environment, use `--all`.
- JSON mode does not prompt; combine `--json` with explicit selection flags such as `--all`.

## Related Commands

- [add](/commands/add/)
- [status](/commands/status/)
- [setup](/commands/setup/)
