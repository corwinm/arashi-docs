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

Use `aw` for the workflows in this guide. The `arashi` executable remains supported for existing scripts and workflows.

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
aw --version
```

The installer defaults to `~/.arashi/bin`, updates your shell profile so the installed executables are available on `PATH` in new shells, and in interactive installs can offer shell integration for `aw switch --cd`.
It also runs a quick `aw --version` smoke test before declaring success.
The macOS/Linux installer provides both `arashi` and `aw` and routes them to the same Arashi release.

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

The PowerShell script is the canonical Windows installer. The PowerShell installer provides both `arashi` and `aw` for Git Bash, PowerShell, and Command Prompt. By default, it installs `arashi.bin.exe`, the extensionless `arashi` command for Git Bash, `arashi.ps1`, `arashi.bat`, the extensionless `aw` command for Git Bash, `aw.ps1`, and `aw.bat` in `%USERPROFILE%\.arashi\bin`, adds that directory to the persistent user PATH, and tells you to open a new terminal. Both names execute the same native binary. Open a new Git Bash window before running `aw --version` so it inherits the PATH change.
Use `-InstallDir` or `ARASHI_INSTALL_DIR` for a custom user-writable directory. Use `-NoModifyPath` or `ARASHI_NO_MODIFY_PATH=1` to leave PATH unchanged and add the install directory to PATH yourself. The installer does not edit Git Bash profile files.

### Method 3: npm global install

```bash
npm install -g arashi
```

Arashi downloads the matching platform binary on first use. To preinstall it explicitly:

```bash
aw install
```

npm installs provide both `arashi` and `aw`; both names use the same package and platform binary.

For npm-managed bootstrap automation, `aw install -j` and `aw install --json` are equivalent and emit the same machine-readable result exactly once.

Verify install:

```bash
aw --version
```

Inspect the workspace after installation:

```bash
aw status
```

### Manual Windows fallback

If you do not want to pipe a remote script into PowerShell, download these assets from the same [GitHub release](https://github.com/corwinm/arashi/releases/latest):

- `arashi-windows-x64.exe`
- `arashi`
- `arashi.ps1`
- `arashi.bat`
- `aw`
- `aw.ps1`
- `aw.bat`
- `arashi-checksums.txt`

Download and verify the complete set from one GitHub release. Verify all seven payload assets against `arashi-checksums.txt` with `Get-FileHash -Algorithm SHA256`, rename the source binary `arashi-windows-x64.exe` to `arashi.bin.exe`, and put `arashi.bin.exe`, `arashi`, `arashi.ps1`, `arashi.bat`, `aw`, `aw.ps1`, and `aw.bat` together in one directory on PATH. Open a new shell and confirm that both installed executable entrypoints report the same version. Manually placed wrappers have no direct-installer ownership ledger. Before migrating to the official installer, deliberately move or remove the complete manual payload if any file reports a collision.

### Troubleshooting and fallback

- `command not found`: install missing prerequisite (`curl`, `bash`, `npm`, `node`, or PowerShell) and rerun.
- Permission errors writing to global paths: rerun the direct installer with a user-writable install directory or use a user-level npm prefix.
- Network/download failures: retry once; for npm installs you can rerun `aw install`, then switch to another install method if needed.
- Checksum mismatch on direct installer paths: stop and use npm/manual fallback, then report the failure.
- If `aw --version` exits immediately or returns code `137`, rerun the direct installer with `ARASHI_VERSION=<version>` or `-Version <version>` to pin a known-good release, or use npm/manual install while reporting the bad release artifact.
- PATH changes may require a new terminal on Windows and POSIX shells.
- If Git Bash reports `arashi: command not found` after a PowerShell install, confirm `%USERPROFILE%\.arashi\bin` is on the persistent user PATH, then open a new Git Bash window. An already-open shell does not inherit the update.
- With `-NoModifyPath`, add the install directory to PATH yourself. Do not add an installer-managed entry to `.bashrc`, `.bash_profile`, or `.profile`; the installer does not edit Git Bash profile files.
- If your environment blocks local `.ps1` scripts, inspect `install.ps1` first, then add `-ExecutionPolicy Bypass` to the `powershell` invocation for this one process or use the manual Windows fallback.
- If installation reports an unrelated existing `aw` command on PATH or at the destination, inspect it and deliberately move or remove it before retrying. Arashi does not overwrite or shadow unrelated commands.
- A user-created shell alias for `aw` is an unsupported interim workaround for older releases, not equivalent to the supported executable. Upgrade to a release that provides both names, then remove the workaround so shell integration and completion can manage `aw` safely.

## First Workflow

Arashi is designed to coordinate branches and worktrees across the repositories in a configured meta-repo. Start with the path that matches your workspace.

### 1. Create a new meta-repo

Use this flow when you are starting fresh and want Arashi to initialize the workspace root.

```bash
mkdir my-meta-repo
cd my-meta-repo
aw init
```

When prompted for the repository target, enter `.` to initialize the current directory.

In non-bare repositories, `init` keeps the managed `reposDir` and `worktreesDir` out of Git status by default with repository-local rules in the common repository's `.git/info/exclude`. This protects generated workspace directories without changing the tracked `.gitignore` that your team shares. Bare configured init instead reports paths relative to the bare Git directory as unsafe or non-applicable and does not inspect or write worktree ignore files.

### 2. Add Arashi to an existing meta-repo

Use this flow when you already have a repository that should become your Arashi workspace.

```bash
cd path/to/existing-meta-repo
aw init
```

Run `aw init` from the repository root you want Arashi to manage.

Non-bare workspaces keep managed worktrees inside the workspace by default, while bare workspaces place them alongside the bare repository. See the [init command reference](/commands/init/) for exact directory selection, custom-path, persistence, and compatibility behavior.

Git's effective ignore state wins. If a tracked `.gitignore`, repository-local exclude, or existing global excludes file already ignores a managed path, Arashi preserves that rule and does not add a duplicate. Arashi may read an effective global rule, but it never creates or modifies `core.excludesFile` or other global Git configuration.

Choose a different policy only when you intend it:

```bash
# Commit Arashi-managed rules to the workspace-root .gitignore for the team
aw init --ignore-scope tracked

