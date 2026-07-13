---
title: Agents
description: Use agents effectively in an Arashi meta-repo by keeping implementation in child repos and shared context in the meta-repo.
draft: false
sidebar:
  hidden: false
---

Use this guide when you want an agent to work safely inside an Arashi meta-repo. It is designed to stand alone as a bootstrap document you can paste into an agent session or link from `/llms.txt`.

## Quick Start For Agents

If you are an agent entering an Arashi-managed workspace:

1. Start in the meta-repo root and run `arashi doctor` as a safe, non-mutating workspace-health diagnostic.
2. Read the root `AGENTS.md` or equivalent workspace instructions, then read the owning child repo's instructions before editing.
3. Identify which child repo owns the implementation.
4. Keep implementation, tests, and repo-specific docs in `repos/<project>/`.
5. Keep shared context, OpenSpec proposals, plans, and cross-repo coordination in the meta-repo.
6. Inspect detailed repository state with `arashi status` when `doctor` findings or the task require it.
7. Validate every affected repo before review or handoff.
8. Generate an `arashi handoff` report when pausing, switching agents, or leaving dirty work.
9. Use focused PRs and cross-link related PRs when work spans repositories.

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

## Recommended `AGENTS.md`

Use a root `AGENTS.md` to tell agents how your meta-repo is organized. A good default looks like this:

```md
# Arashi Meta-Repo Agent Rules

This repository is the meta-repo that coordinates work across the child repositories in `repos/`.

## Core Rule

- Put implementation in the affected child repository under `repos/<project>/`.
- Keep shared context, planning, cross-repo notes, and workspace-level guidance in this meta-repo.

## How To Work In This Workspace

1. Start in the child repo that owns the change.
2. Keep code, tests, and project-specific docs in that child repo.
3. Use the meta-repo for change context, coordination, OpenSpec artifacts, and cross-repo guidance.
4. When a change affects multiple repos, update each affected repo directly instead of mixing files into the wrong location.

## Multi-Repo Expectations

- A single git commit cannot span multiple repositories.
- If a feature changes both planning artifacts and project implementation, commit each affected repository separately.
- When command behavior, configuration, or user workflow changes in `repos/arashi`, review companion updates in `repos/arashi-docs/` and `repos/arashi-skills/`.
- When multiple repositories need PRs, include explicit cross-links between the PRs and reference the originating issue in each one.

## Repo-Specific Rules

- `repos/arashi/AGENTS.md`
- `repos/arashi-docs/AGENTS.md`
- `repos/arashi-skills/AGENTS.md`
- `repos/arashi-vscode/AGENTS.md`
```

Then add smaller `AGENTS.md` files inside the child repos so the agent can pick up repo-specific validation commands and editing rules.

## Recommended Workflow

1. decide which child repo owns the implementation
2. gather context in the meta-repo before making code changes
3. have the agent implement the change in the child repo
4. update related docs or coordination files in the meta-repo when needed
5. validate each affected repo before review or handoff
6. run `arashi handoff` with links, validation evidence, remaining work, risks, and next commands before pausing or transferring context

For multi-repo work, do not try to make one commit span the whole workspace. Commit and open PRs from each affected repository, then cross-link those PRs so reviewers can follow the complete change.

## Handoff Reports

Use `arashi handoff` to create a concise report when an agent is about to pause, switch with another agent, request review, or leave a dirty coordinated workspace. The command is read-only: it gathers current Arashi status and renders Markdown by default, but it does not run validations, write files, stage changes, commit, push, or delete worktrees.

Include context Arashi cannot infer:

```bash
arashi handoff \
  --link https://github.com/corwinm/arashi-arashi/issues/186 \
  --link https://github.com/corwinm/arashi/pull/123 \
  --validation "pnpm test — passed" \
  --validation "pnpm build — passed" \
  --todo "watch CI" \
  --risk "Windows matrix has not finished yet" \
  --next-command "gh pr checks 123 --repo corwinm/arashi"
```

