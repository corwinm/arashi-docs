---
title: Coding Agents
description: Keep agent work in the right repository.
draft: false
sidebar:
  hidden: false
  order: 4
---

## Start

1. Run `aw doctor` from the meta-repository.
2. Read the root and child `AGENTS.md` files.
3. Work in the child repository that owns the change.
4. Validate every affected repository.
5. Use `aw handoff` when pausing or transferring work.

## Install the skill

```bash
npx skills add https://github.com/corwinm/arashi-skills --skill arashi
```

The optional skill gives supported agents reusable Arashi guidance. You can also [view it on skills.sh](https://www.skills.sh/corwinm/arashi-skills/arashi).

## Keep ownership clear

- Code, tests, and project docs belong in the affected child repository.
- Shared plans and cross-repository coordination belong in the meta-repository.
- Each repository gets its own commit and pull request.

A planning framework is optional. Repository ownership is the important contract.

## Recommended `AGENTS.md`

Add a root `AGENTS.md` so agents know where work belongs:

```md
# Workspace Agent Rules

This meta-repository coordinates child repositories in `repos/`.

## Core Rules

- Put implementation, tests, and project docs in `repos/<project>/`.
- Keep shared plans and cross-repository context in the meta-repository.
- Read the child repository's `AGENTS.md` before editing it.

## Multi-Repository Work

- A single Git commit cannot span multiple repositories.
- Validate each affected repository.
- Open separate, cross-linked pull requests.

## Child Instructions

- `repos/<project>/AGENTS.md`
```

Add smaller `AGENTS.md` files inside child repositories for their validation commands and editing rules.

## Target the task

```bash
aw create docs/update-reference --only arashi-docs --no-launch --no-switch
aw status --only arashi-docs
aw exec --only arashi-docs -- pnpm validate
```

Use `--only` or `--group` for expensive or mutating work unless the task needs every repository.

## Start a new T3 task in the feature workspace

When the current conversation is attached to main, use optional T3 handoff to create the coordinated feature workspace and start a separate thread in that exact parent checkout:

```bash
aw create feature/t3-handoff --t3 --prompt-file task.md
```

Write `task.md` as a self-contained task. Include:

- the objective and expected user-visible outcome;
- decisions and constraints already accepted;
- repository, issue, specification, or file context the new thread needs;
- completion expectations, including tests, documentation, and reporting.

Do not ask Arashi to infer or scrape conversation history. The handoff initiates a new task; it does not complete or monitor it, and the original conversation stays attached to main. By default Arashi explicitly requests `full-access` and opens no host UI. Use `--permission approval-required` or `--permission auto-accept-edits` when the task needs a narrower mode.

After success, report the exact parent checkout, effective permission, environment, project, thread, dispatch, and UI outcomes. The user manually selects that project/thread in a desktop or mobile T3 client connected to the same reachable host environment. A mobile client does not run the CLI locally, and a browser opened on the host cannot navigate the phone.

If workspace creation succeeds but handoff fails, preserve the workspace. Retry with `--conflict REUSE_EXISTING` only when Arashi marks the receipt safe; if dispatch is indeterminate, reconcile the reported workspace in T3 before trying again. See [`create`](/commands/create/#hand-off-to-t3-code) for bridge installation, exact retry syntax, result fields, and tested-platform limits.

## Hand off

```bash
aw handoff \
  --link https://github.com/example/project/pull/42 \
  --validation "pnpm validate — passed" \
  --todo "watch CI"
```

Only report checks that ran. Put pending work under `--todo` or `--risk`.

## Related

- [Scripts and CI](/workflows/automation/)
- [Coordinate Repositories](/workflows/coordinate-repositories/)
- [Commands](/commands/)
