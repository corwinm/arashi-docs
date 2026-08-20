---
title: Hooks
description: Automate setup and cleanup with scope-correct create and remove lifecycle hooks.
draft: false
sidebar:
  hidden: false
  order: 3
---

Use lifecycle hooks for trusted setup and cleanup around `aw create` and `aw remove`. Use short reviewable inline commands; put substantial or reusable logic in native files. Standalone hooks remain native files only, as do user-global hooks.

## Inline configured hooks

Workspace owners configure `hooks.scripts.<lifecycle>`, while repository owners configure `repos.<name>.hooks.<lifecycle>`. The four lifecycle keys are `pre-create`, `post-create`, `pre-remove`, and `post-remove`. A string is Bash shorthand; use a closed interpreter map with one or more of `bash`, `powershell`, and `cmd` when the same hook needs native variants:

```json
{
  "hooks": {
    "scripts": {
      "pre-create": "printf 'Starting create\n'",
      "post-remove": {
        "bash": "test -n \"$ARASHI_HOOK_TARGET_REPOSITORY\" && printf 'Removed %s\n' \"$ARASHI_HOOK_TARGET_REPOSITORY\"",
        "powershell": "if (-not $env:ARASHI_HOOK_TARGET_REPOSITORY) { exit 1 }; Write-Output \"Removed $env:ARASHI_HOOK_TARGET_REPOSITORY\"",
        "cmd": "if not defined ARASHI_HOOK_TARGET_REPOSITORY exit /b 1 & echo Removed %ARASHI_HOOK_TARGET_REPOSITORY%"
      }
    }
  },
  "repos": {
    "web": {
      "path": "repos/web",
      "hooks": {
        "pre-create": "test -f package.json",
        "post-create": "corepack pnpm install --frozen-lockfile"
      }
    }
  }
}
```

Inline sources occupy the same lifecycle locations as native files; they are alternatives, not extra hooks. If inline and file sources claim the same logical location, Arashi reports an inline/file ambiguity and runs neither. Different scopes still compose in the lifecycle order below.

Inline snippets are non-portable unless compatible interpreter variants are supplied. Interpreter selection is deterministic rather than terminal-dependent. On POSIX, Arashi uses configured Bash and scans non-empty `PATH` entries in order for the first executable `bash`. On Windows, it tries configured PowerShell, then cmd, then Bash. `SystemRoot` supplies the fixed PowerShell and cmd paths, while `PATH` order selects `bash.exe`. If no configured compatible executable is found, the hook fails preflight as `interpreter_unavailable` before lifecycle mutation.

Keep inline commands fail-fast so a later success does not mask an earlier failure. Inline snippets must not contain secrets, tokens, or passwords: configuration is shared and outcomes, previews, diagnostics, and logs do not reveal snippet or command text.

## Add-onboarding active scripts

Optional `aw add` onboarding offers exactly one source per selected repository lifecycle: a user-supplied inline command or an editable active native script. Create scripts belong to the active configuration root at `.arashi/hooks/<lifecycle>.<repo><ext>`. Remove scripts belong to the runtime-resolved configured target repository at `.arashi/hooks/<lifecycle><ext>`; linked remove uses the active child worktree, not the canonical clone.

Generated scaffolds are safe silent no-ops. POSIX creates one executable `.sh` with mode `0755`; Windows creates one `.ps1` that is runtime-ready under the normal executor. These are active canonical files, not `.example` files: no rename/chmod activation is required, and Arashi never overwrites an existing active script. Edit an installed script in place to add behavior.

