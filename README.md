# arashi-docs

Dedicated documentation site repository for Arashi.

- Canonical docs URL: `https://arashi.haphazard.dev`
- Source project: `repos/arashi/`
- Docs content root: `repos/arashi-docs/docs/`

## Local setup

```bash
bun install
```

## Run locally

```bash
bun run dev
```

## Build and validate

```bash
bun run validate
bun run build
```

## Validation commands

- `bun run lint` checks markdown consistency.
- `bun run validate:links:internal` checks internal links and anchors.
- `bun run validate:a11y` runs accessibility smoke checks for critical pages.
- `bun run validate:links:external` checks external links (scheduled, non-blocking).
- `bun run validate:docs-domain` enforces canonical docs-domain policy and denylist checks.
- `bun run validate:readme-link` checks canonical docs URL health.

## Migration Audit Artifacts

- Scope inventory: `docs/contributing/docs-domain-migration-scope.md`
- Evidence record: `docs/contributing/docs-domain-migration-evidence.md`
- Exceptions register: `docs/contributing/docs-domain-exceptions.md`

## Publishing

- Netlify deploys production from `main`.
- Pull requests use deploy preview context.
- Validation workflows run in `.github/workflows/`.
