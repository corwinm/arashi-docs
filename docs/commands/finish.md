---
title: finish Command
description: Assess completion and retire one configured coordinated workspace.
draft: false
sidebar:
  hidden: false
---

`finish` checks one registered, non-main coordinated workspace before removing its worktrees and, by default, local branches. Unlike [`remove`](/commands/remove/), it assesses each participating repository's integration into its configured base and asks for completion judgment when that cannot be proved. It does not delete configured repository dependencies; use [`delete`](/commands/delete/) for that.

## Usage

```bash
aw finish [target] [options]
```

From a coordinated parent or its registered child, omit `target` to use that workspace. From main in a terminal, omit it to choose one parent from a picker; choosing is not cleanup consent. An explicit registered parent path or unique branch-name match can select a sibling. Ambiguous matches fail. JSON and non-interactive runs require an explicit target; standalone and main worktrees cannot be finished.

## Options

- `-n, --dry-run`: assess and preview cleanup without cleanup prompts, hooks, or deletion. The assessment may fetch remote metadata into temporary Git storage; it does not update managed worktrees, refs, or configuration.
- `-j, --json`: emit one machine-readable envelope without prompts. Supply an explicit target. Unknown completion cannot be manually accepted in this mode.
- `-f, --force`: authorize discard of dirty or unpublished work and ordinary removal confirmation. It does **not** prove completion, waive unknown integration, or bypass topology checks.
- `--keep-branches`: remove worktrees while retaining local branches.
- `--no-hook-input`: run remove hooks with input disabled; it does not skip hooks.

## Examples

```bash
# Inspect a specific coordinated workspace before deciding
aw finish feature-auth --dry-run

# Inspect the same target from automation without deleting anything
aw finish feature-auth --dry-run --json

# In a terminal, review completion and discard prompts before removal
aw finish feature-auth
```

## What the assessment means

The report covers the parent and configured children present at their expected locations, even if a child has a different branch. Absent children are listed as nonparticipants. It reports HEAD and branch, staged/unstaged/untracked changes, upstream publication state, effective base policy, integration evidence, reasons, and a cleanup plan when the scope is valid. Repository base configuration takes precedence over workspace base configuration; an omitted policy is not silently replaced with a default branch. Interactive execution can ask for a remote and full `refs/heads/...` base ref when policy is omitted; preview does not prompt.

`proven` means the inspected HEAD is an ancestor of a freshly fetched configured base in a complete history. This does not check for later reverts. A squash or rebase PR, ahead count, or cached tracking ref alone does not prove integration. When evidence is unknown, terminal execution presents the affected repositories and reasons in one combined manual completion confirmation; acceptance is recorded as `manually-confirmed`, not `proven`. Dirty changes and unpublished/unknown upstream state require separate discard consent. Declining leaves worktrees and branches in place.

A preview reports pending worktree and branch operations and remove-hook discovery without running hooks. Execution rechecks the assessed state before removal and after pre-remove hooks; changes can abort cleanup. Removal uses the [`remove` command's](/commands/remove/) hook and partial-failure behavior, not an atomic rollback. Inspect survivors after a partial failure.

JSON reports use a `schemaVersion: 1`, `command: "finish"` envelope, with assessment in success `data` or failure `error.details` after target resolution. Readiness is `ready`, `unknown`, or `blocked`; an invalid scope has no cleanup plan. Completed previews (including blocked/unknown assessments) and successful cleanup exit 0; selection or required/declined consent exits 2; ineligible execution, invalidation, and removal failures exit 1. `--force --json` still cannot resolve unknown completion.

## Related

- [Work on a Change](/workflows/change-lifecycle/)
- [remove](/commands/remove/)
- [Lifecycle Hooks](/reference/hooks/)
