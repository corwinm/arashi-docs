---
title: JSON Automation
description: Arashi's machine-readable output contract, error envelope shape, and command support matrix.
draft: false
sidebar:
  hidden: false
  order: 8
---

Use this reference when you are writing scripts, coding agents, CI checks, or integrations that need stable Arashi command output. Prefer command-specific pages for human workflow examples; use this page for the cross-command JSON contract.

## When To Use JSON Output

Use `--json` when a tool needs to parse Arashi output or make decisions from it. JSON mode is designed for automation:

- stdout contains one parseable JSON document and a trailing newline
- human progress, spinners, prompts, colors, and tables are suppressed from stdout
- stderr remains available for diagnostics from child commands or unexpected failures
- interactive-only modes fail fast with a structured error instead of prompting

Use human output when a person is reading the result directly, especially for exploratory `status`, `doctor`, or `exec` runs where tables and grouped summaries are easier to scan.

Every command that supports `--json` also accepts `-j` through the same validation and execution path. For example, `status -o arashi-docs -j` narrows configured child inspection and emits the same single envelope as the long options.

## Envelope Shape

JSON-capable commands write a single envelope to stdout.

```json
{
  "ok": true,
  "command": "status",
  "schemaVersion": 1,
  "data": {
    "summary": {
      "total": 5,
      "clean": 5,
      "dirty": 0
    },
    "repositories": []
  },
  "warnings": []
}
```

The common fields are:

| Field | Meaning |
| --- | --- |
| `ok` | `true` for command success, `false` for command-level failure. |
| `command` | The Arashi command that produced the envelope. |
| `schemaVersion` | Version of the envelope contract. Treat new fields as additive unless a future schema version says otherwise. |
| `data` | Command-specific result payload. See each command page for examples. |
| `warnings` | Non-fatal warnings an agent or script should surface without treating the command as failed. |
| `error` | Present when `ok` is `false`; contains structured failure details. |

Command-specific `data` payloads may evolve as commands gain more diagnostics, filters, or result details. Consumers should read the fields they need and ignore unknown fields.

## Create base results

When configured `create` or `clone` resolves shared or overridden bases, machine-readable output includes ordered per-repository base-policy records. `requestedBranch` removes at most one leading `origin/`, and each `source` is exactly `repository-cli`, `cli`, `repository-config`, `workspace-config`, or `legacy-omitted`. Optional policy fields remain absent when every selected repository uses legacy omitted behavior.

For create, `data.base.repositories` is the complete effective selected set—including the configured meta repository and selected children—in selected-set order; it is never re-sorted lexically or alphabetically. Every entry uses `repositoryName` and `repositoryPath` (a canonical absolute path with symlinks resolved). Entries with an effective requested base also include `resolvedRef`, captured `resolvedOid`, and `targetAction` (`created` or `reused`); legacy-omitted entries omit resolved ref/OID fields and `targetAction` because no base resolution or create/reuse action occurred. Clone reports its ordered effective policy at `data.base`; each selected record names its repository, normalized requested branch when one applies, and stable source.

If create resolution fails, `error.code` is `CREATE_BASE_RESOLUTION_FAILED`. The `error.details.repositories` collection contains affected repositories only, preserving selected-set order; unaffected selected repositories are omitted. Every failure includes `repositoryName` and `repositoryPath`. For every failure, `attemptedRefs` is exactly the ordered pair `refs/heads/<normalized>`, `refs/remotes/origin/<normalized>`. Resolution finishes for the complete filtered set before hooks or mutation.

Selector failures use `BASE_BRANCH_POLICY_INVALID` and list issues under `error.details.issues`. Create resolution failures include `attemptedRefs` but no resolved ref/OID: `CREATE_BASE_RESOLUTION_FAILED` records the affected repository identity/path, requested branch, source, and the exact local/origin ref pair that could not resolve. Clone preflight failures include `gitUrl` and `reason` but no resolved ref/OID or attempted refs: `CLONE_BASE_PREFLIGHT_FAILED` records each affected child’s name, requested branch, source, configured URL, and failure reason. In JSON mode, stdout remains exactly one JSON document and human diagnostics never contaminate it; consume the command-specific schema rather than parsing prose.

## Managed Ignore Results

