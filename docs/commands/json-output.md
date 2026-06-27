---
title: JSON Output
description: Machine-readable Arashi command output for scripts, integrations, and agents.
draft: false
sidebar:
  hidden: false
---

Use `--json` when another program, integration, or agent needs to inspect Arashi command results. Human-readable output remains the default.

## Envelope

Commands that support JSON mode write exactly one JSON document to stdout.

Successful commands use this shape:

```json
{
  "ok": true,
  "command": "status",
  "schemaVersion": 1,
  "data": {},
  "warnings": []
}
```

Command-level failures after option parsing use the same metadata plus an `error` object and a non-zero exit code:

```json
{
  "ok": false,
  "command": "create",
  "schemaVersion": 1,
  "error": {
    "code": "WORKTREE_EXISTS",
    "message": "Worktree already exists",
    "details": {}
  },
  "warnings": []
}
```

Parse stdout as the result channel. Do not scrape human-readable progress messages.

## Stdout and Stderr Contract

- stdout contains the final JSON document only.
- Progress, spinners, prompts, colors, tables, and banners are suppressed, captured in JSON fields, or emitted to stderr only when documented as diagnostics.
- `--json --verbose` still keeps stdout parseable as one JSON document; diagnostics, if any, go to stderr or structured fields.
- Errors that happen before Arashi parses command options, such as an unknown top-level command, may still use Commander or runtime text output instead of the JSON envelope.

## Non-Interactive Behavior

JSON mode does not prompt. If a command needs a selection, confirmation, or other interactive input, pass explicit arguments or flags.

When required input is missing, the command exits non-zero with `ok: false` and a structured code such as `INTERACTIVE_INPUT_REQUIRED` or a more specific command error. Inspect `error.details` for retry information.

## Command Support Matrix

| Command or mode | JSON behavior |
| --- | --- |
| `add --json` | Supported. Returns repository registration results under `data`. |
| `clone --json` | Supported for non-interactive clone runs such as explicit or all-repository selection. |
| `create --json` | Supported for worktree creation results when the run does not request an unsupported launch mode. |
| `init --json` | Supported for non-interactive initialization results. |
| `list --json` | Supported. Returns structured worktree listing data. |
| `pull --json` | Supported. Returns pull results under `data`. |
| `remove --json` | Supported. Returns removal summary data. |
| `setup --json` | Supported. Returns setup execution results under `data`. |
| `status --json` | Supported. Returns repository status data under `data`. |
| `sync --json` | Supported. Returns sync results under `data`. |
| `update --json` | Supported for check, dry-run, and supported non-interactive update flows. |
| `switch --json` with editor, terminal, tmux, sesh, or `--cd` launch behavior | Unsupported unless the command returns a safe non-mutating plan. Otherwise returns `JSON_UNSUPPORTED_FOR_MODE`. |
| `create --json --launch` and launch defaults that would open another app/session | Unsupported unless the command returns a safe non-mutating plan. Otherwise returns `JSON_UNSUPPORTED_FOR_MODE`. |
| `shell init --json` and other shell-code emission modes | Unsupported because stdout is normally shell integration code. Returns `JSON_UNSUPPORTED_FOR_MODE` instead of mixing shell code with JSON. |
| Interactive selection or confirmation without explicit inputs | Unsupported in JSON mode. Returns a structured non-interactive error instead of prompting. |

## Unsupported Mode Errors

Unsupported modes still use the JSON failure envelope when Arashi can parse the command options:

```json
{
  "ok": false,
  "command": "switch",
  "schemaVersion": 1,
  "error": {
    "code": "JSON_UNSUPPORTED_FOR_MODE",
    "message": "JSON output is not supported for this mode",
    "details": {
      "mode": "launch"
    }
  },
  "warnings": []
}
```

Automation should treat `JSON_UNSUPPORTED_FOR_MODE` as a deterministic refusal. Retry with a non-launching or non-interactive mode when available, or run the command without `--json` only when a human-facing action is intended.

## Examples

```bash
# Parse repository state without scraping text
arashi status --json | jq '.data'

# Count known worktrees
arashi list --json | jq '.data.worktrees | length'

# Handle structured failures
if ! result="$(arashi create feature-auth --json)"; then
  code="$(printf '%s' "$result" | jq -r '.error.code // "UNKNOWN"')"
  printf 'arashi create failed: %s\n' "$code" >&2
  exit 1
fi
```

## Related Commands

- [list](/commands/list/)
- [status](/commands/status/)
- [create](/commands/create/)
- [switch](/commands/switch/)
- [shell](/commands/shell/)
