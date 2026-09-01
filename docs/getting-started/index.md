---
title: Quickstart
description: Install Arashi and create your first coordinated worktrees.
draft: false
sidebar:
  hidden: false
  order: 1
---

Use this guide for the shortest path from installation to a working multi-repository Arashi workspace.

## Install

Install Arashi with the supported installer for your platform:

```bash
curl -fsSL https://arashi.haphazard.dev/install | bash
```

```powershell
powershell -c "irm https://arashi.haphazard.dev/install.ps1 | iex"
```

Open a new terminal if the installer changed your `PATH`, then verify the CLI:

```bash
aw --version
```

See [Install Arashi](/getting-started/installation/) for npm installation, pinned versions, platform details, and troubleshooting.

## Create a workspace

Initialize the repository that will coordinate your projects, then add each child repository:

```bash
mkdir my-workspace
cd my-workspace
aw init
aw add git@github.com:your-org/frontend.git
aw add git@github.com:your-org/backend.git
```

When `aw init` asks for the repository target, enter `.` so the current directory becomes the workspace root.

Commit `.arashi/config.json` when the workspace configuration should be shared with your team. See [Set Up a Workspace](/getting-started/workspace/) for layout, base branches, and managed-ignore choices.

## Start the first change

Create aligned worktrees, open the change, and inspect its state:

```bash
aw create feature-auth
aw switch feature-auth
aw status
```

Continue with [Work on a Change](/workflows/change-lifecycle/) for the complete day-to-day lifecycle.

## Other paths

- Use [Arashi in One Repository](/getting-started/standalone/) when a project has not adopted workspace configuration.
- Open [Integrations](/workflows/environment-integrations/) to connect Arashi with your editor, terminal, or workspace manager.
- Browse [Commands](/commands/) when you need exact CLI behavior.
