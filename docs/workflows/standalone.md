---
title: Standalone Repository Workflow
description: Use Arashi with one Git repository and no persisted Arashi configuration.
draft: false
sidebar:
  hidden: false
  order: 20
---

Arashi's primary workflow coordinates branches and worktrees across repositories in a configured meta-repo. Use standalone mode as a narrower convenience when one existing, non-bare Git repository needs worktrees but does not need that coordination. The root `.worktrees/` directory is the discovery convention; Arashi keeps the implicit workspace model in memory and does not create `.arashi/` or `.arashi/config.json`.

## Bootstrap with Arashi

Run the explicit bootstrap from anywhere inside the repository:

```bash
arashi init --zero-config
```

This creates `.worktrees/` at the main worktree root and, when needed, appends the literal `.worktrees/` rule to the repository-local exclude file resolved by Git. It does not edit tracked `.gitignore`, a global excludes file, global Git configuration, or `.arashi/`.

Preview or automate the same operation with supported output options:

```bash
arashi init --zero-config --dry-run
arashi init --zero-config --verbose
arashi init --zero-config --json
```

`--dry-run` reports planned directory and local-exclude actions without writing. Human output identifies standalone mode and the main repository paths. `--json` emits one structured result on stdout and suppresses verbose human stdout. Config-producing options such as `--repos-dir`, `--worktrees-dir`, `--ignore-scope`, `--force`, and `--no-discover` cannot be combined with `--zero-config`.

## Bootstrap Manually

If you must establish the convention manually, use this failure-atomic flow from anywhere in the repository:

```bash
(
  set -eu
  start="$(pwd -P)"
  root="$(git -c core.quotePath=false worktree list --porcelain | sed -n '1s/^worktree //p')"
  [ -n "$root" ] || {
    printf '%s\n' 'error: unable to resolve the main worktree' >&2
    exit 1
  }
  [ "$(git -C "$root" rev-parse --is-bare-repository)" = false ] || {
    printf '%s\n' 'error: zero-config mode requires a non-bare repository' >&2
    exit 1
  }

  # Reject applicable configured workspaces before any mutation.
  for origin in "$start" "$root"; do
    candidate="$origin"
    while :; do
      [ ! -e "$candidate/.arashi/config.json" ] || {
        printf 'error: configured workspace detected at %s\n' "$candidate" >&2
        exit 1
      }
      parent="$(dirname "$candidate")"
      [ "$parent" != "$candidate" ] || break
      candidate="$parent"
    done
  done

  cd "$root"
  exclude_file="$(git rev-parse --git-path info/exclude)"
  case "$exclude_file" in
    /*) ;;
    *) exclude_file="$root/$exclude_file" ;;
  esac
  [ -L "$exclude_file" ] && {
    printf 'error: refusing symlinked exclude file: %s\n' "$exclude_file" >&2
    exit 1
  }
  [ -d "$(dirname "$exclude_file")" ] || {
    printf 'error: exclude directory is missing: %s\n' "$(dirname "$exclude_file")" >&2
    exit 1
  }
  [ ! -e .worktrees ] || [ -d .worktrees ] || {
    printf '%s\n' 'error: .worktrees exists and is not a directory' >&2
    exit 1
  }

  probe=.worktrees/.arashi-ignore-probe
  needs_rule=0
  git check-ignore --no-index -q -- "$probe" || needs_rule=1
  created_worktrees=0
  exclude_changed=0
  exclude_existed=0
  backup=""

  rollback() {
    status=$?
    trap - EXIT HUP INT TERM
    if [ "$status" -ne 0 ]; then
      if [ "$exclude_changed" -eq 1 ]; then
        if [ "$exclude_existed" -eq 1 ]; then
          cp "$backup" "$exclude_file"
        else
          rm -f "$exclude_file"
        fi
      fi
      [ "$created_worktrees" -eq 0 ] || rmdir .worktrees 2>/dev/null || true
    fi
    [ -z "$backup" ] || rm -f "$backup"
    exit "$status"
  }
  rollback_signal() { exit 1; }
  trap rollback EXIT
  trap rollback_signal HUP INT TERM

  if [ ! -d .worktrees ]; then
    mkdir .worktrees
    created_worktrees=1
  fi
  if [ "$needs_rule" -eq 1 ]; then
    backup="$(mktemp)"
    if [ -e "$exclude_file" ]; then
      cp "$exclude_file" "$backup"
      exclude_existed=1
    fi
    exclude_changed=1
    if [ -s "$exclude_file" ] && [ -n "$(tail -c 1 "$exclude_file")" ]; then
      printf '\n' >> "$exclude_file"
    fi
    printf '.worktrees/\n' >> "$exclude_file"
  fi
  git check-ignore --no-index -q -- "$probe" || {
    printf '%s\n' 'error: .worktrees/ is not effectively ignored' >&2
    exit 1
  }
  trap - EXIT HUP INT TERM
  [ -z "$backup" ] || rm -f "$backup"
)
```

