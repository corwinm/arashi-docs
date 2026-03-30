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

The installer defaults to `~/.arashi/bin` and updates your shell profile so `arashi` is available on `PATH` in new shells.

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

Choose the directory you want Arashi to initialize before you run `arashi init`:

- Existing repository workflow: `cd` to the repository root you already want to manage, then run `arashi init` there.
- New repository workflow: `cd` to a parent directory where you want the repository created, run `arashi init`, and enter either `.` for the current directory or a child name such as `my-arashi-repo` when prompted.

Example: initialize the current directory as a new repository.

```bash
mkdir my-arashi-workspace
cd my-arashi-workspace
arashi init
# prompt: Repository target ('.' for current directory or a child directory name) -> .
```

Example: create a child repository from a parent directory.

```bash
mkdir scratch
cd scratch
arashi init
# prompt: Repository target ('.' for current directory or a child directory name) -> my-arashi-repo
cd my-arashi-repo
```

Once `arashi init` completes, continue with the core workflow:

```bash
arashi add git@github.com:your-org/frontend.git
arashi create feature-docs-bootstrap
arashi switch feature-docs-bootstrap
arashi status
```

By default, new managed worktrees are created under `.arashi/worktrees`.
Set command defaults in `.arashi/config.json` (`defaults.create`, `defaults.switch`) to define preferred switch/launch behavior.

## Next Steps

- Continue to [Commands](/commands/) for command-by-command behavior.
- Continue to [Contributing](/contributing/) if you are adding or editing docs.
