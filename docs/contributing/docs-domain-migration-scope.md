---
title: Docs Domain Migration Scope
description: In-scope surfaces and ownership for canonical docs-domain migration.
draft: false
sidebar:
  hidden: false
---

## Scope Overview

## Canonical Domain

- Canonical documentation URL: `https://arashi.haphazard.dev`
- Deprecated domain host denylist: `arashi-docs.netlify.app`

## In-Scope Surfaces

| Surface ID | Repository | File Path | Surface Type | Owner |
|---|---|---|---|---|
| S001 | arashi | `repos/arashi/README.md` | README entrypoint | Arashi maintainers |
| S002 | arashi-docs | `repos/arashi-docs/README.md` | README policy | Docs maintainers |
| S003 | arashi-docs | `repos/arashi-docs/astro.config.mjs` | Site config | Docs maintainers |
| S004 | arashi-docs | `repos/arashi-docs/scripts/check-readme-link.ts` | Validation script | Docs maintainers |
| S005 | arashi-docs | `repos/arashi-docs/docs/contributing/validation-troubleshooting.md` | Contributor guidance | Docs maintainers |

## Scope Rules

- Replace deprecated docs-domain references only in in-scope surfaces.
- Preserve URL path, query, and fragment for domain-only replacements.
- Leave non-target external links unchanged.
- Capture unreplaced target references in the exceptions register.

## Evidence Links

- Migration evidence: [`docs-domain-migration-evidence.md`](./docs-domain-migration-evidence.md)
- Approved exceptions: [`docs-domain-exceptions.md`](./docs-domain-exceptions.md)
