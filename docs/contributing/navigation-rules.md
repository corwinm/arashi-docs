---
title: Navigation Rules
description: Rules for page placement and ordering in docs navigation.
draft: false
sidebar:
  hidden: true
---

## Section Placement

- Put onboarding material in `/getting-started/`.
- Put task-oriented development and environment-integration guides in `/workflows/`.
- Put detailed configuration and behavior contracts in `/reference/`.
- Put command documentation in `/commands/`.
- Put authoring workflow and governance content in `/contributing/`.

Workflow pages should carry a user outcome from a clear starting state to a verifiable result. Link to Reference or Commands for complete option matrices, schemas, precedence rules, and uncommon edge cases.

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

- Any sidebar structure change must update `astro.config.mjs` and the affected cross-linking index pages.
- Preserve public routes with redirects when moving an existing page.
- Navigation changes require validation with [Review Checklist](/contributing/review-checklist/).
