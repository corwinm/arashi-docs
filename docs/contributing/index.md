---
title: Contributing
description: How to contribute to Arashi projects using the Arashi development flow.
draft: false
sidebar:
  hidden: false
---

Arashi changes usually start in the [`arashi-arashi`](https://github.com/corwinm/arashi-arashi) meta-repository, then land in the project repository that owns the code or docs. The goal is to keep work scoped, reviewable, and easy to coordinate across the Arashi workspace.

## Contribution Flow

1. **Start from the meta-repo.** Check workspace state with `arashi status`. If a repository is behind, pull the workspace forward before starting new work.
2. **Find or open the issue.** Use the issue to agree on the problem, expected outcome, and affected repositories.
3. **Create a coordinated worktree.** Run `arashi create <branch-name>` from [`arashi-arashi`](https://github.com/corwinm/arashi-arashi) so every Arashi repository gets the same branch/worktree shape.
4. **Plan changes when the behavior or workflow shifts.** For CLI behavior, cross-repo changes, or agent-facing workflows, use the OpenSpec proposal flow in [`arashi-arashi`](https://github.com/corwinm/arashi-arashi) before implementation.
5. **Make implementation changes in the owning repository.** For example, docs site content belongs in [`arashi-docs`](https://github.com/corwinm/arashi-docs); CLI behavior belongs in [`arashi`](https://github.com/corwinm/arashi).
6. **Validate locally.** Run the affected repository's validation commands before opening a PR.
7. **Open focused PRs.** Keep PRs small, link related PRs across repositories when needed, and reference the originating [`arashi-arashi`](https://github.com/corwinm/arashi-arashi) issue.

## What Goes Where

- Use [`arashi-arashi`](https://github.com/corwinm/arashi-arashi) for issues, OpenSpec proposals, workspace coordination, and cross-repo context.
- Use [`arashi`](https://github.com/corwinm/arashi) for the CLI and workspace-management behavior.
- Use [`arashi-docs`](https://github.com/corwinm/arashi-docs) for this documentation site.
- Use [`arashi-skills`](https://github.com/corwinm/arashi-skills) and [`arashi-vscode`](https://github.com/corwinm/arashi-vscode) for their project-specific changes.

If a change spans multiple repositories, open one PR per repository and cross-link them so reviewers can follow the full change.

## Docs-Site Notes

Small documentation fixes can go directly through the docs repository. For larger docs restructuring, use the same contribution flow above and keep the page focused on user outcomes rather than internal site mechanics.

Docs maintainers may still need the site-maintenance references:

- [How to Add Pages](/contributing/how-to-add-pages/)
- [Navigation Rules](/contributing/navigation-rules/)
- [Content Style](/contributing/content-style/)
- [Review Checklist](/contributing/review-checklist/)
- [Validation Troubleshooting](/contributing/validation-troubleshooting/)

## Related

- [Getting Started](/getting-started/)
- [Workflows](/workflows/)
- [Agents and Specs](/workflows/agents-and-specs/)
- [Commands](/commands/)
