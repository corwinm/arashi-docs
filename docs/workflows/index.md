---
title: Workflows
description: Choose guidance for hooks, configuration defaults, editor or terminal workflows, and working with agents in an Arashi workspace.
draft: false
sidebar:
  hidden: false
  order: 1
---

Use this section when you want outcome-focused guidance instead of a command-by-command reference. Arashi's primary workflow coordinates worktrees across the repositories in a configured meta-repo.

## Choose a Workflow

- [Config](/workflows/config/) for managed path ignore scope, command defaults, and post-init switch behavior.
- [Hooks](/workflows/hooks/) for lifecycle automation around create and remove.
- [Agents](/workflows/agents-and-specs/) for implementation boundaries and meta-repo guidance.
- [VS Code](/workflows/vscode/) for editor-first worktree management.
- [tmux and sesh](/workflows/tmux-and-sesh/) for terminal-native switching and session workflows.
- [cmux](/workflows/cmux/) for automatic workspace creation and focus from cmux-managed terminals.
- [JSON Automation](/workflows/json-automation/) for machine-readable output, envelope examples, and command support.
- [Standalone Repository](/workflows/standalone/) for ad hoc use in a project that has not adopted Arashi configuration.

## Recommended Path After `arashi init`

1. Confirm the repository-local managed ignore default or deliberately select `tracked` or `none` for this clone.
2. Configure `defaults.create` and `defaults.switch` so worktree creation and switching match your preferred launch behavior.
3. Add lifecycle hooks if you need setup or cleanup automation around `create` and `remove`.
4. Choose how you want to open worktrees: VS Code, automatic cmux workspaces, terminal-native tmux flows, or `sesh`-driven session switching.
5. If you work with agents, keep code changes in the affected project repo and shared context in the meta-repo.

## Related Commands

- [create](/commands/create/)
- [remove](/commands/remove/)
- [switch](/commands/switch/)
- [shell](/commands/shell/)
- [setup](/commands/setup/)