The final sanitized summary never includes inline bodies, generated contents, or partial command text. It reports only lifecycle/interpreter presence for inline choices and lifecycle/path/executable state for file choices. The [add command](/commands/add/#optional-repository-setup) owns prompt eligibility, confirmation, and rollback; the discovery matrix below owns runtime lookup.

## Lifecycle matrix

| Mode and lifecycle | Discovery and multiplicity | Timing | Working directory | Failure behavior |
| --- | --- | --- | --- | --- |
| Configured workspace `pre-create` | Inline `hooks.scripts.pre-create` or native `.arashi/hooks/pre-create<ext>`, one source once | Before branch or worktree mutation | Configured workspace root | Create fails before mutation. |
| Configured repository `pre-create.<repo>` | Inline `repos.<repo>.hooks.pre-create` or native `.arashi/hooks/pre-create.<repo><ext>`, one source once for that selected repository | After that Git worktree is created and before configured file materialization/setup | New child worktree | Create fails and rolls back Git mutations owned by this invocation. |
| Configured repository `post-create.<repo>` | Inline `repos.<repo>.hooks.post-create` or native `.arashi/hooks/post-create.<repo><ext>`, one source once for that selected repository | After its repository pre hook | New child worktree | Create fails and enters the same rollback boundary. |
| Configured workspace `post-create` | Inline `hooks.scripts.post-create` or native `.arashi/hooks/post-create<ext>`, one source once | After coordinated Git creation and before move-changes or switch/launch handling | Configured workspace root | Create fails and enters the same rollback boundary. |
| Configured `pre-remove` | Repository, workspace, global-targeted, then global-shared for each target | Before destructive removal | Scope-dependent; see below | Any failure or timeout aborts removal. |
| Configured `post-remove` | Repository → workspace → global-targeted → global-shared for each target | After removal attempts, including partial failures | Scope-dependent; see below | Outcomes are retained and the command exits nonzero on hook failure. |
| Standalone create/remove | User-global targeted before shared, once at each applicable location | At the matching pre/post lifecycle point | Resolved standalone main root | Create uses rollback; remove preserves pre-abort and post-finalization behavior. |

For configured remove, all four scopes are evaluated separately for every target repository. Workspace and global-shared hooks therefore run once per target repository, not once per command. Repository-local, global-targeted, and global-shared remove hooks run from the current target's configured source checkout; workspace hooks run from the configured workspace root.

Create and remove results retain evaluated hook outcomes, including skips, successes, validation failures, timeouts, and nonzero exits. Human output and JSON output derive from that outcome ledger. Configured-create human output summarizes the ledger with succeeded, skipped, and failed counts, collapses routine success and skip rows, and prints attributed detail blocks for failures. Nonzero hook stdout and stderr remain on their original streams instead of being duplicated into the summary. JSON success places every outcome in `data.hookOutcomes`; failure places every evaluated fail-fast outcome in `error.details.hookOutcomes`, while hook stdout and stderr stay off JSON stdout.

Public results describe a configured source with `sourceKind: "inline-config"`, `sourceOwnerKind`, and `sourceOwnerName`; `sourceScriptPath` is null because an inline source has no file path. `remove --dry-run` provides source-aware hook previews with source kind and source owner metadata but never executes a hook. Configured-create dry-run performs no hook discovery, returns an empty hook ledger, and has no hook preview.

## Terminal input policy

Every executed create or remove hook receives `ARASHI_HOOK_INPUT` with the command-wide input mode:

| Invocation | `ARASHI_HOOK_INPUT` | Hook stdin |
| --- | --- | --- |
| Human command with terminal stdin | `tty` | Inherits the terminal. |
| `--no-hook-input` | `disabled` | Immediate EOF. |
| `--json` | `disabled` | Immediate EOF, even when stdin is a TTY. JSON always takes precedence. |
| Non-TTY or CI invocation | `unavailable` | Immediate EOF rather than an open pipe. |
| Dry-run | Not reported | Hooks do not execute and no input channel is created. |

`--no-hook-input` is shared by create and remove as an invocation-only option. It disables only lifecycle-hook stdin: it does not skip hooks or change their order. `--no-hooks` is create-only and skips configured create hooks; remove does not have that option. On create, `--interactive` still controls repository selection. There is no persistent configuration setting for hook input in this release.

Before a `tty` hook can read, Arashi prints a completed attribution banner with the lifecycle, scope, and source attribution: inline hooks identify their source kind and owner, while native file hooks identify the absolute script path. The banner also names the applicable workspace or target repository/worktree. Workspace hooks do not borrow a child target. Hooks continue to run sequentially across lifecycle points, scopes, and targets, so two hooks never compete for terminal input.

Interactive hook stdout and stderr are streamed immediately to their corresponding terminal streams without adding a prefix or newline. An unterminated prompt is therefore visible before the hook reads. Arashi captures each stream internally without normalizing blank lines or trailing newlines, but does not add those streams to the public hook outcome schema. JSON and other quiet execution remain capture-only, with no prompt text or attribution on stdout.

Waiting for input remains inside the configured hook timeout. A timeout, nonzero exit, signal, or Ctrl-C follows the same create rollback or remove gate/finalization boundary as any other hook failure. Arashi stops the current hook before continuing and restores the parent terminal for subsequent use.

### Native shell prompts

Use the shell's native read primitive only after checking for `tty`. These examples deliberately skip their question when input is disabled or unavailable.

```bash
#!/usr/bin/env bash
set -eu

[ "${ARASHI_HOOK_INPUT:-unavailable}" = "tty" ] || exit 0
printf "Continue setup? [y/N] "
IFS= read -r answer
[ "$answer" = "y" ]
```

```powershell
if ($env:ARASHI_HOOK_INPUT -ne "tty") { exit 0 }
$answer = Read-Host "Continue setup? [y/N]"
if ($answer -ne "y") { exit 1 }
```

```bat
@echo off
if /I not "%ARASHI_HOOK_INPUT%"=="tty" exit /b 0
set "answer="
set /p "answer=Continue setup? [y/N] "
if /I not "%answer%"=="y" exit /b 1
```

Lifecycle hooks are trusted executable programs, but prompt answers are not a secret-storage channel. Do not enter passwords, tokens, or other secrets into hook prompts, and do not write hooks that persist answers as credentials.

## Discovery by mode and platform

Configured create discovers either inline configuration or native files as alternatives at the workspace and repository-specific logical locations shown above. It does not activate similarly named repository-local or user-global create scripts.

Configured remove searches each target in this order:

1. `repos/<repo>/.arashi/hooks/<lifecycle><ext>`
2. `.arashi/hooks/<lifecycle><ext>`
3. `~/.arashi/hooks/<repo>/<lifecycle><ext>`
4. `~/.arashi/hooks/<lifecycle><ext>`

Standalone create and remove search only the repository-targeted and shared user-global locations. Targeted lookup uses the resolved main-root basename even when the command starts in a linked worktree. Configless repository-local and workspace hooks remain inactive; adopt configured mode when you need those scopes.

On POSIX, `<ext>` is `.sh`. On Windows, extension matching is case-insensitive and `<ext>` is `.ps1`, `.cmd`, or `.bat`. Windows does not discover `.sh` or execute it through implicit Git Bash. If a logical location has more than one extension supported by the current platform, Arashi reports every candidate and fails before lifecycle mutation rather than choosing by extension or filesystem order. Missing native interpreters likewise fail preflight before mutation.

## Activate exactly one example

Examples created by `aw init` are inert. Activate only the lifecycle and scope you intend.

On POSIX, create the active script and its executable mode in one step:

```bash
install -m 755 .arashi/hooks/post-create.web.sh.example \
  .arashi/hooks/post-create.web.sh
```

On Windows PowerShell, choose one native example and copy it one-to-one:

```powershell
Copy-Item .arashi\hooks\post-create.web.ps1.example `
  .arashi\hooks\post-create.web.ps1
```

For a command script, activate the matching `.cmd.example` or `.bat.example` as that same extension. Do not copy multiple examples to one active filename.

Setup is a separate command contract, not a lifecycle hook. On POSIX, activate the generated setup example as follows:

```bash
install -m 755 .arashi/setup.sh.example .arashi/setup.sh
```

`aw setup` runs the script from its documented setup cwd; do not rely on lifecycle-hook variables there. This change does not introduce a native Windows setup example, and lifecycle setup never requires changing Git `core.hooksPath`.

## Environment contract

Every executed lifecycle hook receives common executor-owned metadata where applicable:

| Variable | Meaning |
| --- | --- |
| `ARASHI_HOOK_NAME` | Logical discovered name, including the repository suffix for configured repository-specific create. |
| `ARASHI_HOOK_SCOPE` | `workspace`, `repository`, `global-repository`, or `global-shared`. |
| `ARASHI_HOOK_SOURCE_PATH` | Exact absolute discovered script path for a native file; omitted for an inline source. |
| `ARASHI_HOOK_EXECUTION_PATH` | Exact absolute process cwd. |
| `ARASHI_HOOK_WORKSPACE_MODE` | `configured` or `standalone`. |
| `ARASHI_MAIN_REPO_PATH` | Canonical configured workspace root or standalone main root. |
| `ARASHI_BRANCH_NAME` | Requested create branch, or the current remove repository's branch when exactly one is unambiguous. |
| `ARASHI_HOOK_TARGET_REPOSITORY` | Current target repository identity when the invocation has one. |
| `ARASHI_HOOK_TARGET_REPO_PATH` | Configured source checkout or standalone main root for that target. |
| `ARASHI_HOOK_TARGET_WORKTREE_PATH` | Target worktree when exactly one applies. |
| `ARASHI_PARENT_REPO_PATH` | Coordinated parent worktree, only for configured repository-specific create. |

Operation data cannot overwrite these executor-owned fields. Workspace create hooks have workspace and branch context but no child target fields, no target worktree, and no child repository identity. Do not branch a workspace create script on an invented first child.

### Target and compatibility mapping

| Mode and scope | Execution path | Explicit target repo path | Explicit target worktree | Compatibility behavior |
| --- | --- | --- | --- | --- |
| Configured workspace create | Workspace root | Unset | Unset | Historical repository path is the workspace root; repository name and worktree aliases are unset. |
| Configured repository-specific create | New child worktree | Child source checkout | New child worktree | Historical repository name is the child name; historical repository and worktree paths are the new child worktree. |
| Configured remove, any scope, one target | Child source checkout, except workspace scope uses workspace root | Child source checkout | Target worktree when exactly one | Historical repository name/path identify the child source checkout; historical worktree path is set only when unambiguous. |
| Standalone global create/remove | Standalone main root | Standalone main root | Lifecycle target worktree when exactly one | Historical repository name is the main-root basename and historical paths retain their standalone meanings. |

The historical repository/worktree aliases and comma-separated remove aggregates remain supported throughout 1.x. Removal can occur no earlier than 2.0 through a separately approved breaking-change proposal. New portable hooks should use the explicit execution and target fields above.

### Structured remove targets

Every remove hook receives `ARASHI_REMOVE_TARGETS_JSON`, an array of records with this exact shape:

```json
[
  {
    "repository": "web",
    "branchName": "feature/auth",
    "worktreePath": "/workspace/worktrees/web/feature/auth"
  }
]
```

Keys are always present; absent branch or worktree values are JSON `null`. Paths are absolute, lexically normalized, and use `/` separators on every platform. Exact duplicate records are removed and ordering is deterministic. Per-target scalar fields come only from the current repository and are omitted when multiple values are ambiguous.

The named comma-separated remove compatibility aggregates are lossy and non-canonical because valid names and paths may contain commas. New command-wide cleanup must parse `ARASHI_REMOVE_TARGETS_JSON` instead.

## Timeout and failures

Configured create, configured remove, and standalone lifecycle hooks use a default timeout of `300000` milliseconds. Configured workspaces may set `hooks.timeout` to an integer from `1` through `2147483647`; the override applies to every configured lifecycle scope.

Zero, negative, fractional, non-numeric, and out-of-range values fail configuration validation before hook discovery or lifecycle mutation. A timeout remains a timeout outcome even when another hook or removal operation also fails.

Pre-create and pre-remove failures happen before their applicable mutation boundary. Post-create failure rolls back Git mutations owned by that create invocation and reports any rollback warning. Post-remove runs after attempted removals, preserves removal errors alongside all hook outcomes, and finalizes with a nonzero result when required. `remove --dry-run` discovers and previews hooks but never spawns them or fabricates execution outcomes.

## Scope-correct setup examples

Repository-specific post-create hooks already run in the new child worktree, but checking the explicit target makes the assumption clear and fail-fast:

```bash
#!/bin/sh
set -eu

[ "$PWD" = "$ARASHI_HOOK_TARGET_WORKTREE_PATH" ] || exit 1
```

### Node and pnpm

Follow the repository's committed `packageManager` and lockfile; do not infer npm merely from the presence of `package.json`. For a pnpm child nested beneath another pnpm workspace, use the pinned Corepack version and prevent ancestor-workspace selection:

```bash
#!/bin/sh
set -eu

[ "$PWD" = "$ARASHI_HOOK_TARGET_WORKTREE_PATH" ] || exit 1
CI=true corepack pnpm --ignore-workspace install --frozen-lockfile
```

PowerShell uses its native environment assignment:

```powershell
if ($PWD.Path -ne $env:ARASHI_HOOK_TARGET_WORKTREE_PATH) { exit 1 }
$env:CI = "true"
corepack pnpm --ignore-workspace install --frozen-lockfile
```

Command scripts use their own assignment form:

```bat
@echo off
if /I not "%CD%"=="%ARASHI_HOOK_TARGET_WORKTREE_PATH%" exit /b 1
set "CI=true"
corepack pnpm --ignore-workspace install --frozen-lockfile
```

For npm, Yarn, or Bun, use the package manager named by committed provenance and its lockfile-preserving install command.

### Python

Bind pip to the activated interpreter rather than relying on a separate `pip` executable:

```bash
#!/bin/sh
set -eu

[ "$PWD" = "$ARASHI_HOOK_TARGET_WORKTREE_PATH" ] || exit 1
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
```

## Suggested setup sequence

1. Confirm lifecycle timing and choose the narrowest required scope.
2. Activate exactly one inert example using the platform-native extension.
3. Use explicit target fields for target-specific work and structured JSON for aggregate remove cleanup.
4. Keep scripts fail-fast and idempotent; workspace and shared remove hooks can run repeatedly across targets.
5. Run with `--dry-run` where supported, then inspect human or JSON hook outcomes.

Herdr workspaces can contain agents or unsaved terminal state, so `aw remove` never closes them automatically. If your team deliberately opts into cleanup, resolve the workspace while the target still exists and call only `herdr workspace close <workspace-id>`. Never use Git-mutating `herdr worktree remove`; see the [Herdr workflow guide](/workflows/herdr/#optional-cleanup-before-remove).

## Related references

- [create command](/commands/create/)
- [remove command](/commands/remove/)
- [init command](/commands/init/)
- [Config workflow guide](/workflows/config/)
- [Standalone workflow guide](/workflows/standalone/)
- [Herdr workflow guide](/workflows/herdr/)
- [Full hooks reference](https://github.com/corwinm/arashi/blob/main/docs/hooks.md)
