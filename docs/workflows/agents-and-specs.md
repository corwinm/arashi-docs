---
title: Working with Agents
description: Use agents effectively in an Arashi meta-repo by keeping implementation in child repos and shared context in the meta-repo.
draft: false
sidebar:
  hidden: false
---

Use this guide when you want an agent to work safely inside an Arashi meta-repo.

## Core Idea

Arashi works best with agents when the workspace has a clear split:

- implementation belongs in the affected child repo under `repos/<project>/`
- shared context, planning, and cross-repo documentation belong in the meta-repo

That structure makes it much easier to tell an agent where to read, where to write, and what not to mix together.

## What To Tell The Agent

When you give an agent work in this workspace, tell it:

1. which child repo owns the implementation
2. that implementation, tests, and repo-specific docs stay in `repos/<project>/`
3. that meta-repo context, planning notes, and cross-repo guidance stay in the meta-repo
4. which validation commands to run in the affected repo or repos

If your workspace uses `AGENTS.md` files, point the agent at the root file first and then the file inside the child repo it is editing.

## Recommended Workflow

1. decide which child repo owns the implementation
2. gather context in the meta-repo before making code changes
3. have the agent implement the change in the child repo
4. update related docs or coordination files in the meta-repo when needed
5. validate each affected repo before review or handoff

## Specs Pair Well, But They Are Optional

Arashi pairs well with a spec-driven development framework such as OpenSpec because it gives the agent a clean place for proposals, tasks, and design context.

The important part is not a specific framework. The important part is keeping:

- code in the child repo that owns it
- context and coordination in the meta-repo
- instructions clear enough that the agent does not need to guess

If your assistant environment exposes them, `OpenSpec` commands such as `/opsx-propose` and `/opsx-apply` are a good fit for this workflow.

## Related References

- [Workflows overview](/workflows/)
- [Contributing](/contributing/)
- [Meta-repo AGENTS.md](https://github.com/corwinm/arashi-arashi/blob/main/AGENTS.md)
