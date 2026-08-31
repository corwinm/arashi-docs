---
title: Workflows
description: Guides for carrying changes through Arashi and fitting worktrees into your development environment.
draft: false
sidebar:
  hidden: false
  order: 1
---

Use this section when you want to accomplish a development task rather than look up one command or configuration field.

## Manage a change

- [Start, Resume, and Finish a Change](/workflows/change-lifecycle/) follows the complete day-to-day lifecycle from worktree creation through handoff and cleanup.
- [Coordinate a Change Across Repositories](/workflows/coordinate-repositories/) explains repository selection, partial coordinated worktrees, validation, and separate Git ownership.
- [Automate Worktree Setup and Cleanup](/workflows/setup-and-cleanup/) helps you prepare each new worktree and run trusted lifecycle cleanup.

## Work with tools and automation

- [Work with Coding Agents](/workflows/agents-and-specs/) keeps implementation, shared context, validation, and handoffs in the right repositories.
- [Use Arashi from Scripts and CI](/workflows/automation/) covers JSON envelopes, explicit selection, non-interactive execution, and stable error handling.

## Integrate your development environment

Start with [Environment Integrations](/workflows/environment-integrations/) to choose how Arashi should open and reuse worktrees.

- [VS Code, Cursor, and Kiro](/workflows/vscode/)
- [tmux and sesh](/workflows/tmux-and-sesh/)
- [Herdr](/workflows/herdr/)
- [cmux](/workflows/cmux/)
- [Kitty](/workflows/kitty/)

## Look up exact behavior

Use [Reference](/reference/) for configuration, lifecycle-hook contracts, and launch precedence. Use [Commands](/commands/) for command options, output, errors, and command-specific JSON behavior.
