---
title: Validation Troubleshooting
description: Resolve common validation failures before requesting review.
draft: false
sidebar:
  hidden: true
---

## Common Failures

## Markdown lint failures

- Run `pnpm lint`.
- Fix heading order, code block fencing, and list formatting issues.

## Internal link or anchor failures

- Run `pnpm validate:links:internal`.
- Confirm linked files exist and fragment anchors match section headings.

## Accessibility smoke failures

- Run `pnpm validate:a11y`.
- Ensure each critical page includes a clear `h1` and semantic main content.

## Canonical docs URL health failure

- Run `pnpm validate:readme-link`.
- Confirm `https://arashi.haphazard.dev` is reachable.
- Confirm docs home and `repos/arashi/README.md` use the same canonical URL.

## Canonical docs domain policy failure

- Run `pnpm validate:docs-domain`.
- Replace deprecated docs-domain references with `https://arashi.haphazard.dev`.
- Ensure the Documentation link in `repos/arashi/README.md` targets `https://arashi.haphazard.dev` exactly.
