---
title: pull Command
description: Pull the latest changes across workspace repositories.
draft: false
sidebar:
  hidden: false
---

## What It's For

Update repositories in your workspace without entering each one manually.

## What It Does

- Runs pull operations across managed repositories.
- Brings local branches up to date with remote changes.
- Reloads workspace configuration after a selected parent repository is updated.
- Reconciles managed ignore rules for the active configured paths before continuing child operations.
- Reports which repositories succeeded or failed.
- Pulls each repository's refreshed configured remote base into its current branch when base policy exists.

## Usage

```bash
aw pull [options]
```

## Key Options

- `-o, --only <repo>` limit pull to repositories; repeat it, use commas, or mix both forms.
- `-g, --group <group>` limit pull to groups; repeat it, use commas, or mix both forms.
- `-v, --verbose` print full git output.
- `-j, --json` output machine-readable pull results.

## Examples

```bash
# Pull all eligible repositories
aw pull

# Pull selected repositories only
aw pull --only api --only web

# Pull infrastructure repositories only
aw pull --group infra

# Pull with detailed command output
aw pull --verbose

# Pull selected repositories and emit JSON
aw pull --only api --json
```

## Notes

- Repositories with no remote changes are skipped.
- Root `baseBranch` is the configured fallback; `meta.baseBranch` and `repos.<name>.baseBranch` override it for their owning repositories. Pull resolves and fetches that branch on the selected remote, compares it with `HEAD`, and uses the existing rollback-protected merge pull. It does not silently substitute the current upstream or remote default when a configured base is unavailable.
- When no effective base is configured, pull preserves its current-upstream behavior. A selected parent update reloads configuration before later child base resolution, so children use the active post-pull policy.
- `--group` targets configured semantic sets; with `--only`, it narrows the explicit repository selection by intersection.
- The parent repository follows the original `--only` and `--group` filters. It runs first only when those filters select it; `pull` does not pull the parent solely to refresh configuration.
- After a selected parent pull succeeds, Arashi reloads `.arashi/config.json`, reapplies the original filters to the post-pull repositories and groups, reconciles the resulting `reposDir` and `worktreesDir`, and then pulls the selected children. An unfiltered run uses all children in the reloaded config.
- If an original name or group filter no longer resolves after reload, `pull` stops before remaining child pulls with a structured selection failure. A newly configured child that is absent locally is not cloned implicitly; it is skipped with `aw clone` guidance.
- If the parent is excluded, or its pull fails and rolls back, child selection and reconciliation continue from the pre-pull configuration snapshot.
- Reconciliation honors effective tracked, repository-local, or global ignore rules. Missing safe rules use the clone's stored scope or the repository-local default; scope `none` leaves files unchanged and reports unignored paths. Arashi never writes global Git configuration.
- If a later child fails after a new parent configuration remains active, the managed ignore state required by that configuration is retained. State needed only by an abandoned, rolled-back parent update is restored.
- Pull failures or manual-update states return a non-zero exit code.
- In JSON mode, stdout contains one result document; verbose diagnostics stay out of stdout. Structured results include managed ignore sources, applied or planned changes, warnings, skips, and final rollback state when relevant.

## Agent Notes

- Use `aw pull` before starting a new coordinated worktree when `aw status` shows repositories are behind.
- Prefer `--group <group>` when the user has scoped work to a known semantic set, or `--only <repo>` when the work is limited to one repository.
- Do not assume child selection is fixed when the selected parent can pull a changed config; inspect the post-reload structured results.
- Re-run `aw status` after pulling to confirm the workspace is ready for edits.

## Related Commands

`pull` coordinates configured child repositories and therefore requires configured mode. From standalone mode, run ordinary `aw init` to upgrade; see the [Standalone Repository workflow](/workflows/standalone/).

- [push](/commands/push/)
- [sync](/commands/sync/)
- [status](/commands/status/)
- [Config workflow](/workflows/config/)