# Do not let Arashi write ignore files; unignored managed paths produce warnings
aw init --ignore-scope none

# Restore the repository-local default later
aw init --ignore-scope local
```

Explicit `tracked` and `none` preferences are stored in clone-local Git configuration, not `.arashi/config.json`. They therefore apply to later `pull`, `clone`, `add`, and `create` operations in this clone without becoming a shared team setting. Choosing `local` removes that non-default preference.

Once `aw init` completes, continue with the core workflow:

```bash
aw add git@github.com:your-org/frontend.git
aw create feature-docs-bootstrap
aw switch feature-docs-bootstrap
aw status
```

When run interactively, `aw add` walks you through repository configuration and hook initialization.

New managed worktrees are created under the persisted `worktreesDir`: `.arashi/worktrees` for the non-bare omitted default or the parent of a bare repository for its `..` omitted default.
Set command defaults in `.arashi/config.json` (`defaults.create`, `defaults.switch`) to define preferred switch and launch behavior, and use `aw shell install` if you want `aw switch` to support parent-shell `cd` behavior.

The next configured lifecycle command reconciles missing safe ignore rules before it materializes repositories or worktrees. Run `aw doctor` for a non-mutating check of missing, stale, invalid, or unsafe managed ignore state.

This configured workflow uses `.arashi/config.json` to coordinate repositories, groups, hooks, defaults, and managed paths.

### Use Arashi in an unconfigured project

Configured mode remains the better choice whenever the project can adopt Arashi, even for one repository, because it enables repository and workspace hooks, persisted defaults, and custom paths. When you need Arashi in a project that has not adopted it, initialize standalone mode explicitly:

```bash
aw init --zero-config
aw create feature-docs-bootstrap
aw status
```

This keeps worktrees under `.worktrees/<branch>` without creating `.arashi/config.json`, letting you use Arashi ad hoc in any non-bare Git project. It does not provide meta-repository coordination, repository/workspace hooks, or persisted defaults. See the [Standalone Repository workflow](/workflows/standalone/) for its narrower command scope, ignore safety, and upgrade path to configured mode.

If you install Arashi with the official POSIX installer, it can offer shell integration during install so `aw switch --cd` works without an extra setup step.

When the workspace is initialized, choose the workflow guide that matches what you need next:

- [Config](/workflows/config/) for command defaults and shell-aware switching behavior.
- [Hooks](/workflows/hooks/) for lifecycle automation after create and remove.
- [Agents](/workflows/agents-and-specs/) for implementation boundaries and meta-repo guidance.
- [VS Code](/workflows/vscode/) for editor-first worktree management.
- [tmux and sesh](/workflows/tmux-and-sesh/) for terminal-native switching and session flows.
- [Standalone Repository](/workflows/standalone/) for ad hoc use in a project that has not adopted Arashi configuration.

## Next Steps

- Continue to [Commands](/commands/) for command-by-command behavior.
- Continue to [Workflows](/workflows/) if you want setup guidance by workflow instead of by command.
- Continue to [Contributing](/contributing/) if you want to make a project change.
