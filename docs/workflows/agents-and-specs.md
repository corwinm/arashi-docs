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
