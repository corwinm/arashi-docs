---
title: Docs Domain Migration Exceptions
description: Approved exceptions for docs-domain migration scope.
draft: false
sidebar:
  hidden: false
---

## Exceptions Overview

## Exception Policy

- Exceptions apply only to unreplaced target-domain references in approved in-scope surfaces.
- Each exception must include impacted surface, reason, owner, and approval timestamp.

## Approved Exceptions

No approved exceptions for feature `035-update-docs-domain`.

## Non-Target References Reviewed

| Artifact | Classification | Reason | Owner |
|---|---|---|---|
| `repos/arashi-docs/bun.lock` (`@netlify/*` dependency text) | Non-target generated content | Not a docs-domain URL reference | Docs maintainers |
| `repos/arashi-docs/.gitignore` and `.npmignore` (`.netlify/`) | Non-target tool path | Local tooling output path, not a docs-domain URL | Docs maintainers |
| `repos/arashi-docs/.github/workflows/docs-validate.yml` (`netlify.toml` path trigger) | Non-target workflow path | File trigger path, not a docs-domain URL | Docs maintainers |
