---
title: Navigation Rules
description: Rules for page placement and ordering in docs navigation.
draft: false
sidebar:
  hidden: false
---

## Section Placement

- Put onboarding material in `/getting-started/`.
- Put command documentation in `/commands/`.
- Put authoring workflow and governance content in `/contributing/`.

## Ordering Rules

- Keep section index pages first in each sidebar group.
- Keep contributor workflow pages in this order:
  1. How to Add Pages
  2. Navigation Rules
  3. Validation Troubleshooting
  4. Review Checklist
  5. Ownership
  6. Page Template

## Change Control

- Any sidebar structure change must update `astro.config.mjs` and at least one cross-linking index page.
- Navigation changes require validation with [Review Checklist](/contributing/review-checklist/).
