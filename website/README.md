# Cannonade website

The landing page and documentation for [Cannonade](https://cannonade.app), built with
[Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

This is a separate npm project from the Electron app in the repository root. Install and
run it from this directory.

```bash
cd website
npm install
npm run dev     # http://localhost:4321
npm run build   # static output in dist/
npm run preview # serve dist/ — use this to judge how the site actually renders
```

`npm run dev` injects styles through JavaScript, so the first paint always flickers a
little. That does not happen in the built site; check appearance with `preview`.

## Editing the docs

Documentation lives in `src/content/docs/` as markdown and is served under `/docs/`:

- `index.md` — the documentation home at `/docs/`. It links to every page by hand, so keep
  it in sync when adding or removing one.
- `guides/` — task-oriented pages, at `/docs/guides/*`, ordered by `sidebar.order`.
- `reference/` — lookup pages, at `/docs/reference/*`.

The `/docs/` prefix comes from `generateId` in `src/content.config.ts`, so write internal
links with it: `[Evaluators](/docs/reference/evaluators/)`.

The sidebar is generated from these directories, so adding a page is just adding a file:

```markdown
---
title: Page title
description: One sentence, used for search results and social previews.
sidebar:
  order: 4
---
```

Every docs page carries an "Edit this page" link, so a typo fix can be a one-file pull
request from the GitHub web editor.

## Editing the landing page

`src/pages/index.astro` composes the sections in `src/components/landing/`. Colors and
fonts are tokens in `src/styles/tokens.css`.

Screenshots are `placehold.co` placeholders for now and should be replaced with real ones.

## Deployment

Cloudflare Pages, connected to this repository:

| Setting            | Value           |
| ------------------ | --------------- |
| Root directory     | `website`       |
| Build command      | `npm run build` |
| Output directory   | `dist`          |
| Build watch paths  | `website/*`     |

Search is [Pagefind](https://pagefind.app), generated at build time. There is no external
search service and no API key.
