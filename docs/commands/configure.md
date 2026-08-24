---
title: configure Command
description: Inspect and edit supported settings in an existing Arashi workspace.
draft: false
sidebar:
  hidden: false
---

## What It's For

Inspect supported workspace configuration and make a confirmed interactive change to an existing configured workspace.

## What It Does

- Shows configured values separately from inherited or built-in effective values.
- Lets you keep, edit, or clear fields from Arashi's finite supported setting set.
- Reuses the active repository and lifecycle-hook configuration workflow without exposing arbitrary schema fields.
- Previews the exact canonical JSON that will be saved and any separate active-file plan before confirmation.

## Usage

```bash
aw configure
aw configure --json
```

Interactive editing requires both terminal input and output. A non-TTY human invocation fails before prompting or mutation.

`aw configure --json` is inspection only: it never prompts or writes configuration. It returns one sanitized machine-readable result document, including for failures.

## Examples

```bash
# Inspect settings and choose a supported field to edit
aw configure

# Inspect configured and effective state from automation
aw configure --json
```

## Notes

- `configure` requires an existing valid configured workspace. It does not initialize, migrate, or repair configuration.
- Keep and semantic no-op choices do not rewrite `.arashi/config.json`.
- Existing active native hook files are external state and are never overwritten, imported, converted, or deleted.
- Repository identity fields such as `repos.<name>.path` and `repos.<name>.gitUrl` remain owned by repository onboarding and are not editable here.
- The initial `worktreeNaming` slice is authored directly in `.arashi/config.json`; interactive `aw configure` does not edit it.
- For the complete supported field list, keep/edit/clear semantics, preview boundaries, and hook-body disclosure rules, see the [Config workflow](/workflows/config/#inspect-and-change-supported-settings).

## Related Commands

- [init](/commands/init/)
- [add](/commands/add/)
- [doctor](/commands/doctor/)
- [Config workflow](/workflows/config/)
- [JSON Automation](/workflows/json-automation/)
