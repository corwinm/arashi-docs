---
title: Workflows
description: Choose guidance for hooks, configuration defaults, editor or terminal workflows, and working with agents in an Arashi workspace.
draft: false
sidebar:
  hidden: false
---

Use this section after `arashi init` when you want workflow guidance instead of a command-by-command reference.

## Choose a Workflow

- [Hooks](/workflows/hooks/) for lifecycle automation around create and remove.
- [Config](/workflows/config/) for command defaults and post-init switch behavior.
- [VS Code](/workflows/vscode/) for editor-first worktree management.
- [tmux and sesh](/workflows/tmux-and-sesh/) for terminal-native switching and session workflows.
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