When reconciliation is performed, JSON-capable configured lifecycle commands (`init`, `pull`, `clone`, `add`, and `create`) include a `managedIgnore` result. A no-op or cancelled path that returns before reconciliation may omit this optional field. When present, use it to understand the effective scope, stored preference, normalized managed paths, effective source and matched rule, planned or applied changes, warnings, unsafe skips, and tracked or local file state.

Do not assume that the selected scope implies a write. An existing effective rule from a tracked file, repository-local exclude, or global excludes file wins and is reported unchanged. Scope `none` reports an unignored safe path as a structured warning. A dry-run reports planned changes without modifying ignore files or clone-local preference state.

For failures, inspect the reconciliation details instead of inferring final state from the exit code. Results distinguish whether a change was attempted, whether it was restored, and whether the final observed state is changed. Partial success may retain a rule required by a surviving repository, worktree, or pulled configuration. A restoration failure reports both the original and rollback failures.

`doctor --json` uses its existing findings array rather than `managedIgnore`. Managed-ignore findings keep the stable diagnostic fields and add path, source or stored-preference details, plus suggested repair commands.

## Success Example

```json
{
  "ok": true,
  "command": "pull",
  "schemaVersion": 1,
  "data": {
    "results": [
      {
        "repository": "arashi-docs",
        "status": "updated",
        "durationMs": 812
      },
      {
        "repository": "arashi",
        "status": "skipped",
        "durationMs": 96
      }
    ],
    "summary": {
      "total": 2,
      "updated": 1,
      "skipped": 1,
      "failed": 0,
      "overall": "success"
    }
  },
  "warnings": []
}
```

For batch commands such as `pull`, `sync`, `setup`, and `exec`, inspect both the top-level `ok` field and the per-repository results. A command can complete while still reporting skipped repositories or warnings that matter to your workflow.

## Error Example

```json
{
  "ok": false,
  "command": "remove",
  "schemaVersion": 1,
  "error": {
    "code": "JSON_UNSUPPORTED_FOR_MODE",
    "message": "JSON output is not supported for interactive-selection.",
    "details": {
      "mode": "interactive-selection"
    }
  },
  "warnings": []
}
```

Prefer branching on `error.code` instead of parsing `message`. Messages are written for humans; codes and details are the stable automation surface.

## Stdout And Stderr Guarantees

In JSON mode:

- parse stdout as exactly one JSON document
- do not expect banners, tables, spinners, progress lines, prompts, or shell snippets on stdout
- treat a non-zero process exit plus `ok: false` as a command-level failure
- keep stderr for diagnostics, child command output, or unexpected runtime errors
- pass explicit flags such as `--all`, `--only`, `--group`, `--no-launch`, or `--no-switch` when a command would otherwise ask a question or launch an external tool

If stdout contains human text in JSON mode, that is a bug because it breaks tool consumers.

### Lifecycle hook input

For configured and standalone `create` and `remove`, JSON always sets `ARASHI_HOOK_INPUT=disabled` and gives every executed hook immediate EOF, even when stdin is a TTY. Hooks still execute and can fail normally; `--json` does not behave like create's `--no-hooks`. No prompt text or interactive attribution is streamed to stdout, which remains exactly one JSON document. Dry-run continues to preview hooks without spawning them or reporting an input mode as if execution occurred. See the [Hooks workflow](/workflows/hooks/#terminal-input-policy) for native-shell examples, timeout, sequential attribution, and the no-secrets boundary.

