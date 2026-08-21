---
title: Config
description: Set command defaults so Arashi creates and switches worktrees the way your team expects.
draft: false
sidebar:
  hidden: false
  order: 2
---

Use this guide after `aw init` when you want Arashi to create and switch worktrees in a repeatable way without repeating flags on every command.

## Managed Paths And Ignore Scope

The shared `.arashi/config.json` defines `reposDir` and `worktreesDir`. For safe repository-relative subdirectories, Arashi reconciles those managed paths with Git during `init`, `pull`, `clone`, `add`, and `create` before creating repositories or worktrees.

The built-in ignore scope is `local`. Missing rules go to the common repository's local exclude file resolved through Git, normally `.git/info/exclude`, so a fresh clone does not dirty the workspace-root `.gitignore`. Git's effective state is authoritative: an existing rule in a tracked ignore file, the repository-local exclude file, or the user's `core.excludesFile` suppresses any duplicate write.

Use `init` to choose or change the clone-local policy:

```bash
aw init --ignore-scope tracked # Write missing rules to the root .gitignore
aw init --ignore-scope none    # Report unignored paths without writing rules
aw init --ignore-scope local   # Restore the repository-local default
```

Only explicit non-default preferences are stored, under the clone-local Git key `arashi.ignoreScope`. They are deliberately absent from `.arashi/config.json`: `tracked` is a team-level content choice for the current clone, while `none` leaves ignore management to the user. Selecting `local` removes the key. Arashi can honor an existing global exclude rule, but it never writes global Git configuration.

Reconciliation normalizes and deduplicates the two managed directories. It writes only safe repository-relative subdirectory rules and skips repository root, absolute paths, and parent traversal. Arashi updates only entries in its own managed block; matching user-authored rules are left alone. With `none`, even stale Arashi-owned entries are reported rather than changed.

