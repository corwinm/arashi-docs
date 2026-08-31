---
title: Scripts and CI
description: Parse Arashi safely in scripts and CI.
draft: false
sidebar:
  hidden: false
  order: 6
---

Use `--json` (or `-j`) for machine-readable output.

## Start read-only

```bash
aw doctor --json
aw status --json
aw list --json
```

Add mutations only after inspection works.

## Parse the envelope

- stdout contains exactly one JSON document followed by a newline.
- Check the process exit status and the envelope's `ok` field.
- Branch on `error.code`, not `message`.
- Read needed fields and ignore unknown fields.

```json
{
  "ok": true,
  "command": "status",
  "schemaVersion": 1,
  "data": {},
  "warnings": []
}
```

Do not parse human prose from stderr as an API.

## Be explicit

Use selectors for mutating or expensive work:

```bash
aw exec --only arashi-docs --json -- pnpm validate
```

Pass non-interactive options when a command might prompt, change the parent shell, or launch an application. JSON mode gives hooks immediate EOF. Use `--no-hook-input` for the same behavior outside JSON mode.

See the [command reference](/commands/) for supported JSON modes, command data, warnings, and errors.

## Related

- [Coding Agents](/workflows/agents-and-specs/)
- [Coordinate Repositories](/workflows/coordinate-repositories/)
- [Lifecycle Hooks](/reference/hooks/)
