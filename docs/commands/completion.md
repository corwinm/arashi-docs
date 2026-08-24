---
title: completion Command
description: Generate native Bash, Zsh, Fish, or PowerShell completion for Arashi commands and workspace values.
draft: false
sidebar:
  hidden: false
---

## What It's For

Generate native shell completion for Arashi commands, options, and safe workspace-aware values.

## Usage

```bash
aw completion <bash|zsh|fish|powershell>
```

The command writes a shell script to stdout. Source it from your shell startup file or current session; it does not edit startup files itself.
Generated completion registers both `arashi` and `aw` with the same candidates and descriptions; documented activation examples use `aw`.

## Examples

```bash
# Bash
source <(command aw completion bash)

# Zsh
source <(command aw completion zsh)

# Fish
command aw completion fish | source

# PowerShell
aw completion powershell | Out-String | Invoke-Expression
```

Use `command aw` in activation code so completion generation bypasses any installed `arashi` wrapper function.

## Candidate Behavior

Static command and option completion works outside an Arashi workspace. Dynamic completion augments it from local workspace state with repositories, configured groups, worktrees, branches, supported shells, and constrained option values where the current command accepts them.

Dynamic ownership is exact: every `--only` segment completes configured repositories and every `--group` segment completes configured groups; `switch [filter]` and `remove [target]` complete a branch, worktree name, or path; `move --from` and `move --to` complete workspace branch, name, or path references; and `--path` narrows switch/remove suggestions to exact worktree paths. Supported-shell arguments and explicitly finite options complete only their declared values.

Dynamic lookup is local and read-only, with a 200 ms whole-query budget. It does not perform network requests or mutate workspace state. It does not execute hooks, does not prompt, and does not start child operations. Repeated or comma-separated repository and group selectors complete only the active segment and preserve the prefix already entered.

The canonical completion model retains candidate descriptions for every supported shell. Zsh, Fish, and PowerShell can display per-candidate descriptions. Bash retains the canonical descriptions but native Bash programmable completion does not natively display per-candidate descriptions.

## Troubleshooting

- If static suggestions are missing, confirm `command aw completion <shell>` prints a script, source it again, and restart the shell if needed.
- Outside a workspace, when local discovery fails, or when the 200 ms whole-query budget expires, completion silently returns no dynamic candidates while static command and option completion keeps working.
- Empty dynamic results do not trigger a network fallback: completion does not perform network requests or mutate workspace state.
- If an installed shell wrapper behaves differently from direct invocation, keep `command aw` in the completion activation line so generation bypasses the wrapper.

## Related

- [shell command](/commands/shell/) for parent-shell switching and managed activation.
- [switch command](/commands/switch/) for worktree selection behavior.
