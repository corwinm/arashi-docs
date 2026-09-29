---
title: config Command
description: Inspect effective personal and workspace settings with provenance.
draft: false
sidebar:
  hidden: false
---

## What It's For

Show the settings Arashi will use without editing user or workspace files.

## Usage

```bash
aw config effective
aw config effective --json
```

The output identifies configured or standalone mode, the workspace and user configuration files used, the resolved worktree base, and every supported personal setting with its source: `cli`, `workspace`, `user`, or `built-in`.

Use inspection-only overrides to verify precedence:

```bash
aw config effective --no-create-switch --create-launch none
aw config effective --switch-mode cd --worktrees-dir ../trees --json
```

These options do not write configuration. Actual command options remain highest precedence during create and switch execution.

## Diagnostics

A malformed or invalid `~/.arashi/config.json` fails with the file path and affected field. A malformed workspace config still fails rather than degrading to standalone mode. Missing user configuration is valid and preserves built-in behavior.

See the [Configuration reference](/reference/configuration/#user-configuration) for supported fields, path qualification, and schema metadata.
