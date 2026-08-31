---
title: Work with Coding Agents
description: Keep agent-assisted implementation, coordination, validation, and handoffs in the right repositories.
draft: false
sidebar:
  hidden: false
  order: 4
---

Use this guide when a coding agent works inside an Arashi meta-repository.

## Quick start

1. Start in the meta-repository root and run `aw doctor`.
2. Read the root `AGENTS.md`, then the instructions in the child repository that owns the change.
3. Keep implementation, tests, and repository-specific docs in `repos/<project>/`.
4. Keep shared plans, specifications, and cross-repository coordination in the meta-repository.
5. Use `aw status` when the task needs detailed repository state.
6. Validate every affected repository before review or handoff.
7. Use `aw handoff` when pausing or transferring unfinished work.
8. Open focused, cross-linked PRs when a change spans repositories.

## Install the Arashi skill

Install the optional skill to give supported coding agents reusable Arashi workflow and safety guidance:

```bash
npx skills add https://github.com/corwinm/arashi-skills --skill arashi
```

You can also [view it on skills.sh](https://www.skills.sh/corwinm/arashi-skills/arashi) or [browse its source](https://github.com/corwinm/arashi-skills).

## Keep work in its owning repository

Arashi separates shared coordination from project implementation:

- Put code, tests, and project-specific docs in the affected child repository.
- Put shared context, plans, specifications, and cross-repository guidance in the meta-repository.
- Commit and open PRs separately in every affected repository; one Git commit cannot span them.

A root `AGENTS.md` only needs to state that boundary, point to child instructions, and name the validation expected in each repository. Avoid copying every child repository's rules into the root file.

## Coordinated workflow

Use the smallest repository set needed for the task:

```bash
aw create docs/update-reference --only arashi-docs --no-launch --no-switch
aw status --only arashi-docs
aw exec --only arashi-docs -- pnpm validate
```

`aw create --interactive` can build an intentionally partial coordinated worktree. From that worktree, use `aw clone` to add another configured child on the same branch. Use `aw status --verbose` or `aw status --json` when you need to see configured children that were intentionally omitted.

Use `aw exec` for repeated inspection or validation that is not covered by a built-in command. Apply `--only` or `--group` to mutating, network-heavy, or expensive work unless the task explicitly requires every repository.

## Handoff

`aw handoff` produces a read-only report of current workspace state. Add only evidence and context Arashi cannot infer:

```bash
aw handoff \
  --link https://github.com/example/project/pull/42 \
  --validation "pnpm validate — passed" \
  --todo "watch CI" \
  --next-command "gh pr checks 42"
```

Report checks as validation only after they have actually run. Put pending or unverified work under `--todo` or `--risk`.

## Specifications are optional

A spec framework such as OpenSpec can keep proposals and tasks in the meta-repository while implementation stays in child repositories. The important contract is repository ownership, not a particular planning tool.

## Related references

- [Commands](/commands/)
- [Workflows](/workflows/)
- [Scripts and CI](/workflows/automation/)
- [Config](/reference/configuration/)
- [Hooks](/reference/hooks/)
- [Curated agent entrypoint](/llms.txt)
- [Full Markdown export](/llms-full.txt)
- [Contributing](/contributing/)
