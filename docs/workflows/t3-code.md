---
title: T3 Code
description: Create an Arashi workspace and start a T3 Code task with your preferred model.
draft: false
sidebar:
  hidden: false
---

Start a separate T3 Code thread in a new coordinated workspace while your original conversation stays in its current checkout. Arashi creates the worktrees and dispatches your task; it does not monitor or complete that task.

## Set up native T3 handoff

Arashi talks directly to official T3 interfaces. The third-party bridge is no longer required or invoked. Run Arashi on the host containing your repositories and a running local T3 environment. Handoff requires a configured coordinated Arashi workspace; ordinary worktree creation has no T3 prerequisite.

Install [official T3](https://github.com/pingdotgg/t3code/releases/tag/v0.0.43) separately and check its CLI:

```bash
t3 --version
# Expected: t3 v0.0.43
```

The supported release is **T3 0.0.43, orchestration protocol 1**, with a matching official CLI and server. Arashi never downloads components. The official `t3 auth session issue` / `revoke` commands provide headless authentication: Arashi issues a five-minute session, verifies its scopes, and revokes that session when finished. It never reads private T3 databases or copies desktop credentials. The desktop app's private bootstrap interface is not a supported external authentication surface, so an installed official CLI is still required even when the desktop owns the server.

Arashi selects `~/.t3` by default, or `T3CODE_HOME` when set, and discovers the running environment from `userdata/server-runtime.json`. Use `--t3-base-dir /absolute/path/to/t3-data` for a different profile and `--t3-cli /absolute/path/to/t3` for an installed CLI outside `PATH`. The data directory must belong to the running environment on this repository host. Arashi does not scan ports or guess between profiles. Missing, stale, unreachable, unsupported, or unauthenticated environments fail during preflight. Restart the intended T3 environment and verify its selected data directory. Remote routes and custom dev layouts without this runtime file are not supported by this adapter.

Install and authenticate your provider on the same host through T3's [provider setup](https://github.com/pingdotgg/t3code/blob/v0.0.43/docs/user/install.md). A connected desktop or phone does not supply the host's provider credentials.

## Choose model defaults

For one handoff, choose a provider instance, model, and supported effort explicitly:

```bash
aw create feature-auth-refresh --t3 --prompt-file task.md \
  --t3-provider codex --t3-model gpt-6.1-sol --t3-effort medium
```

These values are examples. Arashi validates the selection against T3's live catalog. `--t3-provider` accepts a configured instance ID, or a driver name when it identifies exactly one available instance. Model aliases are resolved to the catalog slug. Effort uses the advertised `reasoningEffort` or `effort` option and must be supported by that model.

Save personal preferences under `defaults.t3` in `~/.arashi/config.json`:

```json
{
  "defaults": {
    "t3": {
      "provider": "codex",
      "model": "gpt-6.1-sol",
      "effort": "medium"
    }
  }
}
```

The same section is supported in workspace `.arashi/config.json` when the choices should be shared. Add it to the existing configuration rather than replacing repository definitions. Optional `baseDir` (absolute path) and `cli` fields select the local T3 profile and installed official executable; credentials do not belong in either file.

Precedence is per field: explicit flags → workspace `defaults.t3` → user `defaults.t3` → T3 project selection → T3 server selection → unambiguous catalog defaults. Workspace model settings retain unrelated personal effort settings. If no provider or model can be chosen unambiguously, Arashi asks for an explicit selection through its diagnostic; it has no hardcoded model fallback. The reported selection is the effective configured instance, model slug, and options. Changing preferences affects future handoffs, not existing threads.

### Migrate saved bridge preferences

Existing `t3code` preferences belong to the former third-party bridge. Arashi does not read or modify that configuration. Copy the provider/model you chose into `defaults.t3.provider` / `model`, and map the bridge's `thinkingEffort` to `defaults.t3.effort`, or supply the flags above. Verify that the current T3 catalog supports those values. Existing bridge-era receipts continue to block dispatch until you reconcile the old task; removing the bridge does not authorize another submission.

## Create and hand off a task

```bash
aw create feature-auth-refresh --t3 "Implement the accepted design"

# For a longer task, use a UTF-8 file
aw create feature-auth-refresh --t3 --prompt-file task.md
```

Make the task self-contained: include the objective, accepted decisions, relevant issue or file links, and completion expectations such as tests and documentation. Arashi does not infer or scrape conversation history.

Include the coordinating parent repository when using repository filters. Supply exactly one nonempty prompt source. Missing, conflicting, unreadable, invalid-UTF-8, empty, or whitespace-only prompts fail before workspace mutation. `--prompt-file`, `--permission`, and all `--t3-*` selection flags require `--t3`.

### Permissions and workspace behavior

The default permission is `full-access`. To choose a narrower mode:

```bash
aw create feature-auth-refresh --t3 --prompt-file task.md \
  --permission approval-required
```

`--permission` accepts `approval-required`, `auto-accept-edits`, or `full-access`. Arashi explicitly passes and reports the effective permission.

T3 uses the exact created parent checkout without creating another worktree. Arashi uses that checkout as the project root, sets the thread worktree path to null, and submits no T3 worktree bootstrap. No browser or desktop window opens automatically.

An explicit T3 handoff suppresses configured create launch/switch defaults. Combining it with explicit `--switch`, `--launch`, `--tab`, `--tmux`, `--sesh`, or `--herdr` fails before mutation.

With `--move-changes`, dispatch waits until every attempted move succeeds. A move failure preserves the workspace and recovery instructions without starting a T3 task.

## Find the new thread

Use the environment, project, and thread identifiers reported by Arashi to select the new thread in a connected T3 desktop or mobile client. The client must reach the same host environment. The command runs on the repository host, not on the phone. UI mode is `none`: desktop reveal and exact-thread navigation are both skipped. Revealing an app would not prove navigation to the new thread; core dispatch is independent of UI.

Arashi reports workspace creation and task dispatch separately. If creation succeeds but handoff fails, the command exits nonzero and preserves the created worktrees.

## Recover a failed handoff

For a definite pre-dispatch failure that Arashi marks safe to retry, reuse the exact workspace with the same task and permission:

```bash
aw create feature-auth-refresh --conflict REUSE_EXISTING \
  --t3 --prompt-file task.md --permission approval-required
```

A native preparation retry first locates the recorded project/thread identifiers, preserving partial success. If task acceptance is uncertain (for example, the server accepted it before a timeout), rerunning with the same intent can confirm the saved message in the saved thread, but never submits that uncertain task again. Missing/deleted/changed identifiers, or changed prompt, permissions, model, or effort, require reconciliation. A successful receipt blocks another handoff.

Receipts live in the parent repository's Git common directory with owner-only permissions. A retained `.lock` may represent an active process or an interrupted run. Confirm that the owning process has stopped and reconcile the reported T3 identifiers before removing only that exact lock; Arashi never steals it automatically. Bridge-era receipts block native retries, including old failed receipts. Only after verifying that the original task was never accepted should you remove the exact reported receipt (and stale lock, if present) and begin a fresh handoff. Never remove receipts or locks for other workspaces.

<!-- markdownlint-disable MD033 -->

<details>
<summary>JSON output and local recovery details</summary>

Human output reports the workspace, effective permission and model selection, environment, project, thread, dispatch, and UI stages. Successful `--json` output returns the same stages at `data.t3Handoff`; handoff errors return them at `error.details.t3Handoff` alongside the successful creation results. Output excludes task text, task-derived titles, credentials, authenticated URLs, and raw transport commands/output. Receipts store a task digest and sanitized identifiers, never task text or credentials.

Receipt-storage, session-revocation, or lock-cleanup errors preserve the known dispatch outcome and project/thread IDs. JSON includes recovery details at `error.details.t3HandoffRecovery`. If saving the final receipt fails, reconcile the outcome before retrying: the receipt may still say `dispatching`. Task text travels only in the authenticated request body; there is no temporary prompt copy to clean up. An unrevoked Arashi session expires within five minutes. A successful dispatch must not be repeated.

A failed move before dispatch returns `T3_WORKSPACE_PREPARATION_FAILED` with the workspace and move recovery instructions.

</details>

<!-- markdownlint-enable MD033 -->

## Tested compatibility

Native handoff targets official T3 0.0.43 and orchestration protocol 1. A bounded macOS arm64 smoke covers coordinated parent/child creation, `gpt-6.1-sol` with medium effort, exact-checkout dispatch, provider acknowledgement, duplicate prevention, and test-owned cleanup. Automated tests cover transport/auth/discovery, partial success and uncertainty, receipt durability/locking, bridge-era protection, and Windows owner-only ACL branches. Windows, Linux, and mobile have not been validated end to end.

## Related

- [create command](/commands/create/#hand-off-to-t3-code)
- [Agents and specifications](/workflows/agents-and-specs/)
- [Integrations](/workflows/environment-integrations/)
