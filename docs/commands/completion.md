---
title: completion Command
description: Generate native Bash, Zsh, or Fish completion for Arashi commands and workspace values.
draft: false
sidebar:
  hidden: false
---

## What It's For

Generate native shell completion for Arashi commands, options, and safe workspace-aware values.

## Usage

```bash
arashi completion <bash|zsh|fish>
```

The command writes a shell script to stdout. Source it from your shell startup file or current session; it does not edit startup files itself.

## Examples

```bash
# Bash
source <(command arashi completion bash)

# Zsh
source <(command arashi completion zsh)

# Fish
command arashi completion fish | source
```

Use `command arashi` in activation code so completion generation bypasses any installed `arashi` wrapper function.

## Candidate Behavior

Static command and option completion works outside an Arashi workspace. Dynamic completion augments it from local workspace state with repositories, configured groups, worktrees, branches, supported shells, and constrained option values where the current command accepts them.

Dynamic lookup is local, read-only, and bounded. It does not perform network requests or mutate workspace state. Repeated or comma-separated repository and group selectors complete only the active segment and preserve the prefix already entered.

The canonical completion model retains candidate descriptions for every supported shell. Zsh and Fish can display per-candidate descriptions. Bash retains the canonical descriptions but native Bash programmable completion does not natively display per-candidate descriptions.

## Troubleshooting

- If static suggestions are missing, confirm `command arashi completion <shell>` prints a script, source it again, and restart the shell if needed.
- Outside a workspace, or when local discovery fails, completion silently returns no dynamic candidates while static command and option completion keeps working.
- Empty dynamic results do not trigger a network fallback: completion does not perform network requests or mutate workspace state.
- If an installed shell wrapper behaves differently from direct invocation, keep `command arashi` in the completion activation line so generation bypasses the wrapper.

## Related

- [shell command](/commands/shell/) for parent-shell switching and managed activation.
- [switch command](/commands/switch/) for worktree selection behavior.