Run `aw doctor` to inspect missing rules, stale Arashi-owned entries, unsafe paths, or an invalid stored scope without modifying anything. This configured lifecycle behavior is separate from the configless workspace discovery tracked in [issue #212](https://github.com/corwinm/arashi-arashi/issues/212).

From a linked parent worktree, `aw add` keeps the canonical clone under the primary parent and creates the active child worktree on the matching branch. See the [add command reference](/commands/add/).

## SSH Alias Portability

SSH aliases are machine-local. A `gitUrl` such as `git@work-github:acme/api.git` works only on machines that define the same alias with compatible OpenSSH routing. Arashi stores and passes the remote exactly; it does not synchronize aliases, keys, identity files, or SSH settings.

For portable shared configuration, commit a canonical remote and let each developer use a machine-global Git configuration rule with `url.<base>.insteadOf` when they need different SSH routing. The rule must live in `~/.gitconfig` (or equivalent global Git configuration), not the workspace repository's `.git/config`, because Git must know the rewrite before cloning that repository. For example, keep `git@github.com:acme/api.git` in `.arashi/config.json`, then configure this only on a machine that uses the `work-github` alias:

```bash
git config --global url."git@work-github:".insteadOf git@github.com:
```

The `--global` command writes the equivalent configuration:

```ini
[url "git@work-github:"]
    insteadOf = git@github.com:
```

Git applies the rewrite when cloning. Arashi does not install or synchronize this Git configuration. This keeps the committed workspace portable while leaving account, identity, proxy, and host routing under Git/OpenSSH and each developer's control.

## Command Defaults

Set defaults in `.arashi/config.json` when you want consistent behavior without repeating flags.

```json
{
  "baseBranch": "main",
  "meta": {
    "baseBranch": "meta/integration"
  },
  "repos": {
    "api": {
      "path": "repos/api",
      "gitUrl": "git@github.com:example/api.git",
      "baseBranch": "api/integration"
    }
  },
  "defaults": {
    "create": {
      "switch": true,
      "launch": "herdr"
    },
    "switch": {
      "mode": "herdr"
    }
  }
}
```

Root `baseBranch` is the shared fallback for configured `create`, `clone`, `status`, `pull`, no-upstream `push` comparison, `handoff`, and `doctor`. `meta.baseBranch` overrides it only for the meta repository, while `repos.<name>.baseBranch` overrides it only for that child. In the example, the meta repository uses `meta/integration`, `api` uses `api/integration`, and other children use `main`.

For create and clone, `--base <branch>` overrides every selected repository and repeatable `--repo-base <repository=branch>` overrides individual repositories. Use the reserved `@meta` selector only with configured create; child selectors must exactly match configured repository names. Their full precedence is **repository CLI > invocation CLI > repository config > workspace config**. Status, pull, push fallback, handoff, and doctor apply persisted repository configuration first, then root policy.

Status adds configured-base drift without replacing upstream or remote-default state and de-duplicates a shared base/default target. Pull merges the refreshed configured remote base. Without persisted base policy, pull preserves its existing current-upstream behavior. Push uses configured base only to assess no-upstream publishability and never changes its destination. Handoff and doctor expose lag or unavailable-base states. Standalone behavior remains unchanged.

Arashi validates malformed, duplicate, unknown, unselected, and invalid-branch repository overrides across the complete selected set before hooks, managed-ignore reconciliation, branch, worktree, clone, or filesystem mutation. Requested branches resolve local-first and then from `origin` within each repository; an effective base never falls back to another branch.

- `defaults.create.launch` is one post-create choice: `none | auto | sesh | herdr`.
- `defaults.create.switch` remains an independent boolean. A launch choice other than `none` still selects the newly created primary worktree, so launch implies switch even when `switch` is `false`. Setting `launch` to `none` does not disable an independently enabled switch.
- An absent `defaults.create.launch` preserves built-in no-launch behavior.
- `defaults.switch.mode` is the single switch default. Its complete vocabulary is `auto | cd | launch | sesh | herdr`.
- `auto` prefers strictly detected managed contexts in the order tmux, Herdr, cmux, integrated IDE, and Kitty; only then does it use parent-shell `cd`, followed by terminal/platform launch fallback.
- Kitty remains auto-detected only and does not add a `kitty` value to either persistent mode vocabulary. See the [Kitty workflow guide](/workflows/kitty/) for version, remote-control, reuse, and live-session ownership details.
- `cd` prefers parent-shell switching, `launch` always uses automatic launcher selection, and `sesh` or `herdr` always selects that launcher.
- An absent `defaults.switch.mode` preserves automatic launch without preferring parent-shell `cd`.
- Terminal create reads its launch and switch settings from `defaults.create`. Editor-hosted create reads those launch and switch settings only from its matching `defaults.editors.<host>.create` scope for `vscode`, `cursor`, or `kiro`; that launch/switch lookup does not fall back to generic defaults or another editor when the host scope is absent.

Configured Herdr does not require the command to start inside a Herdr-managed pane, but the Herdr v0.7.4 CLI must be on `PATH` and able to reach a running default session/socket. `switch --launch` preserves a configured `sesh` or `herdr` launcher. `switch --ignore-configured-launcher` bypasses that named launcher while retaining its launch behavior, and `switch --launch --ignore-configured-launcher` requests generic automatic launch. `create --no-launch` suppresses configured post-create Herdr launch. Explicit `--herdr` remains authoritative.

Install shell integration with `aw shell install` if you want `defaults.switch.mode: "cd"` or `"auto"` to support parent-shell directory changes.

## Worktree file materialization

In configured workspaces only, `repos.<name>.copy` is a direct array and `repos.<name>.symlink` is a direct array of repository-relative paths:

```json
{
  "repos": {
    "web": {
      "path": "repos/web",
      "copy": [".env", "config/secrets.json"],
      "symlink": [".turbo"]
    }
  }
}
```

Each entry materializes at the same relative path in the new worktree, using the Git-primary child checkout as its source. Use `copy` for an independent, isolated `.env`, local configuration, or secrets file that may change per worktree. Use `symlink` only to share intentional state or dependencies across worktrees. Prefer package-manager content-addressed stores and per-worktree installs; symlinking `node_modules` is risky because branches, lockfiles, runtimes, native modules, and install scripts can diverge.

The API stays deliberately narrow: globs are not supported, path remapping is not supported, and standalone mode is not supported. Use [lifecycle hooks](/workflows/hooks/) when you need globs, remapping, external sources, interpolation, required entries, generated files, or conditional behavior.

`aw doctor` non-mutatively diagnoses configured materialization source availability and destination safety without reading file contents, running hooks, repairing state, or creating capability probes.

## Hook timeout

Configured workspaces can define short lifecycle commands at `hooks.scripts.<lifecycle>` for workspace ownership and at `repos.<name>.hooks.<lifecycle>` for repository ownership. The allowed lifecycle keys are `pre-create`, `post-create`, `pre-remove`, and `post-remove`. A string is Bash shorthand; an interpreter map may contain only non-empty `bash`, `powershell`, and `cmd` values.

On POSIX, inline selection uses configured Bash and scans `PATH` in order for the first executable `bash`. On Windows, selection tries configured PowerShell, then cmd, then Bash. `SystemRoot` supplies the fixed PowerShell and cmd paths, while `PATH` selects `bash.exe`. A configured location with no compatible available executable fails as `interpreter_unavailable` before mutation.

An inline definition and native file cannot both own the same logical location: Arashi reports an inline/file ambiguity and neither source runs. Prefer short reviewable inline commands and keep substantial or reusable logic in the native files described by the [Hooks workflow](/workflows/hooks/). Inline snippets are non-portable unless compatible interpreter variants are supplied.

```json
{
  "hooks": {
    "scripts": {
      "pre-create": "printf 'Starting create\n'"
    }
  },
  "repos": {
    "web": {
      "path": "repos/web",
      "hooks": {
        "post-create": {
          "bash": "corepack pnpm install --frozen-lockfile",
          "powershell": "corepack pnpm install --frozen-lockfile",
          "cmd": "corepack pnpm install --frozen-lockfile"
        }
      }
    }
  }
}
```

All lifecycle scopes use a default timeout of `300000` milliseconds. Set `hooks.timeout` to an integer from `1` through `2147483647` when trusted configured create/remove hooks need a different limit:

```json
{
  "hooks": {
    "timeout": 600000
  }
}
```

The configured override applies consistently to workspace, repository, global-targeted, and global-shared lifecycle hooks. Zero, negative, fractional, non-numeric, and out-of-range values fail validation before hook discovery or lifecycle mutation. See the [Hooks workflow](/workflows/hooks/) for timing and failure behavior.

## Removed create-only base migration

`defaults.create.baseBranch` is unsupported. Move a workspace-wide value to root `baseBranch`, or use `meta.baseBranch` / `repos.<name>.baseBranch` for a repository-specific value:

```json
{
  "baseBranch": "integration"
}
```

Arashi rejects the removed property even when a canonical value is also present. Validation identifies the exact path and migration targets before repository discovery, hook discovery or execution, network access, managed-ignore reconciliation, or Git/filesystem mutation. Other `defaults.create` launch and switch properties remain supported.

## Legacy create launch migration

The canonical schema and new examples use the single string `launch` field. During a bounded compatibility window, Arashi still reads a legacy boolean `launch` with create-specific `launchMode` or `launch_mode` at generic and editor-hosted create scopes.

| Legacy `launch` | Legacy launcher | Canonical `launch` |
| --- | --- | --- |
| absent | absent | absent (built-in `none`) |
| absent | `auto` / `sesh` / `herdr` | matching mode |
| `true` | absent / `auto` | `auto` |
| `true` | `sesh` / `herdr` | matching explicit mode |
| `false` | absent | `none` |
| `false` | `auto` / `sesh` / `herdr` | reject as ambiguous |

Canonical `auto` plus legacy `auto` is accepted, as is canonical `sesh` or `herdr` plus legacy `auto` or the same explicit launcher. Canonical `none` plus any legacy launcher, canonical `auto` plus an explicit legacy launcher, and opposite explicit launchers are rejected. Equal `launchMode` and `launch_mode` aliases collapse to one value; different aliases are rejected before mapping. Invalid launch values and non-boolean `switch` values are also rejected.

Accepted legacy input emits exactly one scope-qualified migration warning with the exact replacement for each affected scope. Warnings go to stderr, including during JSON commands, so stdout remains one structured document. Normalization is in memory: the configuration file remains byte-for-byte unchanged. Rejected combinations fail before repository discovery, worktree creation, hooks, launch, or other workspace mutation and explain whether to choose canonical `launch: "none"` or the matching enabled mode.

## Legacy switch mode migration

The canonical schema and new examples use only `defaults.switch.mode`. Unsupported values are rejected before target selection or mutation. During the bounded compatibility window—until a future config-version change removes the legacy reader—Arashi still reads legacy `defaults.switch.launchMode` and `defaults.switch.launch_mode`, emits one warning with the exact unified replacement for accepted configurations, and keeps migration diagnostics out of JSON stdout.

| Legacy `mode` | Legacy launch value | Unified `mode` |
| --- | --- | --- |
| absent | absent | absent (built-in `launch`) |
| absent | `auto` | `launch` |
| absent | `sesh` / `herdr` | matching explicit mode |
| `launch` | absent / `auto` | `launch` |
| `launch` | `sesh` / `herdr` | matching explicit mode |
| `auto` | absent / `auto` | `auto` |
| `auto` | `sesh` / `herdr` | matching explicit mode |
| `cd` | absent / `auto` | `cd` |
| `cd` + `sesh` / `herdr` | explicit fallback | reject as ambiguous |
| `sesh` / `herdr` | absent / `auto` / same launcher | preserve explicit mode |
| `sesh` / `herdr` | opposite explicit launcher | reject as conflicting |

If `launchMode` and `launch_mode` are both present with equal values, Arashi collapses them before applying the table and emits one migration warning only after an accepted mapping. Different alias values are rejected before mapping. Rejected `cd` plus explicit-launcher combinations name both values and direct you to choose either unified `cd` or the matching explicit mode; conflicting explicit modes likewise name both values. Rejection happens before target selection, launch, directory switching, or workspace mutation.

## Suggested Setup Sequence

1. Start with `defaults.create` and `defaults.switch` so the default behavior matches your team.
2. Enable shell integration if you want `aw switch --cd` behavior.
3. Add hooks after you confirm the create and switch flow you want to automate.
4. Keep shared defaults in config and move environment-specific setup into hooks.

## Repository Groups

Add optional `groups` arrays to entries under `repos.<name>` when your workspace has semantic repository sets that you target together. Groups are stored on each repository entry, so there is no separate group registry to keep in sync.

```json
{
  "repos": {
    "arashi": {
      "path": "repos/arashi",
      "gitUrl": "git@github.com:example/arashi.git",
      "groups": ["core"]
    },
    "arashi-docs": {
      "path": "repos/arashi-docs",
      "gitUrl": "git@github.com:example/arashi-docs.git",
      "groups": ["docs"]
    },
    "arashi-vscode": {
      "path": "repos/arashi-vscode",
      "groups": ["extensions"]
    },
    "arashi-skills": {
      "path": "repos/arashi-skills",
      "groups": ["agents", "docs"]
    },
    "deploy": {
      "path": "repos/deploy",
      "groups": ["infra"]
    }
  }
}
```

Common layouts use groups such as:

- `core` for the primary CLI, API, or shared libraries.
- `docs` for documentation sites, examples, and content exports.
- `extensions` for editor extensions or optional integrations.
- `agents` for skill packages, agent instructions, and automation-facing references.
- `infra` for deployment, CI, infrastructure, or operations repositories.

A repository can belong to more than one group when it serves multiple roles. Repositories without `groups` remain valid and are treated as ungrouped.

Use `--group <group>` with repo-selecting commands to target a semantic set without enumerating repository names:

```bash
aw status --group docs
aw create feat/update-docs --group docs --no-launch --no-switch
aw exec --group agents -- pnpm validate
```

When `--group` and `--only` are supplied together, Arashi intersects the filters: `--group` narrows the explicit repository list instead of broadening it. For example, `aw exec --only arashi,arashi-docs --group docs -- pnpm validate` runs only in `arashi-docs` if that is the only selected repository in the `docs` group. Unknown groups and valid filters that produce an empty intersection are reported as selection errors before mutating commands run.

### Repeated and comma-separated selectors

Every command that registers `--only` or `--group` accepts repeated occurrences, comma-separated values, or both mixed together. Values are flattened in encounter order, trimmed, and deduplicated by first occurrence. Blank segments beside valid values are ignored.

Omitted selectors retain the command default. A supplied selector that normalizes empty remains an error rather than becoming omission. An unknown repository or group and an empty intersection also fail closed before repository inspection, hooks, fetches, or mutation. The command-local aliases `-o` and `-g` use the identical normalization and error behavior.

## Related References

- [create command](/commands/create/)
- [switch command](/commands/switch/)
- [shell command](/commands/shell/)
- [Hooks workflow guide](/workflows/hooks/)
- [Herdr workflow guide](/workflows/herdr/)
- [Full configuration reference](https://github.com/corwinm/arashi/blob/main/docs/configuration.md)
