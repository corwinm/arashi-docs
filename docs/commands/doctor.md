---
title: doctor Command
description: Diagnose Arashi workspace health without changing repositories or configuration.
draft: false
sidebar:
  hidden: false
---

## What It's For

Run a safe, read-only health check when an Arashi workspace looks wrong or before an agent starts troubleshooting. `aw doctor` gathers workspace, repository, worktree metadata, hook, shell integration, and install/update hints into one actionable report.

`doctor` does not repair problems. It recommends follow-up commands such as `aw status`, `aw clone`, `aw prune --dry-run`, `aw shell install`, or `aw update --dry-run` when those commands are relevant.

## What It Checks

`aw doctor` reports diagnostic findings for conditions such as:

- running outside an Arashi workspace, with suggestions to initialize one or switch into one
- missing, unreadable, malformed, or invalid Arashi workspace configuration
- configured repositories that are missing from disk
- dirty repositories with staged, unstaged, or untracked changes
- detached heads, missing upstreams, upstream divergence, missing remote refs, or default-branch drift
- repository status checks that fail
- stale Git worktree metadata that `aw prune --dry-run` can review
- configured lifecycle hook files that are missing, not executable, unsafe, or unsupported
- safe managed repository or worktree paths that have no effective ignore rule
- stale entries in Arashi-owned ignore blocks, invalid clone-local ignore scope, and paths unsafe for automatic rules
- shell integration or install/update hints when they can be detected safely

Environment checks are conservative. If shell integration or install state cannot be determined safely, `doctor` avoids treating the unknown state as a blocking failure.

The managed ignore checks use Git's effective tracked, repository-local, and global sources. Findings identify the managed path, effective scope or stored preference when available, and suggested repair such as rerunning a lifecycle command or selecting `aw init --ignore-scope local|tracked|none`. An unsafe-path finding is distinct from a missing safe rule. `doctor` does not repair ignore files, remove stale owned entries, replace an invalid `arashi.ignoreScope`, or write global Git configuration.

## Usage

```bash
aw doctor [options]
```

## Options

- `-j, --json` emit one machine-readable JSON envelope instead of grouped human output.

## Examples

```bash
# Run the default human-readable workspace health check
aw doctor

# Produce structured findings for an agent or script
aw doctor --json

# Review detailed repository state after doctor reports repository findings
aw status --verbose

# Preview stale worktree cleanup after doctor reports stale metadata
aw prune --dry-run
```

## Finding Severities

Every finding has a severity:

- `error` means a blocking health problem or required diagnostic failure. `aw doctor` exits non-zero when any `error` finding is present.
- `warning` means a non-blocking condition that likely needs attention, such as local changes or branch state that may affect coordination.
- `info` means an advisory hint or an unknown-but-safe state, such as shell integration status that cannot be determined reliably.

Human output groups findings by severity or diagnostic category and shows the finding code, affected scope, message, and suggested commands when available. If no findings are detected, `doctor` reports that no workspace health findings were found.

## Exit Behavior

`aw doctor` is non-mutating: it does not change configuration, repositories, worktrees, hooks, shell startup files, install state, or update state.

The command exits with status code `0` when it completes required checks and finds no blocking `error` findings. It exits non-zero when one or more `error` findings are present or when a required diagnostic phase cannot complete.

Warnings and informational findings do not make the command fail by themselves.

## JSON Mode

Use `--json` when automation or agents need stable diagnostics without scraping human output. JSON mode writes exactly one JSON document to stdout using the standard Arashi envelope and suppresses progress text, colors, tables, banners, and prompts.

On success with no blocking findings, the envelope has `ok: true`. When blocking findings are present, the envelope has `ok: false` and the process exits non-zero. In both cases, the findings and summary counts are available in structured data.

The data shape includes:

```json
{
  "ok": true,
  "command": "doctor",
  "schemaVersion": 1,
  "data": {
    "workspaceRoot": "/path/to/workspace",
    "checkedCategories": [
      "workspace",
      "configuration",
      "repository",
      "worktree",
      "hook",
      "shell",
      "install"
    ],
    "findings": [
      {
        "code": "REPOSITORY_DIRTY",
        "severity": "warning",
        "category": "repository",
        "scope": "repository:arashi-docs",
        "message": "Repository 'arashi-docs' has uncommitted changes.",
        "details": {
          "repository": "arashi-docs",
          "path": "/path/to/workspace/repos/arashi-docs",
          "changes": {
            "staged": 1,
            "unstaged": 2,
            "untracked": 0
          }
        },
        "suggestedCommands": [
          "aw status --verbose",
          "git -C /path/to/workspace/repos/arashi-docs status"
        ]
      }
    ],
    "summary": {
      "error": 0,
      "warning": 1,
      "info": 0,
      "total": 1
    }
  },
  "warnings": []
}
```

When `ok` is `false`, findings and summary counts are included in the structured failure details so consumers can branch on stable `code`, `severity`, `category`, and `scope` fields instead of parsing prose. Extra fields such as `details`, paths, repository names, hook names, and `suggestedCommands` are additive.

## Agent Notes

- Prefer `aw doctor --json` as the first workspace-health diagnostic command for agents.
- Treat `error` findings as blockers before mutating recovery commands.
- Use suggested commands from findings as follow-up checks, and keep mutating commands explicit and scoped.
- For managed ignore findings, preserve user-authored and global rules. Use the suggested lifecycle or `init --ignore-scope` repair instead of editing an effective source blindly.
- Use [`aw exec`](/commands/exec/) for additional repeated inspection only when `doctor` and built-in commands do not cover the question.

## Related Commands

`doctor` checks standalone repository state without repairing ignore rules or creating configuration. See the [Standalone Repository workflow](/workflows/standalone/).

- [status](/commands/status/) for detailed repository and branch state.
- [clone](/commands/clone/) for missing configured repositories.
- [prune](/commands/prune/) for stale Git worktree metadata.
- [shell](/commands/shell/) for shell integration setup.
- [update](/commands/update/) for CLI update checks.
