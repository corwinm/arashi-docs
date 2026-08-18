---
title: handoff Command
description: Generate a Markdown or JSON handoff report for a coordinated workspace.
draft: false
sidebar:
  hidden: false
---

## What It's For

Generate a non-mutating handoff report when coordinated Arashi work needs to pause, move to another agent, request review, or leave a dirty workspace with clear next steps.

`aw handoff` combines Arashi's current per-repository status with context you provide: related links, validation evidence, remaining work, risks, blockers, and suggested next commands.

## Usage

```bash
aw handoff [options]
```

Markdown is the default human output. Use `--json` when an agent, script, or editor integration needs a structured report.

## Options

- `-j, --json` emit one machine-readable JSON envelope instead of Markdown.
- `--link <link>` add a related issue, PR, spec, or reference link. Repeat for multiple links.
- `--validation <entry>` add validation evidence such as a command and result. Repeat for multiple entries.
- `--todo <item>` add remaining work as a checklist item. Repeat for multiple items.
- `--risk <item>` add a known risk or blocker. Repeat for multiple items.
- `--next-command <command>` add a suggested next command. Repeat for multiple commands. These commands are listed only; `handoff` does not execute them.

## Examples

```bash
# create a quick Markdown report for chat or a PR comment
aw handoff --link https://github.com/corwinm/arashi-arashi/issues/186

# include validation evidence and remaining work
aw handoff \
  --link https://github.com/corwinm/arashi/pull/123 \
  --validation "pnpm test — passed" \
  --validation "pnpm build — passed" \
  --todo "watch CI" \
  --risk "Windows matrix has not finished yet" \
  --next-command "gh pr checks 123 --repo corwinm/arashi"

# produce a structured handoff report for automation
aw handoff --json --link https://github.com/corwinm/arashi-arashi/issues/186
```

## Output And Exit Behavior

The Markdown report includes:

- workspace path and branch
- current repository context when run from a child repo
- per-repository status derived from Arashi workspace inspection
- repositories needing attention, including dirty repositories and repository errors
- supplied related links, validation evidence, remaining work, risks or blockers, and suggested next commands

`aw handoff` is read-only. It does not stage files, commit, push, delete worktrees, write report files by default, or run validation commands for you. Validation entries are evidence that you supply; they are not proof that Arashi re-ran those commands.

The command exits non-zero when workspace resolution fails or repository status collection reports repository errors. Dirty repositories are reported in the handoff but do not make the command fail by themselves.

## JSON Mode

Use `--json` when automation needs stable handoff data without scraping Markdown. JSON mode writes exactly one JSON document to stdout using the standard Arashi envelope.

On success, `data` includes:

- `workspace`: workspace path and branch
- `currentRepository`: the managed repository containing the current directory, when detected
- `repositories`: per-repository branch, file status, warning, and clean/dirty/error state
- `summary`: clean, dirty/error, total, and touched counts
- `context`: supplied links, validations, todos, risks, and next commands
- `generatedNextCommands`: conservative follow-up commands such as `aw status`

If the command runs outside a workspace, JSON mode returns `ok: false` with `error.code: "NOT_IN_WORKSPACE"`.

## Deprecated compatibility

Markdown is the default human output, so preferred help and examples omit `--markdown`. The explicit spelling remains a hidden, deprecated compatibility option throughout Arashi 1.x and produces the same report; JSON remains authoritative if both are supplied. Removal may happen no earlier than Arashi 2.0 and requires a separately approved breaking-change issue.

## Handoff Guidance

Create a handoff report before you:

- pause non-trivial coordinated work
- switch from one agent or human to another
- request review while local context still matters
- leave dirty repositories for a future session
- need to show exactly which validations were run and what remains

For implementation work, run the relevant validations first, then pass the commands and outcomes with `--validation`. If a check is pending or unverified, put that in `--risk` or `--todo` rather than implying the work is ready.

## Related

`handoff` supports standalone mode and reports the main repository, caller worktree, and workspace mode in Markdown or JSON. See the [Standalone Repository workflow](/workflows/standalone/).

- [status](/commands/status/) for focused repository state inspection.
- [exec](/commands/exec/) for repeated validation across selected repositories.
- [Agents workflow](/workflows/agents-and-specs/) for multi-repo agent guidance.
