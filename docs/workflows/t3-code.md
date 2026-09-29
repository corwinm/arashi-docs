---
title: T3 Code
description: Create an Arashi workspace and start a T3 Code task with your preferred model.
draft: false
sidebar:
  hidden: false
---

Start a separate T3 Code thread in a new coordinated workspace while your original conversation stays in its current checkout. Arashi creates the worktrees and dispatches your task; it does not monitor or complete that task.

## Set up the bridge

Run these commands on the host containing Arashi, your repositories, and a reachable T3 environment. T3 handoff requires a configured Arashi workspace; ordinary worktree creation does not require T3 or Node.js.

```bash
# Requires Node.js 22.16 or newer
npm install --global @bvdm/t3code-cli@0.1.2
t3code --json doctor
```

Arashi supports the bridge's reported 0.1.x command/result contract. The published 0.1.2 package has a known embedded `--version` value of `0.1.0`, which Arashi accepts. Later compatibility lines require an Arashi update rather than an implicit latest-version download.

## Choose model defaults

Arashi does not pass a model or reasoning-effort override to the bridge. To choose personal defaults for future handoffs, configure the `t3code` CLI on the repository host. For example, with a Codex provider that supports this model and effort:

```sh
t3code config set provider codex
t3code config set model gpt-6.1-sol
t3code config set thinkingEffort medium
t3code config show
```

The model and effort above are examples, not Arashi requirements. These are T3 CLI preferences, separate from Arashi workspace configuration and the T3 app's current model selection. Saved CLI preferences override the project's default selection for new handoffs; without them, the bridge uses the project selection or its own fallback. Changing these preferences does not change existing threads. See the [T3 CLI documentation](https://github.com/MajesteitBart/t3code-cli#readme) for its full configuration reference.

## Create and hand off a task

```bash
aw create feature-auth-refresh --t3 "Implement the accepted design"

# For a longer task, use a UTF-8 file
aw create feature-auth-refresh --t3 --prompt-file task.md
```

Make the task self-contained: include the objective, accepted decisions, relevant issue or file links, and completion expectations such as tests and documentation. Arashi does not infer or scrape conversation history.

Include the coordinating parent repository when using repository filters. Supply exactly one nonempty prompt source. Missing, conflicting, unreadable, invalid-UTF-8, empty, or whitespace-only prompts fail before workspace mutation. `--prompt-file` and `--permission` require `--t3`.

### Permissions and workspace behavior

The default permission is `full-access`. To choose a narrower mode:

```bash
aw create feature-auth-refresh --t3 --prompt-file task.md \
  --permission approval-required
```

`--permission` accepts `approval-required`, `auto-accept-edits`, or `full-access`. Arashi explicitly passes and reports the effective permission.

T3 uses the exact created parent checkout without creating another worktree. Arashi passes folder resolution, `--checkout current`, and `--open none`; no browser or desktop window opens automatically.

An explicit T3 handoff suppresses configured create launch/switch defaults. Combining it with explicit `--switch`, `--launch`, `--tab`, `--tmux`, `--sesh`, or `--herdr` fails before mutation.

With `--move-changes`, dispatch waits until every attempted move succeeds. A move failure preserves the workspace and recovery instructions without starting a T3 task.

## Find the new thread

Use the environment, project, and thread identifiers reported by Arashi to select the new thread in a connected T3 desktop or mobile client. The client must reach the same host environment. The command runs on the repository host, not on the phone, and cannot automatically navigate a mobile client.

Arashi reports workspace creation and task dispatch separately. If creation succeeds but handoff fails, the command exits nonzero and preserves the created worktrees.

## Recover a failed handoff

For a definite pre-dispatch failure that Arashi marks safe to retry, reuse the exact workspace with the same task and permission:

```bash
aw create feature-auth-refresh --conflict REUSE_EXISTING \
  --t3 --prompt-file task.md --permission approval-required
```

If dispatch is successful, active, or uncertain, inspect the reported workspace/project/thread in T3 before retrying. Arashi keeps a private receipt in the parent repository's Git common directory to prevent duplicate tasks. Only if reconciliation proves that no thread exists should you remove the exact reported receipt and its adjacent `.lock` file, if present, then retry against the reusable workspace.

<!-- markdownlint-disable MD033 -->

<details>
<summary>JSON output and local recovery details</summary>

Human output reports the workspace, effective permission, environment, project, thread, dispatch, and UI stages. Successful `--json` output returns the same stages at `data.t3Handoff`; handoff errors return them at `error.details.t3Handoff` alongside the successful creation results. Output excludes task text, task-derived titles, credentials, authenticated URLs, and raw bridge commands/output. Receipts store a task digest and sanitized identifiers, never task text or credentials.

Receipt-storage or prompt-cleanup errors preserve the known dispatch outcome and project/thread IDs. JSON includes recovery details at `error.details.t3HandoffRecovery`. If saving the final receipt fails, reconcile the outcome before retrying: the receipt may still say `dispatching`. If prompt cleanup fails, remove the reported private prompt directory. A successful dispatch must not be repeated.

A failed move before dispatch returns `T3_WORKSPACE_PREPARATION_FAILED` with the workspace and move recovery instructions.

</details>

<!-- markdownlint-enable MD033 -->

## Tested compatibility

The initial end-to-end spike covered macOS, Arashi 1.36.0, T3 server 0.0.42, and bridge handoff. Platform-specific privacy branches and argument construction have automated coverage; Windows, Linux, and mobile were not validated end to end for that release.

## Related

- [create command](/commands/create/#hand-off-to-t3-code)
- [Agents and specifications](/workflows/agents-and-specs/)
- [Integrations](/workflows/environment-integrations/)
