---
title: Config
description: Set command defaults so Arashi creates and switches worktrees the way your team expects.
draft: false
sidebar:
  hidden: false
  order: 2
---

Use this guide after `aw init` when you want Arashi to create and switch worktrees in a repeatable way without repeating flags on every command.

## Inspect And Change Supported Settings

Run `aw configure` in a configured workspace to inspect supported settings or make a human-confirmed change. Interactive editing requires both stdin and stdout to be a TTY.

The finite product-owned descriptor path set is exact and is never generated from the schema:

- Workspace settings: `reposDir`, `worktreesDir`, `baseBranch`, and `sync.timeoutSeconds`.
- Workspace lifecycle hooks: `hooks.timeout`, `hooks.scripts.pre-create`, `hooks.scripts.post-create`, `hooks.scripts.pre-remove`, and `hooks.scripts.post-remove`.
- Command defaults: `defaults.create.switch`, `defaults.create.launch`, and `defaults.switch.mode`.
- Editor defaults: `defaults.editors.vscode.create.switch`, `defaults.editors.vscode.create.launch`, `defaults.editors.cursor.create.switch`, `defaults.editors.cursor.create.launch`, `defaults.editors.kiro.create.switch`, and `defaults.editors.kiro.create.launch`.
- Meta-repository policy: `meta.baseBranch`.
- Existing repository settings: `repos.<name>.groups`, `repos.<name>.baseBranch`, `repos.<name>.copy`, `repos.<name>.symlink`, `repos.<name>.hooks.pre-create`, `repos.<name>.hooks.post-create`, `repos.<name>.hooks.pre-remove`, and `repos.<name>.hooks.post-remove`. `repos.<name>.path` and `repos.<name>.gitUrl` identify the repository and are not editable.

Command and editor defaults remain separate scopes even when they control similar behavior. **Configured** means a persisted field is present; **Not configured** means the field is absent or not persisted. **Effective** is shown separately for inherited or built-in values and never persists a value implicitly. These state labels are not runtime health; use `aw doctor` for diagnostics.

After selecting a setting, choose **Keep**, **Edit**, or **Clear**. Keep preserves the persisted field; Edit validates and replaces it; Clear removes an optional persisted field. Required `reposDir` cannot be cleared, and empty input is not clear.

Existing active native files are external state: configure never clears, deletes, or overwrites them and offers **Keep/skip**. This boundary applies even when another setting is saved; the retained file stays byte-identical.

Visible plaintext command entry and the exact final preview are the only views that include inline command bodies. Selection screens, setting lists, ordinary views, diagnostics, cancellation, JSON, and the generated active-file plan remain body-free without inline command bodies. At final confirmation, the exact serialized candidate JSON contains the same bytes that save will persist, including plaintext persisted inline commands. A separate active-file plan lists lifecycle, exact path, safe-no-op state, and runtime readiness, and does not show contents. Generated-file state and contents are not inserted into the JSON preview. Declining or interrupting the confirmation writes neither configuration nor active files.

When serialized bytes are unchanged and there is no active-file plan, configure exits before final confirmation or save. Keep and skip therefore remain true no-op actions rather than rewrites.

Human and JSON modes both require a configured valid workspace. Missing configuration, standalone context, and invalid configuration fail before prompt or inspection; configure does not initialize or repair configuration. Human editing requires stdin and stdout to be TTYs; `aw configure --json` never prompts and never mutates, and provides one stable sanitized inspection document. Non-TTY `aw configure` without `--json` fails instead of editing, and the command does not provide broad non-interactive mutation flags such as `--set` or `--unset`.

`aw configure` is not a schema editor. It preserves compatible fields outside the supported list but does not offer controls for them. To change an unsupported canonical field, directly edit `.arashi/config.json`, then use Arashi's normal validation and diagnostics before relying on the change.

## Delete A Configured Repository Dependency

