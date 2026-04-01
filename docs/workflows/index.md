---
title: Workflows
description: Choose guidance for hooks, configuration defaults, integrations, and working with agents in an Arashi workspace.
draft: false
sidebar:
  hidden: false
---

Use this section after `arashi init` when you want workflow guidance instead of a command-by-command reference.

## Choose a Workflow

- [Hooks and Config](/workflows/hooks-and-config/) for lifecycle hooks, command defaults, and post-init workspace setup.
- [Integrations](/workflows/integrations/) for VSCode, tmux, and `tmux` plus `sesh` launch patterns.
- [Agents](/workflows/agents-and-specs/) for implementation boundaries and meta-repo guidance.

## Recommended Path After `arashi init`

1. Configure `defaults.create` and `defaults.switch` so worktree creation and switching match your preferred launch behavior.
2. Add lifecycle hooks if you need setup or cleanup automation around `create` and `remove`.
3. Choose how you want to open worktrees: VSCode, terminal-native tmux flows, or `sesh`-driven session switching.
4. If you work with agents, keep code changes in the affected project repo and shared context in the meta-repo.

## Related Commands

- [create](/commands/create/)
- [remove](/commands/remove/)
- [switch](/commands/switch/)
- [shell](/commands/shell/)
- [setup](/commands/setup/)
