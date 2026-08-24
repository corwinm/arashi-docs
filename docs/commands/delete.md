---
title: delete Command
description: Safely delete one or more configured repository dependencies.
draft: false
sidebar:
  hidden: false
---

## What It's For

Delete removes configured repository dependencies, while `remove` deletes branch worktrees. They are separate commands: `delete` does not alias or overload `remove`.

## Usage And Target Selection

```bash
aw delete [repository] [options]
```

`aw delete <repository>` targets one exact configured repository key. It does not infer a dependency from a path, branch, remote, or fuzzy name.

With `aw delete` omitted, a human TTY opens a checkbox to select one or more keys from active configuration. Selecting nothing or cancelling exits without topology planning or mutation. Arashi bytewise-orders the selected keys, prepares all selected repository plans before mutation, shows the complete selected plans in one combined preview, and asks one default-no confirmation.

Non-TTY and JSON use with the target omitted fails with a selection-required error and requires an explicit key. `--force` and `--dry-run` do not invent a target.

## Preview, Confirm, Then Delete

Preview the exact dependency first:

```bash
aw delete api --dry-run
```

For a human-confirmed deletion, review the plan and accept its default-no confirmation:

```bash
aw delete api
```

For intentional non-interactive deletion, run `--dry-run` before `--force`; `--force` skips confirmation:

```bash
aw delete api --dry-run
aw delete api --force
```

For an omitted-target TTY batch, run `aw delete --dry-run`, select the same keys for the mutating run, then accept the one combined confirmation. A fresh plan is always built; do not treat a previous preview as authorization for changed state.

## Safety Boundaries

`--force` bypasses confirmation and disclosed Git data-loss guards only. It can accept dirty worktrees or unpublished local Git data after disclosure, but it cannot broaden ownership or choose a target.

Path containment, symlink, topology, identity, hook ambiguity, and concurrent-config checks remain mandatory. Any selected repository's structural or planning blocker stops the complete batch before mutation. Dry-run and refused or declined operations do not mutate workspace state.

## Deleted And Preserved Scope

Delete removes the canonical clone, all owned linked worktrees, owned local refs, the exact configuration entry, and canonical repository-targeted hook files/templates. The plan identifies this scope before confirmation.

It preserves unrelated configuration, managed-ignore policy, shared hooks, user-global hooks, remote repositories, and remote branches. It also leaves historical configuration in other worktrees, branches, and commits unchanged. There is no standalone or keep-files form of `delete`.

## JSON Automation

JSON remains explicit-key and single-target. Preview without mutation:

```bash
aw delete api --dry-run --json
```

`aw delete <repository> --dry-run --json` returns the accepted plan at `data.plan` and `data.result: null`. Mutating automation uses:

```bash
aw delete api --force --json
```

`aw delete <repository> --force --json` never prompts. Stdout contains one JSON document; use its structured plan, result, warnings, and error fields rather than parsing human summaries or stderr.

On partial failure, `error.details.plan` and `error.details.result` contain the accepted scope and phase ledger. Hook logical identity, path, or status may appear without file contents or inline command bodies.

## Partial Failure And Retry

A multi-repository deletion is not an all-or-nothing transaction. Earlier repositories may be completed, the failing repository is failed, and later repositories are not started. Inspect the phase ledger and surviving state, then retry the exact command only when Arashi reports that retry as safe. Each incomplete repository has its own retry guidance or manual-review outcome; do not synthesize a broad cleanup command.

There is no atomic rollback after an owned worktree, clone, ref, hook, or configuration phase has completed. Do not manually delete surviving paths to imitate rollback: preserve receipts and reported state so a safe exact retry can revalidate ownership.

## Related

- [Configuration workflow](/workflows/config/#delete-a-configured-repository-dependency)
- [JSON Automation](/workflows/json-automation/#delete-plans-results-and-retries)
- [Hooks workflow](/workflows/hooks/#configured-repository-deletion)
- [remove command](/commands/remove/)
- [doctor command](/commands/doctor/)
