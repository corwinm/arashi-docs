---
title: Agents and Specs
description: Plan changes with specs, keep implementation in project repos, and hand off clean context to agents.
draft: false
sidebar:
  hidden: false
---

Use this guide when Arashi is part of an agent-assisted or spec-driven development workflow.

## Keep Planning and Implementation Separate

When your workspace includes planning artifacts and project repositories, keep them in different places:

- planning artifacts such as `proposal.md`, `design.md`, `tasks.md`, and capability specs belong in the planning repo under `openspec/changes/` and `openspec/specs/`
- implementation, tests, and project-specific docs belong in the affected project repository under `repos/<project>/`

This split keeps agents from mixing planning files into implementation repos and makes multi-repo review easier.

## AGENTS-Style Workflow Rules

When you ask an agent to work in an Arashi workspace, the agent should:

1. inspect the existing code and docs before making changes
2. keep edits minimal and scoped to the task at hand
3. avoid moving implementation into planning directories or specs into project repos
4. update companion docs or skills references when workflow behavior or guidance changes
5. validate each affected repo before review or handoff

For the canonical repository rules, review [`AGENTS.md`](https://github.com/corwinm/arashi-arashi/blob/main/AGENTS.md).

## Suggested Spec-Driven Frameworks

- **OpenSpec**: define a change with `proposal.md`, `design.md`, `tasks.md`, and capability specs before implementation.
- **Issue plus task checklist**: acceptable for smaller changes, as long as the problem, implementation plan, and verification steps are written down before code changes.
- **Agent-friendly ADR workflow**: useful when you need a durable design decision record in addition to implementation tasks.

The key requirement is not a specific tool. It is preserving enough written context that an agent can plan, implement, and validate changes without guessing.

## Recommended Change Flow

1. define the change and the affected capabilities
2. write or update `proposal.md`, `design.md`, and `tasks.md`
3. implement the change in `repos/<project>/`
4. run validation in every affected repo
5. archive or merge only after specs, docs, and implementation stay aligned

If your assistant environment exposes them, use `/opsx-propose` to scaffold a change and `/opsx-apply` to work through the task list.

## Related References

- [Workflows overview](/workflows/)
- [Contributing](/contributing/)
- [Arashi skill package](https://github.com/corwinm/arashi-skills)
- [Specs and planning repo](https://github.com/corwinm/arashi-arashi)
