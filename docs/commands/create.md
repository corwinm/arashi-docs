---
title: create Command
description: Create a feature branch worktree across workspace repositories.
draft: false
sidebar:
  hidden: false
---

## What It's For

Start feature work across multiple repositories from a single command.

## What It Does

- Creates a worktree for the target branch in each configured repository.
- Ensures repositories are aligned to the same branch name.
- In interactive mode, always creates the parent/meta worktree and prompts only for optional child repositories.
- Reconciles managed ignore rules before creating any parent or child worktree.
- Runs configured lifecycle hooks when present.

## Usage

```bash
aw create <branch> [options]
```

## Key Options

- `-o, --only <repos>` limit creation to repository names; repeat it, use commas, or mix both forms.
- `-g, --group <group>` create worktrees only for requested groups; repeat it, use commas, or mix both forms.
- `-i, --interactive` pick repositories interactively.
- `--switch` switch to the created parent worktree after create.
- `--no-switch` disable configured create switch defaults for one invocation.
- `--launch` open a terminal/editor context after create.
- `--no-launch` disable configured create launch defaults for one invocation.
- `--tab` launch the primary created worktree as a tab in the selected supported context (implies launch and switch).
- `--tmux` force a new plain tmux window after creation (implies launch and target selection).
- `--sesh` force sesh launch mode (implies launch behavior).
- `--herdr` open or focus the primary created worktree in Herdr (implies launch behavior).
- `--conflict <strategy>` preselect conflict handling (`ABORT`, `REUSE_EXISTING`).
- `--base <branch>` override the effective base for every selected repository.
- `--repo-base <repository=branch>` override one repository; repeat it for more repositories and use `@meta` for the meta repository.
- `--no-hook-input` execute hooks with immediate EOF on stdin for this invocation only.
- `--no-hooks` disable hook execution.
- `--no-progress` hide progress indicators.
- `-n, --dry-run` generate a plan without creating worktrees.
- `--move-changes` move compatible uncommitted changes from the current workspace into the new worktree after create.
- `-j, --json` output machine-readable create results or structured unsupported-mode errors.

## Examples

```bash
# Create branch worktrees across the workspace
aw create feature-auth-refresh

# Create in specific repositories only
aw create feature-auth-refresh --only api,web

# Create worktrees for the core repository group
aw create feature-auth-refresh --group core

# Pick child repositories interactively while always creating the parent worktree
aw create feature-auth-refresh --interactive

# Force launch for this run
aw create feature-auth-refresh --launch

# Create worktrees and open the primary worktree in a new plain tmux window
aw create feature-auth-refresh --tmux

# Create worktrees and open the primary worktree as a supported tab
aw create feature-auth-refresh --tab

# Create worktrees and open the primary worktree in Herdr
aw create feature-auth-refresh --herdr

# Disable configured launch default for this run
aw create feature-auth-refresh --no-launch

# Review the plan first
aw create feature-auth-refresh --dry-run

# Create a task branch from a long-running feature branch
aw create feature/FEAT-1234/docs --base feature/FEAT-1234

# Override the meta and API bases while other selected repositories use release
aw create release/docs --base release --repo-base @meta=meta/release --repo-base api=api/release

# Preview the same selected repositories and resolved bases
aw create feature/FEAT-1234/docs --base feature/FEAT-1234 --group docs --dry-run

# Create worktrees and emit JSON for automation
aw create feature/FEAT-1234/docs --base feature/FEAT-1234 --no-launch --no-switch --json

# Create worktrees and move current uncommitted work into them
aw create feature-auth-refresh --move-changes

# Run hooks without allowing them to read from the terminal
aw create feature-auth-refresh --no-hook-input
```

## Worktree locations

Configured workspaces can customize new paths with the root `worktreeNaming` object. This initial configuration slice is not available in interactive `aw configure`; edit `.arashi/config.json` directly. The closed values are:

- `style`: `default | branch | repo-branch`
- `branchSlashes`: `preserve | flatten`

Omitting `style` means `default`, and omitting `branchSlashes` means `preserve`. Arashi applies those defaults in memory: it does not auto-persist either default and does not migrate existing configuration.

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

For example:

```json
{
  "worktreeNaming": {
    "style": "repo-branch",
    "branchSlashes": "flatten"
  }
}
```