Configured inline hooks preserve the same one-document automation contract. Remove dry-run exposes source kind and source owner metadata in previews. Outcomes identify `sourceKind: "inline-config"`, `sourceOwnerKind`, and `sourceOwnerName`; `sourceScriptPath` is null or omitted because there is no file. Outcomes, previews, diagnostics, and logs never include snippet command text. Configured-create dry-run still performs no hook discovery, returns an empty hook ledger, and has no hook preview. See [Inline configured hooks](/workflows/hooks/#inline-configured-hooks) for ownership, interpreter selection, and ambiguity behavior.

## Command Support Matrix

| Command | JSON support | Notes |
| --- | --- | --- |
| `add` | Supported | Adds repository configuration and returns a structured result. |
| `clone` | Supported with `--all` | `aw clone --json` requires `--all`; interactive selection is not JSON-compatible. |
| `create` | Supported for non-interactive create operations | Use explicit flags such as `--only`, `--group`, `--no-launch`, and `--no-switch`. Interactive selection, launch, or shell switching modes are not JSON-compatible. |
| `doctor` | Supported | Best first diagnostic for agents because it is non-mutating and returns stable findings. |
| `exec` | Supported | Runs the child command after `--` and returns per-repository stdout, stderr, exit status, and summary data. |
| `init` | Supported | Use `--dry-run --json` to preview initialization without writing files. |
| `list` | Supported | Also accepts `-j`; useful for discovering coordinated worktrees. |
| `move` | Supported | Returns moved, skipped, restored, and failed repository details. |
| `pull` | Supported | Use `--only` or `--group` to limit network operations when appropriate. |
| `prune` | Supported | Pair with `--dry-run` for non-mutating stale worktree metadata inspection. |
| `remove` | Supported with an explicit target | JSON mode does not perform interactive branch selection. Use `--dry-run --json` to preview destructive worktree and branch cleanup. |
| `setup` | Supported | Use `--only` or `--group` when setup should not run everywhere. |
| `shell init` | Unsupported by design | `--json` returns `JSON_UNSUPPORTED_FOR_MODE` because normal output is shell code. |
| `shell install` | No JSON mode | Installs shell integration into a startup file. Use human output. |
| `status` | Supported | Prefer this for current repository state when `doctor` says deeper inspection is needed. |
| `switch` | Unsupported by design | `--json` returns a structured unsupported-mode error instead of opening terminals, editors, or changing the parent shell. |
| `sync` | Supported | Use `--only` or `--group` to limit branch alignment work when appropriate. |
| `update` | Supported for check and preview flows | Use `--check --json` or `--dry-run --json`. Bare `update --json` is inspection-only and never prompts or mutates. Applying an installer update with `--yes --json` returns an unsupported-mode error. |

## Stable Unsupported Modes

Some commands exist to prompt, launch tools, print shell code, or change the parent shell. Those modes are intentionally not JSON-compatible. When JSON mode is available for an unsupported flow, Arashi returns a structured failure with:

- `ok: false`
- `error.code: "JSON_UNSUPPORTED_FOR_MODE"`
- `error.details.mode` naming the unsupported flow, such as `interactive-selection`, `shell-code`, `terminal-launch`, or `installer-apply`

Automation should respond by passing a non-interactive flag, choosing a different command, or falling back to human output for that workflow.

`update --check --dry-run` (including `--check -n`) is a usage conflict before release lookup or mutation. JSON mode emits one structured error envelope; human and JSON paths enforce the same conflict before the npm wrapper or direct binary performs update work.

Tab disposition keeps the existing command-specific launch guards: `switch --json --tab` returns `JSON_UNSUPPORTED_FOR_MODE` with mode `launch` and exit status `2`; `create --json --tab` returns the same code with mode `interactive-or-launch` and exit status `1`. Both emit exactly one JSON document and reject before launch, create mutation, launcher-conflict checks, or runtime-session validation. See the [launch disposition workflow](/workflows/launch-disposition/) for the supported adapter matrix.

## Agent Guidance

Agents should prefer this sequence:

```bash
aw doctor --json
aw status --json
aw list --json
```

Then choose targeted commands based on the task:

```bash
aw exec --only arashi-docs --json -- pnpm validate
aw pull --group docs --json
aw create docs/update-reference --no-launch --no-switch --json
aw remove docs/update-reference --dry-run --json
```

For mutating, expensive, or network-heavy commands, use `--only` or `--group` unless the user explicitly asked for every managed repository.

For lifecycle commands, inspect `managedIgnore` warnings and final state. Never respond to an unignored-path warning by modifying global Git configuration; preserve explicit `tracked` or `none` clone-local preferences unless the user asks to change them.

## Command-Specific Examples

- [doctor](/commands/doctor/) for structured health findings
- [status](/commands/status/) for repository state envelopes
- [exec](/commands/exec/) for per-repository child command results
- [create](/commands/create/) for non-interactive coordinated worktree creation
- [remove](/commands/remove/) for dry-run cleanup previews and explicit target removal
- [pull](/commands/pull/) and [sync](/commands/sync/) for coordinated repository updates
- [update](/commands/update/) for check and dry-run installer flows
