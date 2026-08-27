---
title: Agents and Automation
description: Keep agent work in the right repository and automate Arashi safely.
draft: false
sidebar:
  hidden: false
  order: 4
---

Use this guide when an agent, script, or CI job works inside an Arashi meta-repository.

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

## Automation and JSON

Use `--json` (or `-j`) when an agent, script, or CI job needs to parse command output.

- stdout contains exactly one JSON document followed by a newline.
- Human progress, tables, colors, spinners, and prompts stay off stdout.
- Check both the process exit status and the envelope's `ok` field.
- Branch on `error.code`, not the human-readable `message`.
- Read the fields you need and ignore unknown fields for forward compatibility.
- Pass explicit selectors and non-interactive options when a command would otherwise prompt, switch shells, or launch another application.
- Use the relevant [command reference](/commands/) for command-specific `data`, warnings, errors, and JSON support.

A successful envelope has this common shape:

```json
{
  "ok": true,
  "command": "status",
  "schemaVersion": 1,
  "data": {},
  "warnings": []
}
```

Failures use `ok: false` with a structured `error` object. stderr remains available for child-command diagnostics and unexpected runtime failures; do not parse human prose from stderr as an API.

Start automation with safe inspection commands:

```bash
aw doctor --json
aw status --json
aw list --json
```

Then use targeted commands such as `aw exec --only arashi-docs --json -- pnpm validate`. Interactive-only flows return a structured unsupported-mode error instead of prompting.

## Specifications are optional

A spec framework such as OpenSpec can keep proposals and tasks in the meta-repository while implementation stays in child repositories. The important contract is repository ownership, not a particular planning tool.

## Related references

- [Commands](/commands/)
- [Workflows](/workflows/)
- [Config](/workflows/config/)
- [Hooks](/workflows/hooks/)
- [Curated agent entrypoint](/llms.txt)
- [Full Markdown export](/llms-full.txt)
- [Contributing](/contributing/)