The manual flow preflights repository/configuration state and the exclude target before mutation. On failure or interruption it restores the prior exclude contents and removes `.worktrees/` only when that invocation created it and it remains empty. It intentionally updates only the repository-local exclude file returned by Git. Do not substitute a tracked `.gitignore` edit or a global excludes/config change unless you explicitly choose and own that Git policy outside Arashi bootstrap.

## Create and Use a Worktree

Create a branch worktree, then inspect and enter it:

```bash
arashi create feat/standalone-docs
arashi list
arashi status
arashi switch feat/standalone-docs
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

Before `create` or `create --dry-run` mutates a branch, directory, worktree, hook, or config, Arashi asks Git whether the exact normalized destination (for example `.worktrees/feat/standalone-docs`) is effectively ignored. A negation or selective rule that exposes that destination blocks creation even if another `.worktrees/` descendant is ignored. Run `arashi init --zero-config` or repair the repository-local exclude, then retry; Arashi does not rewrite ignore state during passive discovery.

## Supported Lifecycle

Standalone mode supports the single-repository lifecycle commands `create`, `list`, `status`, `switch`, `remove`, `prune`, `doctor`, `move`, and `handoff`:

```bash
arashi status --json
arashi remove feat/standalone-docs
arashi prune --dry-run
arashi doctor
```

Where a command supports JSON, it reports standalone mode and exact repository/worktree paths without mixing human output into stdout. Commands that do not support JSON keep their documented output contract. Read-only and cleanup commands still discover the workspace if `.worktrees/` is currently unignored; only creation requires the exact destination ignore gate.

Repository filters and multi-repository selection have no meaning here. Standalone commands reject `--only`, `--group`, interactive multi-repository selection, and switch scopes such as `--repos` or `--all` rather than silently broadening or ignoring them.

Standalone create/remove lifecycles can run shared and repository-targeted **user-global** hooks under `~/.arashi/hooks/`. A configless repository's local `.arashi/hooks` and configured workspace-root hook scopes are not activated. Use configured mode when those local hook capabilities are required.

## Upgrade to Configured Mode

Use ordinary `arashi init` when you need persisted child repositories, groups, defaults, custom paths, configured hooks, setup, pull/push, or cross-repository execution:

```bash
arashi init
```

Configured-only commands include `add`, `clone`, `sync`, `pull`, `push`, `exec`, and `setup`. They reject implicit standalone mode with upgrade guidance instead of succeeding against an empty repository map. Ordinary initialization creates `.arashi/config.json`; review the proposed configured paths rather than assuming the standalone `.worktrees/<branch>` layout will remain the configured worktree location.

## Related Commands

- [init](/commands/init/)
- [create](/commands/create/)
- [status](/commands/status/)
- [switch](/commands/switch/)
- [remove](/commands/remove/)
