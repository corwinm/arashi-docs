---
title: Use Arashi from Scripts and CI
description: Parse Arashi safely in agents, scripts, and continuous integration jobs.
draft: false
sidebar:
  hidden: false
  order: 6
---

Use `--json` (or `-j`) when a script or CI job needs to parse Arashi output.

## Start with read-only inspection

```bash
aw doctor --json
aw status --json
aw list --json
```

Start automation with inspection, then add the narrowest mutating command and repository selector needed by the job.

## Parse the stable envelope

- stdout contains exactly one JSON document followed by a newline.
- Human progress, tables, colors, spinners, and prompts stay off stdout.
- Check both the process exit status and the envelope's `ok` field.
- Branch on `error.code`, not the human-readable `message`.
- Read the fields you need and ignore unknown fields for forward compatibility.

A successful envelope has this common shape:

```json
{
  "ok": true,
  "command": "status",
  "schemaVersion": 1,
  "data": {},
  "warnings": []
}
```

Failures use `ok: false` with a structured `error` object. stderr remains available for child-command diagnostics and unexpected runtime failures; do not parse human prose from stderr as an API.

## Make selection and interaction explicit

Pass `--only` or `--group` for mutating, network-heavy, or expensive work unless the job intentionally targets every repository:

```bash
aw exec --only arashi-docs --json -- pnpm validate
```

Pass non-interactive options whenever a command would otherwise prompt, change the parent shell, or launch another application. Interactive-only or external-launch flows return a structured unsupported-mode error rather than prompting in JSON mode.

## Preserve hook input safety

JSON execution gives lifecycle hooks immediate EOF and reports disabled hook input. Use `--no-hook-input` for non-JSON automation that must also prevent hooks from reading stdin. Disabling input does not skip hooks or change their order.

## Use command-specific contracts

The common envelope does not replace each command's data contract. Use the relevant [command reference](/commands/) for supported JSON modes, command-specific `data`, warnings, and error codes.

## Related guides

- [Work with Coding Agents](/workflows/agents-and-specs/)
- [Coordinate a Change Across Repositories](/workflows/coordinate-repositories/)
- [Lifecycle Hooks](/reference/hooks/)