Delete removes configured repository dependencies, while `remove` deletes branch worktrees. `aw delete <repository>` targets one exact configured repository key. With `aw delete` omitted, a human TTY opens a checkbox to select one or more keys; non-TTY and JSON use with the target omitted fails selection-required and requires an explicit key.

Run `--dry-run` before `--force`; `--force` skips confirmation. For one or many TTY selections, Arashi prepares all selected repository plans and displays the complete selected plans in one combined preview followed by one default-no confirmation. `--force` bypasses confirmation and Git data-loss guards only. Path containment, symlink, topology, identity, hook ambiguity, and concurrent-config checks remain mandatory.

Delete removes the canonical clone, owned linked worktrees, local refs, the exact config entry, and repository-targeted hook files/templates. It preserves unrelated configuration, managed-ignore policy, shared hooks, user-global hooks, remote repositories, and remote branches.

In a partial batch, earlier repositories may be completed, the failing repository is failed, and later repositories are not started. Inspect the phase ledger and surviving state, then retry the exact command only when reported safe. There is no atomic rollback; do not hand-edit configuration or broadly delete surviving paths. See the [delete command](/commands/delete/) for the copy-pasteable preview, confirmation, JSON, and recovery workflow.

## Worktree naming

Configured workspaces can customize new worktree paths with the root `worktreeNaming` object. This initial configuration slice is not available in interactive `aw configure`; edit `.arashi/config.json` directly:

```json
{
  "worktreeNaming": {
    "style": "repo-branch",
    "branchSlashes": "flatten",
    "maxPathLength": 180
  }
}
```

Both fields have closed values:

- `style`: `default | branch | repo-branch`
- `branchSlashes`: `preserve | flatten`

Omitting `style` means `default`, and omitting `branchSlashes` means `preserve`. Arashi applies those defaults in memory: it does not auto-persist either default and does not migrate existing configuration.

`maxPathLength` is an optional positive integer from 1 through 2,147,483,647. It limits each full absolute newly planned configured-worktree destination in UTF-16 code units, rather than limiting one folder component. Omitting `maxPathLength` preserves current path bytes; Arashi does not persist or migrate a default.

For a repository named `example` and branch `feature/auth`, the path relative to the configured worktree root is:

| Workspace and setting | New worktree path |
| --- | --- |
| Bare `default` + `preserve` | `example/feature/auth` |
| Bare `default` + `flatten` | `example/feature-auth` |
| Bare `branch` + `preserve` | `feature/auth` |
| Bare `branch` + `flatten` | `feature-auth` |
| Bare `repo-branch` + `preserve` | `example-feature/auth` |
| Bare `repo-branch` + `flatten` | `example-feature-auth` |
| Non-bare `default` + `preserve` | `feature/auth` |
| Non-bare `default` + `flatten` | `feature-auth` |
| Non-bare `branch` + `preserve` | `feature/auth` |
| Non-bare `branch` + `flatten` | `feature-auth` |
| Non-bare `repo-branch` + `preserve` | `example-feature/auth` |
| Non-bare `repo-branch` + `flatten` | `example-feature-auth` |

The mapping changes only the filesystem path; the Git branch remains exactly `feature/auth`. If every selected destination fits the budget, its path remains exact. Only newly planned configured paths may shorten. When the budget is exceeded, Arashi shortens the generated parent namespace to a readable prefix followed by `-` and the first eight lowercase SHA-256 hex characters of the portable ordinary namespace. If the chosen destination collides, create fails deterministically instead of appending a suffix.

Arashi sizes one parent against all selected coordinated child paths, even when selection excludes the parent; child-relative paths remain unchanged. Coordinated children remain under the planned parent path using their configured child paths. If the fixed base and child topology cannot leave room for the collision-resistant suffix, create reports `WORKTREE_PATH_LENGTH_EXCEEDED` before mutation.

Existing worktree paths are metadata-authoritative and are never renamed by this setting. Standalone `.worktrees/<branch>` placement is unchanged. The budget reserves space only for each worktree root; it cannot guarantee repository-internal files fit.

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
