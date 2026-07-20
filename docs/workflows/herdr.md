---
title: Herdr
description: Open, focus, and reuse Arashi-managed worktrees as Herdr workspaces without transferring Git lifecycle ownership.
draft: false
sidebar:
  hidden: false
  order: 7
---

Use Herdr when you want an Arashi-created worktree to open as a persistent Herdr workspace with repository provenance, focus, and reuse.

## Prerequisites

- Herdr v0.7.4, the version used to verify this integration, must be installed and available as `herdr` on `PATH`.
- A Herdr default session/server and its local socket must be running and reachable.
- The repository must have a non-bare main checkout. Herdr needs that checkout as its source; a bare repository alone is not sufficient.
- Arashi must already know or create the target Git worktree. Herdr does not create it for this workflow.

Check the installed version before troubleshooting the integration:

```bash
herdr --version
```

## Choose Herdr Explicitly

Open an existing worktree from any terminal that can reach the running Herdr session:

```bash
arashi switch --herdr feature-auth
```

Create worktrees and open the primary created worktree in Herdr:

```bash
arashi create feature-auth --herdr
```

On `create`, `--herdr` implies post-create launch, like `--sesh`. An explicit `--herdr` takes precedence over `--no-launch`. Do not combine it with `--sesh`; on `switch`, do not combine it with `--sesh`, an explicit IDE flag, or `--cd`. Arashi rejects conflicting explicit launchers before launch, and it rejects `create --json --herdr` before worktree creation. `switch --json --herdr` remains a non-mutating unsupported mode.

## Configure Herdr As The Default

Set `launchMode` to `herdr` for normal terminal create and switch flows:

```json
{
  "defaults": {
    "create": {
      "launch": true,
      "launchMode": "herdr"
    },
    "switch": {
      "mode": "launch",
      "launchMode": "herdr"
    }
  }
}
```

Editor-scoped create defaults under `defaults.editors.<host>.create` also accept `launchMode: "herdr"`. Configured Herdr works outside a Herdr-managed pane as long as the CLI can reach the running default session.

- `arashi switch --no-default-launch ...` bypasses configured Herdr for that invocation and returns to automatic launch resolution.
- `arashi switch --no-cd ...` forces launch behavior when the configured switch mode would otherwise change the parent shell directory.
- `arashi create --no-launch ...` suppresses configured Herdr unless explicit `--herdr` is also present.

## Automatic Detection And Precedence

With no explicit or configured launcher, Arashi automatically selects Herdr only when trimming `HERDR_ENV` produces the exact string `1`. Values such as an empty string, `0`, or `true` are not Herdr signals.

Launcher resolution is:

1. switch behavior (`--cd`, `--no-cd`, configured `mode`, and shell integration)
2. one explicit launcher
3. configured `launchMode`, unless its command-specific opt-out applies
4. automatic tmux
5. automatic Herdr
6. cmux, integrated IDE, terminal app, and generic fallback behavior

Therefore an explicit or configured Herdr mode overrides automatic environment detection. In automatic mode, a tmux session nested inside Herdr retains tmux behavior; otherwise Herdr precedes cmux, IDE, terminal-app, and generic fallbacks. Once Herdr is selected by any route, a Herdr failure does not silently open another launcher.

## Verified v0.7.4 Contract

For each target, Arashi resolves the repository's non-bare main checkout through Git and invokes the argv equivalent of:

```bash
herdr worktree open \
  --cwd <non-bare-main-checkout> \
  --path <existing-linked-worktree> \
  --label '<repo-name>: <branch-name>' \
  --focus \
  --json
```

The source path, target path, and label are separate arguments, so spaces and shell-significant characters are not interpolated by a shell. If the selected target is itself the non-bare main checkout, Arashi uses that path for both `--cwd` and `--path`.

Arashi accepts success only when all of these conditions hold:

- the Herdr process exits successfully
- stdout is valid JSON
- `result.type` is exactly `"worktree_opened"`
- `result.already_open` is a boolean
- `result.workspace.workspace_id` is a non-empty string

The first open normally reports `already_open: false`. Repeating the request for the same checkout reports `already_open: true` with the same workspace ID, focuses the existing workspace, and reapplies Arashi's deterministic `<repo-name>: <branch-name>` label. Herdr keeps the linked workspace grouped with the source checkout through its native Git provenance.

## Ownership And Repository Limits

Arashi remains the sole owner of Git worktree creation and removal. The integration only opens an existing checkout. It never uses:

- `herdr worktree create`
- `herdr worktree remove`
- `herdr workspace create` as a fallback

Configured and standalone linked-worktree flows are supported when Git can resolve a non-bare main checkout. A bare repository with no non-bare main checkout cannot provide Herdr's required source path. `switch --herdr` then fails before Herdr runs. If post-create Herdr launch fails for this reason—or for any external Herdr error—Arashi preserves every successfully created worktree and reports creation as complete with launch failed; it does not roll back Git work or try another launcher.

## Troubleshooting

Arashi reports `LAUNCH_FAILED` with the selected worktree and attempted command instead of falling through when:

- **The executable is missing:** install Herdr v0.7.4 and ensure `herdr` is on the invoking process's `PATH`.
- **The server or socket is unavailable:** start the Herdr default session/server and confirm its local socket is reachable from the same user environment.
- **Herdr exits non-zero or returns an API error:** read the included stderr/stdout guidance and verify the target and source checkout still exist.
- **The response is invalid:** a malformed JSON document, unexpected result type, non-boolean `already_open`, or missing workspace ID indicates a v0.7.4 contract mismatch. Update the components deliberately rather than bypassing validation.
- **The source is bare:** create or use a normal non-bare main checkout for the repository; Arashi will not replace provenance-aware open with a generic workspace.

## Optional Cleanup Before Remove

`arashi remove` intentionally does not close Herdr workspaces. A workspace can contain agents or unsaved terminal state, so automatic cleanup could destroy useful work. After a Git worktree is removed, its Herdr workspace may remain stale; inspect it and close it manually only when its state is no longer needed:

```bash
herdr workspace list
herdr workspace close <workspace-id>
```

If your team has explicitly chosen automatic cleanup, use a trusted `pre-remove.sh` hook so the workspace can be identified while the checkout still exists. Herdr v0.7.4's `workspace list` output is JSON, so this opt-in example matches the exact checkout path before closing the workspace:

```bash
#!/bin/sh
set -eu

workspace_id=$(
  herdr workspace list |
    jq -r --arg path "$ARASHI_WORKTREE_PATH" \
      '.result.workspaces[] | select(.worktree.checkout_path == $path) | .workspace_id' |
    head -n 1
)

if [ -n "$workspace_id" ]; then
  herdr workspace close "$workspace_id"
fi
```

Review the matched workspace and your hook scope before enabling this mutation. Never substitute `herdr worktree remove`: Git worktree removal belongs to Arashi.

## Related References

- [switch command](/commands/switch/)
- [create command](/commands/create/)
- [remove command](/commands/remove/)
- [Config workflow guide](/workflows/config/)
- [Hooks workflow guide](/workflows/hooks/)
