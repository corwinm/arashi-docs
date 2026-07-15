---
title: Getting Started
description: Install Arashi, run core commands, and navigate to contributor guidance.
draft: false
sidebar:
  hidden: false
---

Use this section when you are new to Arashi and need a quick setup and first workflow.

## Install

Choose the install method for your platform and environment.

### Prerequisites

- `git` available in your shell
- `bash` and `curl` for the macOS/Linux installer path
- Windows PowerShell for the Windows installer path
- `node` and `npm` for the npm path

### Method 1: macOS/Linux installer

```bash
curl -fsSL https://arashi.haphazard.dev/install | bash
```

Pin a specific version when needed:

```bash
curl -fsSL https://arashi.haphazard.dev/install | ARASHI_VERSION=1.16.0 bash
```

Verify install:

```bash
arashi --version
```

The installer defaults to `~/.arashi/bin`, updates your shell profile so `arashi` is available on `PATH` in new shells, and in interactive installs can offer shell integration for `arashi switch --cd`.
It also runs a quick `arashi --version` smoke test before declaring success.

For unattended installs, set `ARASHI_SHELL_INTEGRATION=yes` to enable that automatically or `ARASHI_SHELL_INTEGRATION=no` to skip it.

### Method 2: Windows PowerShell installer

```powershell
powershell -c "irm https://arashi.haphazard.dev/install.ps1 | iex"
```

Inspect the script before running it:

```powershell
irm https://arashi.haphazard.dev/install.ps1
```

Pin a specific version when invoking a downloaded script:

```powershell
.\install.ps1 -Version 1.16.0
```

By default, the Windows installer places `arashi.bin.exe`, `arashi.ps1`, and `arashi.bat` in `%USERPROFILE%\.arashi\bin`, verifies them against `arashi-checksums.txt`, adds the install directory to the persistent user PATH, and tells you to open a new terminal.
Use `-InstallDir` or `ARASHI_INSTALL_DIR` for a custom user-writable directory, and use `-NoModifyPath` or `ARASHI_NO_MODIFY_PATH=1` if you want to update PATH yourself.

### Method 3: npm global install

```bash
npm install -g arashi
```

Arashi downloads the matching platform binary on first use. To preinstall it explicitly:

```bash
arashi install
```

Verify install:

```bash
arashi --version
```

### Manual Windows fallback

If you do not want to pipe a remote script into PowerShell, download these assets from the same [GitHub release](https://github.com/corwinm/arashi/releases/latest):

- `arashi-windows-x64.exe`
- `arashi.ps1`
- `arashi.bat`
- `arashi-checksums.txt`

Verify each asset with `Get-FileHash -Algorithm SHA256`, rename `arashi-windows-x64.exe` to `arashi.bin.exe`, put all files in one directory on PATH, open a new terminal, and run `arashi --version`.

### Troubleshooting and fallback

- `command not found`: install missing prerequisite (`curl`, `bash`, `npm`, `node`, or PowerShell) and rerun.
- Permission errors writing to global paths: rerun the direct installer with a user-writable install directory or use a user-level npm prefix.
- Network/download failures: retry once; for npm installs you can rerun `arashi install`, then switch to another install method if needed.
- Checksum mismatch on direct installer paths: stop and use npm/manual fallback, then report the failure.
- If `arashi --version` exits immediately or returns code `137`, rerun the direct installer with `ARASHI_VERSION=<version>` or `-Version <version>` to pin a known-good release, or use npm/manual install while reporting the bad release artifact.
- PATH changes may require a new terminal on Windows and POSIX shells.
- If your environment blocks local `.ps1` scripts, inspect `install.ps1` first, then add `-ExecutionPolicy Bypass` to the `powershell` invocation for this one process or use the manual Windows fallback.

## First Workflow

Start with the path that matches how you are adopting Arashi.

### 1. Use one repository without configuration

From an existing non-bare Git repository, explicitly prepare the standalone convention:

```bash
arashi init --zero-config
arashi create feature-docs-bootstrap
arashi status
```

This keeps worktrees under `.worktrees/<branch>` without creating `.arashi/config.json`. See the [Standalone Repository workflow](/workflows/standalone/) for manual bootstrap, exact-destination ignore safety, supported lifecycle commands, linked-worktree behavior, and the upgrade path to configured mode.

### 2. Create a new meta-repo

Use this flow when you are starting fresh and want Arashi to initialize the workspace root.

```bash
mkdir my-meta-repo
cd my-meta-repo
arashi init
```

When prompted for the repository target, enter `.` to initialize the current directory.

By default, `init` keeps the managed `reposDir` and `worktreesDir` out of Git status with repository-local rules in the common repository's `.git/info/exclude`. This protects generated workspace directories without changing the tracked `.gitignore` that your team shares.

### 3. Add Arashi to an existing meta-repo

Use this flow when you already have a repository that should become your Arashi workspace.

```bash
cd path/to/existing-meta-repo
arashi init
```

Run `arashi init` from the repository root you want Arashi to manage.

Git's effective ignore state wins. If a tracked `.gitignore`, repository-local exclude, or existing global excludes file already ignores a managed path, Arashi preserves that rule and does not add a duplicate. Arashi may read an effective global rule, but it never creates or modifies `core.excludesFile` or other global Git configuration.

Choose a different policy only when you intend it:

```bash
# Commit Arashi-managed rules to the workspace-root .gitignore for the team
arashi init --ignore-scope tracked

# Do not let Arashi write ignore files; unignored managed paths produce warnings
arashi init --ignore-scope none

# Restore the repository-local default later
arashi init --ignore-scope local
```

Explicit `tracked` and `none` preferences are stored in clone-local Git configuration, not `.arashi/config.json`. They therefore apply to later `pull`, `clone`, `add`, and `create` operations in this clone without becoming a shared team setting. Choosing `local` removes that non-default preference.

Once `arashi init` completes, continue with the core workflow:

```bash
arashi add git@github.com:your-org/frontend.git
arashi create feature-docs-bootstrap
arashi switch feature-docs-bootstrap
arashi status
```

By default, new managed worktrees are created under `.arashi/worktrees`.
Set command defaults in `.arashi/config.json` (`defaults.create`, `defaults.switch`) to define preferred switch and launch behavior, and use `arashi shell install` if you want `arashi switch` to support parent-shell `cd` behavior.

The next configured lifecycle command reconciles missing safe ignore rules before it materializes repositories or worktrees. Run `arashi doctor` for a non-mutating check of missing, stale, invalid, or unsafe managed ignore state.

This configured workflow requires an Arashi workspace with `.arashi/config.json`. For one repository without persisted configuration, use the [standalone workflow](/workflows/standalone/).

If you install Arashi with the official POSIX installer, it can offer shell integration during install so `arashi switch --cd` works without an extra setup step.

When the workspace is initialized, choose the workflow guide that matches what you need next:

- [Hooks](/workflows/hooks/) for lifecycle automation after create and remove.
- [Standalone Repository](/workflows/standalone/) for a configless, single-repository lifecycle.
- [Config](/workflows/config/) for command defaults and shell-aware switching behavior.
- [VS Code](/workflows/vscode/) for editor-first worktree management.
- [tmux and sesh](/workflows/tmux-and-sesh/) for terminal-native switching and session flows.
- [Agents](/workflows/agents-and-specs/) for implementation boundaries and meta-repo guidance.

## Next Steps

- Continue to [Commands](/commands/) for command-by-command behavior.
- Continue to [Workflows](/workflows/) if you want setup guidance by workflow instead of by command.
- Continue to [Contributing](/contributing/) if you want to make a project change.