Use `--validation` only for commands and results that were actually run. If a check is pending or unverified, put it in `--todo` or `--risk` so the next worker does not mistake it for merge-ready evidence.

Use `arashi handoff --json` when an agent or script needs to parse the report. JSON mode uses the standard single-document Arashi envelope and includes workspace metadata, current repository context, per-repository status records, supplied context arrays, warnings, and generated next-command hints.

## Specs Pair Well, But They Are Optional

Arashi pairs well with a spec-driven development framework such as OpenSpec because it gives the agent a clean place for proposals, tasks, and design context.

The important part is not a specific framework. The important part is keeping:

- code in the child repo that owns it
- context and coordination in the meta-repo
- instructions clear enough that the agent does not need to guess

If your assistant environment exposes them, `OpenSpec` commands such as `/opsx-propose` and `/opsx-apply` are a good fit for this workflow.

## Machine-Readable Command Output

Agents should prefer `--json` when they need to inspect Arashi state or make decisions from command results. JSON mode keeps stdout reserved for one parseable result document and avoids brittle scraping of progress text, colors, tables, or prompts.

Good agent-facing commands include:

```bash
arashi doctor --json
arashi status --json
arashi list --json
arashi exec --json -- git status --short
arashi handoff --json --link https://github.com/corwinm/arashi-arashi/issues/186
arashi status --group docs --json
arashi exec --only arashi-docs --json -- pnpm validate
arashi exec --group agents --json -- pnpm validate
arashi create feature-branch --no-launch --no-switch --json
arashi clone --all --json
arashi pull --group docs --json
arashi setup --only api --json
```

In JSON mode, successful commands include `ok: true`, `command`, `schemaVersion`, `data`, and `warnings`. Command-level failures use `ok: false` plus a structured `error` object so agents can branch on `error.code` instead of parsing English text. See the [JSON automation reference](/workflows/json-automation/) for the full envelope contract, stdout/stderr guarantees, and command support matrix.

Use `arashi doctor --json` as the first diagnostic command when troubleshooting workspace health. It is read-only and returns stable findings with `code`, `severity`, `category`, `scope`, `message`, and suggested follow-up commands. Treat `error` findings as blockers; use `warning` and `info` findings to guide lower-risk follow-up checks.

Use `arashi exec` for repeated multi-repo inspection or validation commands that are not covered by a built-in Arashi command. The child command must follow `--` and runs from each selected repository as its working directory. Prefer `--group <group>` for known semantic sets such as `core`, `docs`, `extensions`, `agents`, or `infra`; use `--only <repos>` for one-off repository lists. For mutating, expensive, network-heavy, or long-running commands, always apply an explicit `--group` or `--only` filter unless the user asked for every managed repository. When both filters are supplied, `--group` intersects with and narrows `--only`.

JSON mode is non-interactive. If a command would normally prompt, launch an editor or terminal, emit shell integration code, or change the parent shell directory, pass explicit non-interactive flags or expect a structured unsupported-mode error such as `JSON_UNSUPPORTED_FOR_MODE`.

## Partial Coordinated Worktrees

Arashi supports intentionally partial coordinated worktrees when a task only needs some child repositories.

- Use `arashi create <branch> --interactive` to choose child repositories while still creating the parent/meta worktree.
- Default and short `arashi status` output hide omitted child repositories so partial worktrees do not look broken during everyday checks.
- Use `arashi status --verbose` or `arashi status --json` when an agent needs to inspect every configured repository, including missing child repositories.
- From inside a partial worktree, use `arashi clone` or `arashi clone --all --json` to add missing child repositories on the current branch.

## Related References

- [Curated LLM entrypoint](/llms.txt)
- [Full Markdown export](/llms-full.txt)
- [JSON automation reference](/workflows/json-automation/)
- [Workflows overview](/workflows/)
- [Contributing](/contributing/)
- [Meta-repo AGENTS.md](https://github.com/corwinm/arashi-arashi/blob/main/AGENTS.md)
