---
title: One Repository
description: Adopt Arashi in a Git project that does not use a configured multi-repository workspace.
draft: false
sidebar:
  hidden: false
  order: 4
---

Arashi works best with configuration whenever a project can adopt it—even for one repository—because configured mode enables repository and workspace hooks, persisted defaults, custom paths, and coordination. Standalone mode lets you use Arashi ad hoc in any existing non-bare Git project that has not adopted Arashi. The root `.worktrees/` directory is the discovery convention; Arashi keeps the implicit workspace model in memory and does not create `.arashi/` or `.arashi/config.json`.

## Bootstrap with Arashi

Run the explicit bootstrap from anywhere inside the repository:

```bash
aw init --zero-config
```

This creates `.worktrees/` at the main worktree root and, when needed, appends the literal `.worktrees/` rule to the repository-local exclude file resolved by Git. It does not edit tracked `.gitignore`, a global excludes file, global Git configuration, or `.arashi/`.

Preview or automate the same operation with supported output options:

```bash
aw init --zero-config --dry-run
aw init --zero-config --verbose
aw init --zero-config --json
```

`--dry-run` reports planned directory and local-exclude actions without writing. Human output identifies standalone mode and the main repository paths. `--json` emits one structured result on stdout and suppresses verbose human stdout. Config-producing options such as `--repos-dir`, `--worktrees-dir`, `--ignore-scope`, `--force`, and `--no-discover` cannot be combined with `--zero-config`.

## Create and Use a Worktree

Create a branch worktree, then inspect and enter it:

```bash
aw create feat/standalone-docs
aw list
aw status
aw switch feat/standalone-docs
```

The branch keeps its natural path beneath the main root:

```text
my-repository/
├── .git/
├── .worktrees/
│   └── feat/
│       └── standalone-docs/   # .worktrees/<branch>
└── ...
```

The layout never adds a repository-name prefix. Commands invoked from the main worktree or any linked worktree resolve the same main repository and shared worktree set.

### Choose a base for one create

Standalone mode accepts an explicit base for the current invocation:

```bash
aw create feature/FEAT-1234/docs --base feature/FEAT-1234
```

This is CLI-only and invocation-only: standalone create does not load root or repository base configuration, rejects `--repo-base`, and never creates `.arashi` state. The explicit branch resolves from a local branch first and then `origin/<branch>` before hooks or mutation. Without `--base`, standalone compatibility is unchanged and a new target starts from the invocation repository's current `HEAD`; existing local or remote targets keep their normal reuse behavior.

Before `create` or `create --dry-run` mutates a branch, directory, worktree, hook, or config, Arashi asks Git whether the exact normalized destination (for example `.worktrees/feat/standalone-docs`) is effectively ignored. A negation or selective rule that exposes that destination blocks creation even if another `.worktrees/` descendant is ignored. Run `aw init --zero-config`, then retry; Arashi does not rewrite ignore state during passive discovery.

## Supported Lifecycle

Standalone mode supports the single-repository lifecycle commands `create`, `list`, `status`, `switch`, `remove`, `prune`, `doctor`, `move`, and `handoff`:

```bash
aw status --json
aw remove feat/standalone-docs
aw prune --dry-run
aw doctor
```

Where a command supports JSON, it reports standalone mode and exact repository/worktree paths without mixing human output into stdout. Commands that do not support JSON keep their documented output contract. Read-only and cleanup commands still discover the workspace if `.worktrees/` is currently unignored; only creation requires the exact destination ignore gate.

Repository filters and multi-repository selection have no meaning here. Standalone commands reject `--only`, `--group`, interactive multi-repository selection, and switch scopes such as `--repos` or `--all` rather than silently broadening or ignoring them.

Standalone create/remove lifecycles run platform-native repository-targeted and shared **user-global** hooks under `~/.arashi/hooks/`, targeted before shared. Targeted lookup uses the resolved main-root basename even when invocation begins in a linked worktree. Configless repository-local and workspace hooks remain inactive; use configured mode when those scopes are required. Hook cwd is the resolved standalone main root, create follows the documented rollback boundary, and remove preserves pre-abort/post-finalization outcomes.

The same input matrix applies in standalone mode: a human terminal provides `ARASHI_HOOK_INPUT=tty`, `--no-hook-input` or JSON provides `disabled`, and non-TTY automation provides `unavailable`. Disabled and unavailable hooks receive immediate EOF; JSON remains authoritative even with terminal stdin. See the [Lifecycle Hooks reference](/reference/hooks/) for native prompt examples, attribution, security, timeout, and failure details.

## Upgrade to Configured Mode

Use ordinary `aw init` when you need persisted child repositories, groups, defaults, custom paths, configured hooks, setup, pull/push, or cross-repository execution:

```bash
aw init
```

Configured-only commands include `add`, `clone`, `sync`, `pull`, `push`, `exec`, and `setup`. They reject implicit standalone mode with upgrade guidance instead of succeeding against an empty repository map. Ordinary initialization creates `.arashi/config.json`; review the proposed configured paths rather than assuming the standalone `.worktrees/<branch>` layout will remain the configured worktree location.

## Related Commands

- [init](/commands/init/)
- [create](/commands/create/)
- [status](/commands/status/)
- [switch](/commands/switch/)
- [remove](/commands/remove/)