The mapping changes only the filesystem path; the Git branch remains exactly `feature/auth`. If the chosen destination collides, create fails deterministically instead of appending a suffix. Existing worktree paths are metadata-authoritative and are never renamed by this setting.

Coordinated children remain under the planned parent path using their configured child paths. Standalone `.worktrees/<branch>` placement is unchanged.

## Choosing a base branch

Use `--base <branch>` for an invocation-wide override and repeat `--repo-base <repository=branch>` for repository-specific overrides. The reserved `@meta` selector identifies the configured meta repository. Shared precedence is **repository CLI > invocation CLI > repository config > workspace config**. Repository config means `meta.baseBranch` or `repos.<name>.baseBranch`, and workspace config means root `baseBranch`. The removed `defaults.create.baseBranch` property is rejected with guidance to use the canonical root or repository-specific policy before hooks or mutation.

Arashi rejects malformed or duplicate overrides, unknown or unselected selectors, invalid branches, and `--repo-base` in implicit standalone mode. It validates the complete selected repository set chosen by `--only`, `--group`, their intersection, or interactive selection before hooks or any workspace mutation. Each effective base resolves from the local branch first, then `origin/<branch>`; Arashi aggregates all repository resolution errors as `CREATE_BASE_RESOLUTION_FAILED` and never falls back to another branch.

Preflight records both the reporting ref and its captured commit OID. New targets use that OID even if the local or remote base ref moves after preflight. A target accepted with `--conflict REUSE_EXISTING` is only materialized: the requested base is still validated, but Arashi does not reset, rebase, recreate, or otherwise change its ancestry.

Human `--dry-run` output names every selected repository and its policy source. Entries with an effective requested base include the normalized branch, resolved ref/OID, and planned create-or-reuse action; legacy-omitted entries omit resolved ref/OID fields rather than claiming a resolution that did not occur. JSON uses stable policy sources `repository-cli`, `cli`, `repository-config`, `workspace-config`, and `legacy-omitted`; resolution failures use `CREATE_BASE_RESOLUTION_FAILED`. Arashi keeps `ARASHI_BRANCH_NAME` target-oriented and deliberately does not provide an `ARASHI_BASE_BRANCH` hook or environment variable.

### Workaround for older Arashi versions

Before native base selection, pre-create the target branch from the desired base in every repository, then let create reuse it:

```bash
BASE=feature/FEAT-1234
TARGET=feature/FEAT-1234/docs

# aw exec reaches managed children, not the parent.
aw exec -- git branch "$TARGET" "$BASE"
git branch "$TARGET" "$BASE"
aw create "$TARGET" --conflict REUSE_EXISTING
```

This workaround requires the base in every selected repository and an absent target, unless you have independently verified an existing target's ancestry. Filters can narrow the managed children, but `aw exec` covers managed children, not the parent, so create the parent target separately. `REUSE_EXISTING` does not repair or validate ancestry.

## Configured file materialization

For each selected configured child repository, the construction order is `pre-create`, `copy`, `symlink`, then `post-create`. Copy and symlink entries retain their configured array order, so post-create hooks can rely on materialized paths being ready. `--no-hooks` does not disable copy, symlink, or other materialization.

Missing sources are skipped with a visible non-fatal outcome. Arashi never overwrites an existing destination, and every destination must remain inside the new worktree; unsafe paths or an existing destination fail that repository's materialization. A native `symlink` fails when platform policy or the filesystem rejects it, with no copy, hard-link, or junction fallback. Materialization does not fall back to the caller's checkout or another source repository: it always reads from the Git-primary child checkout.

