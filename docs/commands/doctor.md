---
title: doctor Command
description: Diagnose Arashi workspace health without changing repositories or configuration.
draft: false
sidebar:
  hidden: false
---

## What It's For

Run a safe, read-only health check when an Arashi workspace looks wrong or before an agent starts troubleshooting. `aw doctor` gathers workspace, repository, worktree metadata, hook, shell integration, and install/update hints into one actionable report.

`doctor` does not repair problems. It recommends follow-up commands such as `aw status`, `aw clone`, `aw prune --dry-run`, `aw shell install`, or `aw update --dry-run` when those commands are relevant.

## What It Checks

`aw doctor` reports diagnostic findings for conditions such as:

- running outside an Arashi workspace, with suggestions to initialize one or switch into one
- missing, unreadable, malformed, or invalid Arashi workspace configuration
- configured repositories that are missing from disk
- dirty repositories with staged, unstaged, or untracked changes
- detached heads, missing upstreams, upstream divergence, missing remote refs, configured-base drift/unavailability, or default-branch drift
- repository status checks that fail
- stale Git worktree metadata that `aw prune --dry-run` can review
- configured lifecycle hook files that are missing, not executable, unsafe, or unsupported
- safe managed repository or worktree paths that have no effective ignore rule
- stale entries in Arashi-owned ignore blocks, invalid clone-local ignore scope, and paths unsafe for automatic rules
- shell integration or install/update hints when they can be detected safely

Environment checks are conservative. If shell integration or install state cannot be determined safely, `doctor` avoids treating the unknown state as a blocking failure.

The managed ignore checks use Git's effective tracked, repository-local, and global sources. Findings identify the managed path, effective scope or stored preference when available, and suggested repair such as rerunning a lifecycle command or selecting `aw init --ignore-scope local|tracked|none`. An unsafe-path finding is distinct from a missing safe rule. `doctor` does not repair ignore files, remove stale owned entries, replace an invalid `arashi.ignoreScope`, or write global Git configuration.

## Usage

```bash
aw doctor [options]
```

## Options

- `-j, --json` emit one machine-readable JSON envelope instead of grouped human output.
- `--t3` check only T3 prerequisites, in preview mode by default.
- `--t3-authenticated` explicitly consent to administrative authentication for bounded T3 reads.
- `--path <existing-checkout>` select one existing registered Git checkout root.
- `--t3-cli <executable>` select a command name or absolute executable path.
- `--t3-base-dir <absolute-directory>` select the local T3 profile directory.
- `--t3-provider <instance-or-unambiguous-driver>` select a provider instance or an unambiguous driver name.
- `--t3-model <slug-or-alias>` select a catalog model slug or alias.
- `--t3-effort <catalog-value>` select a supported catalog effort value.

All T3-specific options, including `--path`, require `--t3`. Doctor accepts no positional arguments.

## Examples

```bash
# Run the default human-readable workspace health check
aw doctor

# Produce structured findings for an agent or script
aw doctor --json

# Review detailed repository state after doctor reports repository findings
aw status --verbose

# Preview stale worktree cleanup after doctor reports stale metadata
aw prune --dry-run
```

## T3 Readiness

Check prerequisites for an existing checkout without creating a task:

```bash
aw doctor --t3 --path /path/to/checkout
aw doctor --t3 --path /path/to/checkout --t3-authenticated --json
```

Replace `/path/to/checkout` with an existing parent, child, or standalone Git checkout root, not a future worktree or a subdirectory. Without `--path`, doctor selects the current Git checkout; outside a checkout it checks global T3 prerequisites without claiming checkout readiness.

This mode skips ordinary workspace-health collectors. It does not repair or migrate configuration, create worktrees or projects, create threads or tasks, dispatch messages, or write handoff receipts. Ordinary `aw doctor` remains unchanged.

### Preview and consent

Preview checks the selected checkout/settings, CLI, local runtime, and public version/protocol compatibility. It does not acquire an authenticated session. Authentication, the live catalog, project defaults, and effective selection remain deferred; `preview_passed` is not authenticated readiness.

