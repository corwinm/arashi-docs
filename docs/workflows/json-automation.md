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

## Command Support Matrix

| Command | JSON support | Notes |
| --- | --- | --- |
| `add` | Supported | Adds repository configuration and returns a structured result. |
| `clone` | Supported with `--all` | `arashi clone --json` requires `--all`; interactive selection is not JSON-compatible. |
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
| `update` | Supported for check and preview flows | Use `--check --json` or `--dry-run --json`. Applying an installer update with `--yes --json` returns an unsupported-mode error. |

## Stable Unsupported Modes

Some commands exist to prompt, launch tools, print shell code, or change the parent shell. Those modes are intentionally not JSON-compatible. When JSON mode is available for an unsupported flow, Arashi returns a structured failure with:

- `ok: false`
- `error.code: "JSON_UNSUPPORTED_FOR_MODE"`
- `error.details.mode` naming the unsupported flow, such as `interactive-selection`, `shell-code`, `terminal-launch`, or `installer-apply`

Automation should respond by passing a non-interactive flag, choosing a different command, or falling back to human output for that workflow.

## Agent Guidance

Agents should prefer this sequence:

```bash
arashi doctor --json
arashi status --json
arashi list --json
```

Then choose targeted commands based on the task:

```bash
arashi exec --only arashi-docs --json -- pnpm validate
arashi pull --group docs --json
arashi create docs/update-reference --no-launch --no-switch --json
arashi remove docs/update-reference --dry-run --json
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