`aw create --dry-run` previews the ordered materialization plan in declaration order before any worktree or file mutation. See the [Config workflow](/workflows/config/#worktree-file-materialization) to choose between isolated copies and intentionally shared symlinks.

## Notes

- In standalone mode, `create` makes one worktree at the main root's `.worktrees/<branch>` path from either the main or a linked worktree. Before any mutation, Git must report the exact destination as effectively ignored; repository/group filters and interactive multi-repository selection are rejected. See the [Standalone Repository workflow](/workflows/standalone/).
- `create` validates branch names and repository readiness.
- Configured create runs workspace `pre-create` once before branch/worktree mutation, then each repository's retained-name `pre-create.<repo>` after Git worktree creation and before configured file materialization/setup, followed by `post-create.<repo>`. Workspace `post-create` runs once after coordinated Git creation and before move-changes or switch/launch handling. Repository hooks run in the new child worktree; workspace hooks run at the workspace root.
- Any create-hook validation failure, timeout, or nonzero exit fails create and enters the owned Git rollback boundary. Configured-create human results summarize the complete hook outcome ledger with status counts and per-failure details; JSON results preserve every outcome record. Rollback warnings remain visible in the applicable result. See the [Hooks workflow](/workflows/hooks/) for scope, environment, platform, timeout, and outcome details.
- Inline configured hooks use the same lifecycle timing as native files. Results identify them with `sourceKind: "inline-config"`, `sourceOwnerKind`, and `sourceOwnerName`; outcomes, previews, diagnostics, and logs do not reveal snippet text.
- A normal terminal run exposes `ARASHI_HOOK_INPUT=tty`; `--no-hook-input` or JSON uses `disabled`, and non-TTY automation uses `unavailable`. Disabled and unavailable hooks receive immediate EOF. `--no-hook-input` does not skip hooks; it is distinct from `--no-hooks`, which skips hook execution, and `--interactive`, which continues to control configured repository selection. The input opt-out is invocation only and is not persisted.
- `--no-hooks` is create-only; `--no-hook-input` is shared by create and remove. Configured-create dry-run performs no hook discovery, returns an empty hook ledger, and has no hook preview. See the [Hooks workflow](/workflows/hooks/#inline-configured-hooks) for choosing inline configuration or native files.
- On other failures, coordinated operations can roll back to keep repos consistent.
- Reconciliation honors existing effective tracked, repository-local, or global rules before using the clone's stored scope or repository-local default. Scope `none` creates no ignore-file changes and warns for safe paths that remain unignored.
- `--dry-run` previews managed ignore scope, effective sources, planned rules, warnings, and unsafe skips without changing ignore files or clone-local preference state.
- If worktree creation is fully rolled back, reconciliation is restored too. If a worktree survives a partial failure, Arashi retains the ignore state needed for that final filesystem state and reports it.
- Interactive `create` treats the parent/meta repository as the required anchor for the coordinated worktree; the selection prompt only controls child repositories.
- `--group` targets configured semantic sets such as `core`, `docs`, `extensions`, `agents`, or `infra`.
- When combined with `--only`, `--group` narrows the explicit repository list by intersection. Empty intersections fail before creating worktrees.
- A partial coordinated worktree is valid. Add omitted child repositories later with [`aw clone`](/commands/clone/) from inside that worktree.
- Configure one post-create choice in `.arashi/config.json` at `defaults.create.launch`: `none | auto | sesh | herdr`. The independent `switch` boolean can still select the new primary worktree without launching; every launch mode except `none` selects it too, so launch implies switch.
- `--tmux` is a per-invocation-only override and is not persisted in the generic or editor-scoped create configuration. Configured `auto` can still choose tmux contextually when launch runs inside tmux.
- `--tab` is a CLI-only, one-invocation disposition. It implies launch and switch, bypasses configured generic or editor-scoped launch defaults, and wins over `--no-launch` and `--no-switch`; automatic contextual launcher resolution applies unless `--tmux`, `--sesh`, or `--herdr` explicitly chooses the adapter. Knowable unsupported requests fail before mutation, while runtime failures after creation preserve the worktrees and never fall back to a window. See the [launch disposition workflow](/workflows/launch-disposition/) for the complete matrix and JSON exit behavior.
- Explicit `--tmux` takes precedence over generic and editor-scoped create defaults and automatic Herdr, cmux, or IDE detection. `--tmux` + `--no-launch` still implies post-create launch, and `--tmux` + `--no-switch` still selects and launches the primary created worktree.
- `--tmux` conflicts with `--sesh` and `--herdr`. Arashi reports the complete explicit-launcher conflict set before repository mutation.
- Launch precedence is deliberate. Otherwise `--sesh` or `--herdr` selects that explicit launcher even beside `--launch` or `--no-launch`; `--launch` selects `auto`; `--no-launch` selects `none`; then configured launch applies; an absent choice is built-in `none`.
- Terminal and editor-hosted defaults are isolated. See the [Config workflow](/workflows/config/) for matching-host scope and legacy migration rules.
- Explicit tmux requires a non-empty `TMUX` value after trimming. A missing or blank value is an actionable usage error before creating worktrees or running create hooks, so no create rollback is needed.
- After successful preflight, Arashi invokes `tmux new-window -c <primary-worktree-path>` without a shell. Paths containing spaces, quotes, or shell-significant characters remain the exact single argument after `tmux new-window -c`.
- If `tmux new-window` fails after creation, Arashi reports the launch failure, preserves the successfully created worktrees, and does not fall back to another launcher or roll back Git creation.
- Explicit tmux works the same way in a zero-config standalone repository and does not create or persist `.arashi` configuration. The standalone destination and effective-ignore safety checks still apply.
- Explicit `--herdr` implies launch and takes precedence over `--no-launch`, matching explicit `--sesh`. Combining `--herdr` with `--sesh` is rejected before worktree creation; without explicit `--herdr`, `--no-launch` suppresses configured Herdr.
- `create --launch` automatically selects Herdr only when `HERDR_ENV` trims to exactly `1` and no explicit or configured launcher wins. Automatic tmux keeps precedence over automatic Herdr.
- Herdr v0.7.4 requires a reachable default session/socket and a non-bare main checkout for the primary repository. It opens the already-created target, reuses an existing workspace, and applies the `<repo-name>: <branch-name>` label.
- If Herdr is missing, cannot reach its socket, returns an error or invalid response, or cannot use a bare-only source, Arashi reports `LAUNCH_FAILED`, preserves every successfully created worktree, and does not try another launcher or roll back Git creation.
- When post-create launch runs inside a cmux-managed terminal, Arashi creates and focuses a cmux workspace rooted at the new primary worktree. This requires cmux v0.64.18 or newer and local socket access.
- If cmux launch fails after worktree creation, the created worktrees remain available and Arashi reports the launch failure without falling back to standalone Ghostty.
- An active tmux session nested inside cmux keeps the existing tmux/sesh launch behavior.
- In an automatically detected Kitty 0.43+ context, post-create launch uses the same managed Kitty reuse-or-launch flow as `aw switch`. If remote control, focus, launch, or validation fails after creation, the created worktrees remain available and Arashi reports `LAUNCH_FAILED` without another launcher or Git rollback. See the [Kitty workflow guide](/workflows/kitty/) for setup and ownership boundaries.
- JSON mode is intended for non-interactive automation. `create --json --tmux` returns exactly one JSON document with `JSON_UNSUPPORTED_FOR_MODE` and the existing `interactive-or-launch` mode label before worktree creation, hooks, launcher-conflict checks, or tmux-context validation. The same rejection wins for `--json --tmux --sesh` and blank `TMUX` input.
- Switch flags and defaults resolve independently from launch, but requested launch cannot be suppressed by `--no-switch`.
- Other explicit or configured launch resolving to `auto`, `sesh`, or `herdr` likewise returns one structured unsupported-mode error before worktree creation; resolved `none` may continue. Legacy migration warnings remain on stderr rather than contaminating JSON stdout.
- JSON results include structured managed ignore details and final changed/restored state without mixing human reconciliation output into stdout.
- When the source workspace has uncommitted changes, create output includes guidance for moving compatible changes with [`aw move`](/commands/move/). In JSON mode, that guidance is returned as structured data instead of human text.

## Agent Notes

- Check `aw status` and `aw list` before creating a branch so you do not duplicate an existing coordinated worktree.
- Use `--no-launch --no-switch` for unattended agent runs unless the user explicitly wants an editor or shell session opened.
- Prefer `--json` with explicit non-interactive flags when automation needs to verify created worktree paths.
- Use `--interactive` when a task only needs some child repositories; the parent worktree is still present, so shared metadata and coordination remain available.
- Prefer `--group <group>` over a long `--only` list when a known semantic group matches the task scope.
- Treat managed ignore warnings as actionable workspace state; do not compensate by writing global Git configuration.

## Related Commands

- [status](/commands/status/)
- [remove](/commands/remove/)
- [Config workflow](/workflows/config/)
- [Herdr workflow guide](/workflows/herdr/)
- [cmux workflow guide](/workflows/cmux/)
- [Kitty workflow guide](/workflows/kitty/)
- [launch disposition workflow](/workflows/launch-disposition/)
