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

## Supported Fields

`aw configure` edits this product-owned set rather than exposing the full schema:

- Workspace: `reposDir`, `worktreesDir`, `baseBranch`, `sync.timeoutSeconds`, and `hooks.timeout`.
- Workspace hooks: `hooks.scripts.pre-create`, `hooks.scripts.post-create`, `hooks.scripts.pre-remove`, and `hooks.scripts.post-remove`.
- Command defaults: `defaults.create.switch`, `defaults.create.launch`, and `defaults.switch.mode`.
- Editor defaults: `defaults.editors.vscode.create.switch`, `defaults.editors.vscode.create.launch`, `defaults.editors.cursor.create.switch`, `defaults.editors.cursor.create.launch`, `defaults.editors.kiro.create.switch`, and `defaults.editors.kiro.create.launch`.
- Meta repository: `meta.baseBranch`.
- Child repositories: `repos.<name>.groups`, `repos.<name>.baseBranch`, `repos.<name>.copy`, `repos.<name>.symlink`, `repos.<name>.hooks.pre-create`, `repos.<name>.hooks.post-create`, `repos.<name>.hooks.pre-remove`, and `repos.<name>.hooks.post-remove`.

Repository identity fields such as `repos.<name>.path` and `repos.<name>.gitUrl` are not editable here. Edit `.arashi/config.json` directly for other supported configuration fields.

## Editing Behavior

- **Configured** means the field is stored. **Effective** shows an inherited or built-in value without saving it.
- **Keep** preserves the stored field, **Edit** validates and replaces it, and **Clear** removes an optional stored field. Required `reposDir` cannot be cleared, and blank input does not mean Clear.
- The final preview is the exact canonical JSON that will be saved. Any active-file plan is shown separately and lists paths without file contents or inline command bodies.
- Existing active native hook files are preserved. If the JSON is unchanged and there is no active-file plan, Arashi exits without confirmation or a write.

## Notes

- `configure` requires an existing valid configured workspace. It does not initialize, migrate, or repair configuration.
- The initial `worktreeNaming` slice is authored directly in `.arashi/config.json`; interactive `aw configure` does not edit it.
- See the [Configuration reference](/reference/configuration/) for practical configuration examples.

## Related Commands

- [init](/commands/init/)
- [add](/commands/add/)
- [doctor](/commands/doctor/)
- [Configuration reference](/reference/configuration/)
- [Scripts and CI](/workflows/automation/)
