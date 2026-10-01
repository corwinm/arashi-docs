---
title: T3 Code
description: Start a T3 Code task in a new workspace or an existing checkout.
draft: false
sidebar:
  hidden: false
---

Start a T3 Code thread in a new coordinated workspace while your original conversation stays in its current checkout. Arashi creates the worktrees and starts your task; it does not monitor or complete that task.

## Set up T3 Code

Run Arashi on the host containing your repositories and a running local T3 environment. Creating a coordinated workspace requires configured Arashi; switching to an existing checkout also supports standalone repositories. You need matching supported T3 CLI and server versions. See [Compatibility](#compatibility) for adapter requirements.

Install a compatible release from the [official T3 releases](https://github.com/pingdotgg/t3code/releases) and check the CLI:

```bash
t3 --version
```

The official CLI is required for authentication, including when the desktop app manages the server. Arashi creates a five-minute session for the handoff and revokes it when finished.

Set up and authenticate your provider on the same host using T3's [provider setup](https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md).

Arashi uses `~/.t3`, or `T3CODE_HOME` when set. For another profile, pass `--t3-base-dir /absolute/path/to/t3-data`. For a CLI outside `PATH`, pass `--t3-cli /absolute/path/to/t3`. The selected profile must belong to a running local environment on the repository host. Remote environments and custom development layouts without T3's runtime file are unsupported. If preflight fails, check the selected profile, CLI/server versions, authentication, and whether the intended environment is running.

## Use an existing checkout

Select an existing parent, child, or standalone checkout and start a task there:

```bash
aw switch --path /path/to/worktree --t3 --prompt-file task.md

# Start a deliberate later session after the previous handoff is resolved
aw switch --path /path/to/worktree --t3 "Review the changes" --t3-intent review-1
```

Switch creates no worktrees and moves no changes. Omitted `--t3-intent` means `default`; reuse of the same intent is a retry, not a new session. An accepted retry returns the saved outcome without resubmitting. Choose another literal ID only for a deliberate new session, never to bypass an uncertain handoff. Retries retain the saved environment, model/options, and permission even when defaults change.

Use `--repos` for child-only selection or `--all` for both scopes in configured workspaces. Only the selected checkout receives the task. Switch bypasses configured launch modes and does not change the parent shell directory. See the [switch command](/commands/switch/#hand-off-to-t3-code) for options, exact selection, portable intent IDs, JSON output, and recovery. Switch has no `--dry-run`.

## Start a task

To create a new coordinated workspace:

Supply exactly one prompt, either inline or through a nonempty UTF-8 file:

```bash
aw create feature-auth-refresh --t3 "Implement the accepted design"

# For a longer task
aw create feature-auth-refresh --t3 --prompt-file task.md
```

Make the task self-contained: include the objective, accepted decisions, relevant issue or file links, and completion expectations such as tests and documentation. Arashi does not infer conversation history.

Include the coordinating parent repository when using repository filters. T3 uses the exact created parent checkout without creating another worktree. When using `--move-changes`, all attempted moves must succeed before the task starts.

Use `--dry-run` to preview creation. It checks the CLI version and read-only runtime metadata without creating a session, worktrees, or a task. Authentication and live model validation happen during the actual handoff.

### Permissions

The default permission is `full-access`. Choose `approval-required` or `auto-accept-edits` when needed:

```bash
aw create feature-auth-refresh --t3 --prompt-file task.md \
  --permission approval-required
```

T3 handoff suppresses configured create launch/switch defaults. Do not combine it with `--launch`, `--switch`, `--tab`, `--tmux`, `--sesh`, or `--herdr`. See the [create command](/commands/create/#hand-off-to-t3-code) for the full flag contract.

## Choose a model

Provider, model, and effort flags are optional. Without Arashi overrides or saved preferences, the handoff uses T3's project/server selection and available catalog defaults. If selection is ambiguous, the diagnostic asks you to choose explicitly.

To override the selection for one task:

```bash
aw create feature-auth-refresh --t3 --prompt-file task.md \
  --t3-provider codex --t3-model gpt-6.1-sol --t3-effort medium
```

These are example values; the provider, model, and effort must be available in T3. `--t3-provider` accepts a configured instance ID, or a driver name identifying exactly one available instance. Model aliases are supported. Pinning the same provider and model preserves T3's saved options; explicit effort overrides its saved value. Changing provider or model uses catalog defaults for omitted options.

### Save preferences

Add `defaults.t3` to your personal `~/.arashi/config.json`. A user configuration file requires `version` metadata:

```json
{
  "version": "1.0.0",
  "defaults": {
    "t3": {
      "provider": "codex",
      "model": "gpt-6.1-sol",
      "effort": "medium"
    }
  }
}
```

Use the same section in workspace `.arashi/config.json` for shared preferences. Optional `baseDir` (absolute path) and `cli` fields select the profile and executable. Keep credentials out of these files.

See [T3 Code preferences in the configuration reference](/reference/configuration/#t3-code-preferences) for all fields, validation, precedence, and effective-value diagnostics. Changing preferences affects future handoffs, not existing threads.

## Find the new thread

Arashi reports the workspace path, effective permission and model selection, environment, project, and thread identifiers. Select the reported project/thread manually in a T3 desktop, web, or mobile client connected to that same host environment. No browser or desktop window opens automatically. The original conversation remains attached to its original checkout; changing a terminal directory does not move it. The command runs on the repository host, including when you initiate it from a connected phone.

## Recover a failed handoff

For switch recovery, follow the [saved intent guidance](/commands/switch/#prerequisites-output-and-recovery). The following recovery procedure applies to create.

Arashi reports workspace creation and task dispatch separately. If creation succeeds but handoff fails, it preserves the worktrees and exits nonzero.

When Arashi marks a failure safe to retry, reuse the exact workspace with the same task, permission, and selection. Repeat your original overrides. For example, if the original command used these values:

```bash
aw create feature-auth-refresh --conflict REUSE_EXISTING \
  --t3 --prompt-file task.md --permission approval-required \
  --t3-provider codex --t3-model gpt-6.1-sol --t3-effort medium
```

Arashi records handoff progress to prevent duplicate tasks. A retry reuses recorded project/thread identifiers and the saved model selection. Conflicting flags or Arashi preferences require reconciliation; changes to T3 defaults do not replace the saved selection. If acceptance is uncertain, a retry can confirm the recorded message but never submits that task again. A successful receipt blocks another handoff.

Follow the reported recovery instructions and inspect the reported thread before removing any receipt or lock. Confirm an interrupted process has stopped and the original task was never accepted before clearing only the exact reported recovery files. Never clear recovery files for other workspaces or repeat a successfully dispatched task.

For automation, `--json` returns handoff stages at `data.t3Handoff`, or `error.details.t3Handoff` after a handoff failure. Recovery details appear at `error.details.t3HandoffRecovery` when applicable.

## Compatibility

The adapter accepts stable T3 releases from 0.0.43 onward when the CLI and server versions match and the environment provides orchestration protocol 1 with the required authentication and model catalog. Compatibility is checked during each handoff. Nightly/prerelease builds and incompatible protocols are rejected. Create handoff has been verified end to end on macOS arm64 using `gpt-6.1-sol` with medium effort; this is not evidence for switch handoff. Windows, Linux, and mobile have not been validated end to end against a real provider.

## Related

- [create command](/commands/create/#hand-off-to-t3-code)
- [switch command](/commands/switch/#hand-off-to-t3-code)
- [Agents and specifications](/workflows/agents-and-specs/)
- [Integrations](/workflows/environment-integrations/)
