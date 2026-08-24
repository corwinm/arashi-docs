---
title: shell uninstall Command
description: Remove exact managed shell integration without uninstalling Arashi.
draft: false
sidebar:
  hidden: false
---

Use `aw shell uninstall` to remove shell integration while keeping the Arashi installation and project data.

## Usage

```bash
aw shell uninstall [options]
```

## Options

- `-n, --dry-run` inspect the shell-file plan without prompting or writing.
- `-y, --yes` consent to the preflighted plan without an interactive prompt.

Inspect first with `aw shell uninstall --dry-run`. Interactive removal defaults to no, and non-interactive removal requires `aw shell uninstall --yes`.

## Behavior

The command uses the same deterministic startup-file policy as `aw shell install`. It removes exactly one complete managed shell block and preserves every byte outside that block. Missing managed markers are a no-op. Malformed or ambiguous markers—including orphaned, reversed, nested, overlapping, or duplicate markers—cause refusal before any write.

Shell-only removal preserves executable files, PATH, manifests, workspaces, repositories, worktrees, project files, configuration, `.arashi.yaml`, and Git metadata. It does not scan arbitrary files or remove manually added shell code.

Shell uninstall does not support `--json` or `--force`. For full product removal, see [`aw uninstall`](/commands/uninstall/).
