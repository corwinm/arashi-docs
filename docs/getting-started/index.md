---
title: Getting Started
description: Install Arashi, run core commands, and navigate to contributor guidance.
draft: false
sidebar:
  hidden: false
---

Use this section when you are new to Arashi and need a quick setup and first workflow.

## Install

Choose either install method below.

### Prerequisites

- `git` available in your shell
- `bash` and `curl` for the curl installer path
- `node` and `npm` for the npm path

### Method 1: curl installer

```bash
curl -fsSL https://arashi.haphazard.dev/install | bash
```

Pin a specific version when needed:

```bash
curl -fsSL https://arashi.haphazard.dev/install | ARASHI_VERSION=1.4.0 bash
```

Verify install:

```bash
arashi --version
```

The installer defaults to `~/.arashi/bin`, updates your shell profile so `arashi` is available on `PATH` in new shells, and in interactive installs can offer shell integration for `arashi switch --cd`.

For unattended installs, set `ARASHI_SHELL_INTEGRATION=yes` to enable that automatically or `ARASHI_SHELL_INTEGRATION=no` to skip it.

If this path fails, use npm (`npm install -g arashi`) or the manual release flow in [`repos/arashi/docs/INSTALLATION.md`](https://github.com/corwinm/arashi/blob/main/docs/INSTALLATION.md).

### Method 2: npm global install

```bash
npm install -g arashi
```

Verify install:

```bash
arashi --version
```

If npm is unavailable or fails in your environment, use the curl installer command above or the manual release flow in [`repos/arashi/docs/INSTALLATION.md`](https://github.com/corwinm/arashi/blob/main/docs/INSTALLATION.md).

### Troubleshooting and fallback

- `command not found`: install missing prerequisite (`curl`, `bash`, `npm`, or `node`) and rerun.
- Permission errors writing to global paths: rerun curl with `ARASHI_INSTALL_DIR="$HOME/.local/bin"` or use a user-level npm prefix.
- Network/download failures: retry once, then switch to the other install method.
- Checksum mismatch on curl path: stop and use npm/manual fallback, then report the failure.

## First Workflow

Start with the path that matches how you are adopting Arashi.

### 1. Create a new meta-repo

Use this flow when you are starting fresh and want Arashi to initialize the workspace root.

```bash
mkdir my-meta-repo
cd my-meta-repo
arashi init
```

When prompted for the repository target, enter `.` to initialize the current directory.

### 2. Add Arashi to an existing meta-repo

Use this flow when you already have a repository that should become your Arashi workspace.

```bash
cd path/to/existing-meta-repo
arashi init
```

Run `arashi init` from the repository root you want Arashi to manage.

Once `arashi init` completes, continue with the core workflow:

```bash
arashi add git@github.com:your-org/frontend.git
arashi create feature-docs-bootstrap
arashi switch feature-docs-bootstrap
arashi status
```

By default, new managed worktrees are created under `.arashi/worktrees`.
Set command defaults in `.arashi/config.json` (`defaults.create`, `defaults.switch`) to define preferred switch and launch behavior, and use `arashi shell install` if you want `arashi switch` to support parent-shell `cd` behavior.

If you install Arashi with the official curl installer, it can offer shell integration during install so `arashi switch --cd` works without an extra setup step.

When the workspace is initialized, choose the workflow guide that matches what you need next:

- [Hooks](/workflows/hooks/) for lifecycle automation after create and remove.
- [Config](/workflows/config/) for command defaults and shell-aware switching behavior.
- [VS Code](/workflows/vscode/) for editor-first worktree management.
- [tmux and sesh](/workflows/tmux-and-sesh/) for terminal-native switching and session flows.
- [Agents](/workflows/agents-and-specs/) for implementation boundaries and meta-repo guidance.

## Next Steps

- Continue to [Commands](/commands/) for command-by-command behavior.
- Continue to [Workflows](/workflows/) if you want setup guidance by workflow instead of by command.
- Continue to [Contributing](/contributing/) if you are adding or editing docs.
