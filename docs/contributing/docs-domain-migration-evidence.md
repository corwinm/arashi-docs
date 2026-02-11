---
title: Docs Domain Migration Evidence
description: Audit evidence and validation results for canonical docs-domain migration.
draft: false
sidebar:
  hidden: false
---

## Evidence Overview

## Migration Summary

- Feature: `035-update-docs-domain`
- Canonical domain: `https://arashi.haphazard.dev`
- Deprecated domain host: `arashi-docs.netlify.app`

## Baseline Inventory

| Metric | Count |
|---|---:|
| Total target-domain references detected | 5 |
| Non-target references reviewed | 0 |
| Candidate exceptions at baseline | 0 |

## Before and After URL Mapping

| Surface | Before | After | Path/Query/Fragment Preserved |
|---|---|---|---|
| `repos/arashi/README.md` | `https://arashi-docs.netlify.app` | `https://arashi.haphazard.dev` | Yes |
| `repos/arashi-docs/README.md` | `https://arashi-docs.netlify.app` | `https://arashi.haphazard.dev` | Yes |
| `repos/arashi-docs/astro.config.mjs` | `https://arashi-docs.netlify.app` | `https://arashi.haphazard.dev` | Yes |
| `repos/arashi-docs/scripts/check-readme-link.ts` | `https://arashi-docs.netlify.app` | `https://arashi.haphazard.dev` | Yes |
| `repos/arashi-docs/docs/contributing/validation-troubleshooting.md` | `https://arashi-docs.netlify.app` | `https://arashi.haphazard.dev` | Yes |

## Validation Runs

| Run | Commands | Result | Notes |
|---|---|---|---|
| Run 1 | `bun run validate:docs-domain`, `bun run validate:readme-link`, `bun run validate` | Pass | Canonical policy and docs validation gates passed |
| Run 2 | `bun run validate:docs-domain`, `bun run validate` | Pass | Regression and final validation checks passed |

## Regression Check Results

- Deprecated-domain scanner reports no in-scope references to `arashi-docs.netlify.app`.
- Canonical README entrypoint check requires `[Documentation](https://arashi.haphazard.dev)`.
- Docs validation workflow includes canonical-domain policy gate.
- Arashi CI includes README docs-link drift guard.

## Closure Equation

- Total target references: **5**
- Updated references: **5**
- Approved exceptions: **0**
- Closure equation: **5 + 0 = 5** (satisfied)

## Release Approver Checklist

- [x] In-scope surfaces list is complete and linked.
- [x] Updated-reference inventory is complete.
- [x] Exceptions register is reviewed and approved.
- [x] Validation outcomes show no critical broken-link findings.
- [x] Closure equation is satisfied.

### Sign-off

- Approver: _Pending maintainer sign-off_
- Review date: _Pending_
- Decision: _Pending_

## Handoff Notes

- Evidence artifacts:
  - Scope: [`docs-domain-migration-scope.md`](./docs-domain-migration-scope.md)
  - Exceptions: [`docs-domain-exceptions.md`](./docs-domain-exceptions.md)
- Canonical policy scripts:
  - `repos/arashi-docs/scripts/check-canonical-docs-domain.ts`
  - `repos/arashi-docs/scripts/check-readme-link.ts`
