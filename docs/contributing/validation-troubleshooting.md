---
title: Validation Troubleshooting
description: Resolve common validation failures before requesting review.
draft: false
sidebar:
  hidden: false
---

## Common Failures

## Markdown lint failures

- Run `bun run lint`.
- Fix heading order, code block fencing, and list formatting issues.

## Internal link or anchor failures

- Run `bun run validate:links:internal`.
- Confirm linked files exist and fragment anchors match section headings.

## Accessibility smoke failures

- Run `bun run validate:a11y`.
- Ensure each critical page includes a clear `h1` and semantic main content.

## Canonical docs URL health failure

- Run `bun run validate:readme-link`.
- Confirm `https://arashi-docs.netlify.app` is reachable.
- Confirm docs home and `repos/arashi/README.md` use the same canonical URL.
