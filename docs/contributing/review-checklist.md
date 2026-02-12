---
title: Review Checklist
description: Discoverability-focused checklist for docs pull request review.
draft: false
sidebar:
  hidden: false
---

Use this list when reviewing changes that affect navigation or first-time user experience.

## Discoverability Checks

- [ ] The docs home page still presents clear links to Getting Started, Commands, and Contributing.
- [ ] New content is linked from at least one existing entry page.
- [ ] Terminology remains consistent with the docs site conventions.
- [ ] All updated links use canonical docs paths and resolve correctly.
- [ ] Any navigation change follows [Navigation Rules](/contributing/navigation-rules/).

## README Link Checks

- [ ] If docs URL changed, `repos/arashi/README.md` points to the canonical URL.
- [ ] The canonical URL appears in docs home and matches `repos/arashi/README.md`.

## Install Consistency Checks

- [ ] README, Getting Started, and landing hero use the same curl command text.
- [ ] README, Getting Started, and landing hero use the same npm command text.
- [ ] README, Getting Started, and landing hero all include `arashi --version` verification.
- [ ] Getting Started includes prerequisites, troubleshooting, and a clear next step for both install methods.
- [ ] Manual acceptance results are recorded for curl install, npm install, and landing hero discoverability.

## Manual Acceptance Outcomes (2026-02-11)

- [x] Curl install flow: installer command executed and produced clear fallback guidance; blocked on `arashi-checksums.txt` not yet present in current latest release assets.
- [x] npm install flow: `npm install -g arashi --prefix <temp-dir>` completed and `arashi --version` returned `1.4.0`.
- [x] Landing hero discoverability: built docs output includes both install commands and hero actions linking to `/getting-started/#install-curl` and `/getting-started/#install-npm`.
