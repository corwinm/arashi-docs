---
title: Config
description: Set command defaults so Arashi creates and switches worktrees the way your team expects.
draft: false
sidebar:
  hidden: false
---

Use this guide after `arashi init` when you want Arashi to create and switch worktrees in a repeatable way without repeating flags on every command.

## Managed Paths And Ignore Scope

The shared `.arashi/config.json` defines `reposDir` and `worktreesDir`. For safe repository-relative subdirectories, Arashi reconciles those managed paths with Git during `init`, `pull`, `clone`, `add`, and `create` before creating repositories or worktrees.

The built-in ignore scope is `local`. Missing rules go to the common repository's local exclude file resolved through Git, normally `.git/info/exclude`, so a fresh clone does not dirty the workspace-root `.gitignore`. Git's effective state is authoritative: an existing rule in a tracked ignore file, the repository-local exclude file, or the user's `core.excludesFile` suppresses any duplicate write.

Use `init` to choose or change the clone-local policy:

```bash
arashi init --ignore-scope tracked # Write missing rules to the root .gitignore
arashi init --ignore-scope none    # Report unignored paths without writing rules
arashi init --ignore-scope local   # Restore the repository-local default
```

Only explicit non-default preferences are stored, under the clone-local Git key `arashi.ignoreScope`. They are deliberately absent from `.arashi/config.json`: `tracked` is a team-level content choice for the current clone, while `none` leaves ignore management to the user. Selecting `local` removes the key. Arashi can honor an existing global exclude rule, but it never writes global Git configuration.

Reconciliation normalizes and deduplicates the two managed directories. It writes only safe repository-relative subdirectory rules and skips repository root, absolute paths, and parent traversal. Arashi updates only entries in its own managed block; matching user-authored rules are left alone. With `none`, even stale Arashi-owned entries are reported rather than changed.

Run `arashi doctor` to inspect missing rules, stale Arashi-owned entries, unsafe paths, or an invalid stored scope without modifying anything. This configured lifecycle behavior is separate from the configless workspace discovery tracked in [issue #212](https://github.com/corwinm/arashi-arashi/issues/212).

## Command Defaults

Set defaults in `.arashi/config.json` when you want consistent behavior without repeating flags.

```json
{
  "defaults": {
    "create": {
      "switch": true,
      "launch": true,
      "launchMode": "sesh"
    },
    "switch": {
      "mode": "auto",
      "launchMode": "sesh"
    }
  }
}
```

- `defaults.create.switch` controls whether Arashi switches into the new worktree after `create`.
- `defaults.create.launch` and `defaults.create.launchMode` control how create opens the new context.
- `defaults.switch.mode` chooses between launch behavior, parent-shell `cd`, or automatic detection.
- `defaults.switch.launchMode` controls how `arashi switch` opens when launch behavior is used.

Install shell integration with `arashi shell install` if you want `defaults.switch.mode: "cd"` or `"auto"` to support parent-shell directory changes.

## Suggested Setup Sequence

1. Start with `defaults.create` and `defaults.switch` so the default behavior matches your team.
2. Enable shell integration if you want `arashi switch --cd` behavior.
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
arashi status --group docs
arashi create feat/update-docs --group docs --no-launch --no-switch
arashi exec --group agents -- pnpm validate
```

When `--group` and `--only` are supplied together, Arashi intersects the filters: `--group` narrows the explicit repository list instead of broadening it. For example, `arashi exec --only arashi,arashi-docs --group docs -- pnpm validate` runs only in `arashi-docs` if that is the only selected repository in the `docs` group. Unknown groups and valid filters that produce an empty intersection are reported as selection errors before mutating commands run.

## Related References

- [create command](/commands/create/)
- [switch command](/commands/switch/)
- [shell command](/commands/shell/)
- [Hooks workflow guide](/workflows/hooks/)
- [Full configuration reference](https://github.com/corwinm/arashi/blob/main/docs/configuration.md)
