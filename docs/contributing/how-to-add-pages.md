---
title: How to Add Pages
description: Contributor workflow for adding docs pages without breaking navigation.
draft: false
sidebar:
  hidden: false
---

## Workflow

1. Choose the destination section: `getting-started`, `commands`, or `contributing`.
2. Create a new Markdown file under `docs/<section>/`.
3. Add frontmatter:

```markdown
---
title: Your Page Title
description: One sentence explaining why this page exists.
---
```

1. Add links from at least one section index or related page.
2. Update sidebar navigation in `astro.config.mjs` if the page needs top-level visibility.
3. Run validation commands before opening a pull request.

## Required Checks

```bash
bun run lint
bun run validate:links:internal
bun run validate:a11y
```

## Review Expectations

- Follow [Content Style](/contributing/content-style/).
- Follow [Navigation Rules](/contributing/navigation-rules/).
- Use [Page Template](/contributing/page-template/) for new operational pages.
