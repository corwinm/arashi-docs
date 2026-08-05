# arashi-docs

Dedicated documentation site repository for Arashi.

- Canonical docs URL: `https://arashi.haphazard.dev`
- Source project: `repos/arashi/`
- Docs content root: `repos/arashi-docs/docs/`

## Local setup

This project requires Node.js 22.13 or newer and pnpm 11.20.0. With nvm, select the pinned development runtime first:

```bash
nvm use
pnpm install --frozen-lockfile
```

## Run locally

```bash
pnpm run dev
```

## Build and validate

```bash
pnpm run validate
pnpm run build
```

## Validation commands

- `pnpm run lint` checks markdown consistency.
- `pnpm run validate:links:internal` checks internal links and anchors.
- `pnpm run validate:a11y` runs accessibility smoke checks for critical pages.
- `pnpm run validate:managed-ignore-docs` checks managed-ignore guidance in source pages and generated agent-readable exports.
- `pnpm run validate:standalone-docs` checks standalone workflow coverage in source pages and generated agent-readable exports.
- `pnpm run validate:links:external` checks external links (scheduled, non-blocking).
- `pnpm run validate:docs-domain` enforces canonical docs-domain policy and denylist checks.
- `pnpm run validate:readme-link` checks canonical docs URL health.

## Migration Audit Artifacts

- Scope inventory: `docs/contributing/docs-domain-migration-scope.md`
- Evidence record: `docs/contributing/docs-domain-migration-evidence.md`
- Exceptions register: `docs/contributing/docs-domain-exceptions.md`

## Publishing

- Netlify deploys production from `main`.
- Pull requests use deploy preview context.
- Validation workflows run in `.github/workflows/`.
