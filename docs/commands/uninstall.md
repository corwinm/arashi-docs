---
title: uninstall Command
description: Inspect and remove a proven Arashi installation without touching project data.
draft: false
sidebar:
  hidden: false
---

Use `aw uninstall` to remove Arashi only when the installation owner can be proven. This command does not require an Arashi workspace.

## Usage

```bash
aw uninstall [options]
```

## Options

- `-n, --dry-run` inspect the complete removal plan without prompting or changing anything.
- `-y, --yes` consent to the preflighted plan without an interactive prompt.

Run `aw uninstall --dry-run` first. Interactive removal displays the same plan and defaults to no; use `aw uninstall --yes` only after reviewing it. Non-interactive removal requires `--yes`.

## Installation ownership

Arashi handles three bounded cases:

- **Proven package-manager install:** Arashi delegates once to the single detected owner. The exact commands are `npm uninstall -g arashi`, `pnpm remove -g arashi`, `yarn global remove arashi` for Yarn classic, `bun remove -g arashi`, and `vp uninstall -g arashi` for Vite+.
- **Current official direct install:** a valid schema-v2 manifest proves each owned file and the installer-added PATH mutation. After complete preflight, Arashi hands removal to the bundled platform helper. Already-absent manifest files are safe to skip on a retry, and the manifest is removed last.
- **Legacy or unproven install:** schema-v1, unmanifested, manual, modified, malformed, or ambiguous state is preserved and automatic removal is refused. For a legacy official direct install, run the current official installer over the same install directory, then retry the dry run. Arashi does not heuristically adopt old or manual files.

Conflicting, unsupported, unavailable, or absent package-manager evidence also produces guidance without trying multiple managers or deleting package roots and shims directly.

## Safety boundary

For a current official direct install, product uninstall removes only proven manifest-owned payload files, one exact safe installer-added PATH mutation, and exact complete managed shell blocks. Package-manager uninstall delegates only to that manager; run `aw shell uninstall` first if you previously installed Arashi's managed shell block. Direct uninstall never recursively deletes the install directory.

It strictly preserves workspaces, repositories, worktrees, project files, configuration, `.arashi.yaml`, Git metadata, unrelated profile bytes and unrelated install-directory files, and all other unrelated state. A changed payload file, unexpected file type, unsafe symlink or reparse point, or ambiguous shell marker state causes refusal before the first mutation. If the exact installer-added PATH bytes are absent, duplicated, or otherwise ambiguous, Arashi preserves that PATH state while continuing only with independently proven cleanup.

The command does not support `--json` or `--force`, does not automatically migrate schema-v1 state, and does not promise rollback. Its recovery boundary is complete preflight, manifest-last cleanup, and safe reruns for exact manifest-listed files already absent after an interruption.

## Recover When the CLI Cannot Run

Current direct-install releases include standalone POSIX and PowerShell helpers. Download the matching helper to a unique temporary file, inspect it, and run dry-run before explicit consent. The helper validates the local manifest itself; downloading it does not prove that an installation is owned.

On POSIX, the deterministic default install directory is `$HOME/.arashi/bin`. Supply `--install-dir` when the original install used an exact non-default install directory:

```bash
helper="$(mktemp "${TMPDIR:-/tmp}/arashi-uninstall.XXXXXX")"
curl -fsSL https://arashi.haphazard.dev/uninstall -o "$helper"
less "$helper"
bash "$helper" --install-dir /absolute/path/to/arashi-bin --dry-run
bash "$helper" --install-dir /absolute/path/to/arashi-bin --yes
rm -f "$helper"
```

In PowerShell, the deterministic default is `$HOME\.arashi\bin`. Use the exact non-default install directory with `-InstallDir`, then `-DryRun` before `-Yes`:

```powershell
$helper = Join-Path ([System.IO.Path]::GetTempPath()) ("arashi-uninstall-" + [guid]::NewGuid() + ".ps1")
Invoke-WebRequest https://arashi.haphazard.dev/uninstall.ps1 -OutFile $helper
Get-Content -LiteralPath $helper
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $helper -InstallDir "D:\Tools\Arashi\bin" -DryRun
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $helper -InstallDir "D:\Tools\Arashi\bin" -Yes
Remove-Item -LiteralPath $helper -ErrorAction SilentlyContinue
```

`-ExecutionPolicy Bypass` applies only to the recovery subprocess; it does not change the machine or user execution-policy configuration.

Omit the install-directory option only for the deterministic platform default. Never infer a custom directory from PATH or search the filesystem for one. If manifest validation refuses, preserve the installation and use the bounded remediation printed by the helper.

To remove only managed shell integration, use [`aw shell uninstall`](/commands/shell/#uninstall-shell-integration).
