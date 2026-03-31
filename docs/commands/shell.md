---
title: shell Command
description: Install or print shell integration for parent-shell directory switching.
draft: false
sidebar:
  hidden: false
---

## What It's For

Enable `arashi switch` to change the current shell directory when the CLI is invoked through an installed shell wrapper.

## Usage

```bash
arashi shell <subcommand>
```

## Subcommands

- `init <bash|zsh|fish>` print shell wrapper code for manual setup.
- `install` detect the active shell and update the matching startup file.

## Examples

```bash
# install for the active shell
arashi shell install

# print wrapper code for manual setup
arashi shell init bash
arashi shell init zsh
arashi shell init fish
```

## Notes

- The first release supports bash, zsh, and fish.
- Restart your shell or source the updated startup file after `arashi shell install`.
- If install cannot determine a writable startup file, Arashi tells you to use `arashi shell init <shell>` instead.
- Shell integration is what makes `arashi switch --cd` and `defaults.switch.mode: "cd" | "auto"` work in the parent shell.