`--t3-authenticated` explicitly authorizes use of the selected profile's **administrator authority** to issue a short-lived read session. After a passing preview and identity recheck, doctor performs bounded authenticated reads of the live catalog and the exact existing project's defaults. No separate confirmation prompt is required, including in JSON mode. Use a profile whose administrative authority you intend to authorize; see [T3 setup](/workflows/t3-code/#set-up-t3-code).

### Settings and selection

For each authored setting, precedence is explicit doctor flags > workspace `defaults.t3` > personal `defaults.t3`. The profile falls back to `T3CODE_HOME`, then `~/.t3`; the CLI defaults to `t3` on `PATH`. Keep credentials out of Arashi configuration. See [T3 preferences](/reference/configuration/#t3-code-preferences).

Authenticated selection uses applicable authored provider/model/effort choices over the exact project's saved selection, then server selection and eligible catalog defaults. A provider instance ID binds that exact instance: an unavailable or disabled instance is not rerouted to a driver alias. A driver name must identify exactly one supported eligible instance. Ambiguous providers, unavailable models, and unsupported effort/options block the check. Keeping the same provider/model preserves applicable saved options; changing either uses catalog defaults for omitted options.

If the checkout has no matching existing T3 project, doctor does not create one. Project defaults stay deferred and the resolved selection is **provisional**, even after authentication; this cannot establish checkout readiness. Provider warnings, unknown authentication, or stale/unknown provider observations also leave readiness unknown rather than guaranteeing a task can run.

### Cleanup and results

Doctor revokes only its own temporary session and verifies that exact session ID is absent from a validated session list. A successful revoke alone is not verified cleanup. Cleanup uses an independent bounded attempt after check failure, timeout, or recoverable interruption; forced process termination cannot guarantee cleanup.

Check observations and cleanup are reported independently. Successful observations remain visible when cleanup fails or cannot be verified, but the command exits **`1`** in either case. Do not revoke unrelated sessions or treat the session's expiry as proof of cleanup.

Human and JSON output report `checkMode`, readiness, bounded stage findings, selection provenance, provider prerequisites, and cleanup state. JSON uses `data` on success and `error.details` on failure; `mode` is `t3`. Output is screened rather than exposing tokens, administrative credentials, or raw server responses.

- `preview_passed`: public prerequisite checks passed; authenticated checks remain deferred.
- `checkout_verified`: the exact existing project, effective selection, and fresh provider prerequisites were verified.
- `global_verified`: global authenticated prerequisites were verified, with no selected checkout.
- `unknown`: required checkout/project or provider evidence remains deferred or unknown.
- `blocked`: a prerequisite check failed.

Always inspect cleanup separately: `not_attempted`, `verified`, `failed`, or `unknown`. Exit status is `0` when there are no blocking findings and cleanup has not failed or become unknown; otherwise it is `1`. Warnings or unknown readiness can therefore coexist with exit `0`. Neither exit `0` nor verified prerequisites guarantee task execution.

## Finding Severities

Every finding has a severity:

- `error` means a blocking health problem or required diagnostic failure. `aw doctor` exits non-zero when any `error` finding is present.
- `warning` means a non-blocking condition that likely needs attention, such as local changes or branch state that may affect coordination.
- `info` means an advisory hint or an unknown-but-safe state, such as shell integration status that cannot be determined reliably.

Human output groups findings by severity or diagnostic category and shows the finding code, affected scope, message, and suggested commands when available. If no findings are detected, `doctor` reports that no workspace health findings were found.

## Exit Behavior

Ordinary `aw doctor` is non-mutating: it does not change configuration, repositories, worktrees, hooks, shell startup files, install state, or update state. T3 preview is read-only; authenticated T3 mode additionally issues and cleans up its own temporary session as described above.

The command exits with status code `0` when it completes required checks and finds no blocking `error` findings. It exits non-zero when one or more `error` findings are present or when a required diagnostic phase cannot complete.

Warnings and informational findings do not make the command fail by themselves.

Configured-base findings use stable warning codes `REPOSITORY_CONFIGURED_BASE_BEHIND` and `REPOSITORY_CONFIGURED_BASE_UNAVAILABLE`. Structured details retain the configured source, logical branch, selected remote/ref when known, and divergence or failure information. When base and remote default resolve to the same target, doctor emits the configured-base finding once instead of duplicating a default-branch diagnostic. Standalone doctor remains unchanged.

## JSON Mode

Use `--json` when automation or agents need stable diagnostics without scraping human output. JSON mode writes exactly one JSON document to stdout using the standard Arashi envelope and suppresses progress text, colors, tables, banners, and prompts.

On success with no blocking findings, the envelope has `ok: true`. When blocking findings are present, the envelope has `ok: false` and the process exits non-zero. In both cases, the findings and summary counts are available in structured data.

The data shape includes:

```json
{
  "ok": true,
  "command": "doctor",
  "schemaVersion": 1,
  "data": {
    "workspaceRoot": "/path/to/workspace",
    "checkedCategories": [
      "workspace",
      "configuration",
      "repository",
      "worktree",
      "hook",
      "shell",
      "install"
    ],
    "findings": [
      {
        "code": "REPOSITORY_DIRTY",
        "severity": "warning",
        "category": "repository",
        "scope": "repository:arashi-docs",
        "message": "Repository 'arashi-docs' has uncommitted changes.",
        "details": {
          "repository": "arashi-docs",
          "path": "/path/to/workspace/repos/arashi-docs",
          "changes": {
            "staged": 1,
            "unstaged": 2,
            "untracked": 0
          }
        },
        "suggestedCommands": [
          "aw status --verbose",
          "git -C /path/to/workspace/repos/arashi-docs status"
        ]
      }
    ],
    "summary": {
      "error": 0,
      "warning": 1,
      "info": 0,
      "total": 1
    }
  },
  "warnings": []
}
```

When `ok` is `false`, findings and summary counts are included in the structured failure details so consumers can branch on stable `code`, `severity`, `category`, and `scope` fields instead of parsing prose. Extra fields such as `details`, paths, repository names, hook names, and `suggestedCommands` are additive.

## Agent Notes

- Prefer `aw doctor --json` as the first workspace-health diagnostic command for agents.
- Treat `error` findings as blockers before mutating recovery commands.
- Use suggested commands from findings as follow-up checks, and keep mutating commands explicit and scoped.
- For managed ignore findings, preserve user-authored and global rules. Use the suggested lifecycle or `init --ignore-scope` repair instead of editing an effective source blindly.
- Use [`aw exec`](/commands/exec/) for additional repeated inspection only when `doctor` and built-in commands do not cover the question.

## Related Commands

`doctor` checks standalone repository state without repairing ignore rules or creating configuration. See the [One Repository](/getting-started/standalone/).

- [status](/commands/status/) for detailed repository and branch state.
- [clone](/commands/clone/) for missing configured repositories.
- [prune](/commands/prune/) for stale Git worktree metadata.
- [shell](/commands/shell/) for shell integration setup.
- [update](/commands/update/) for CLI update checks.
