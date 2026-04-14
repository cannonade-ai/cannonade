# CLAUDE.md

## Project Overview

**Cannonade** is a cross-platform desktop application built with Electron + Vue 3 + TypeScript + Vite + Pinia store. The project uses npm as the package manager.

```
## Commands
```
npm run lint
npm run build

```

## Vue 3 rules
- NEVER write comments on the code.
- Always use :key with v-for.
- Never use v-if on the same element as v-for.
- Each component should be in its own file.
- Names and filenames of components should be always PascalCase but but kebab-case in DOM templates.
- Base components that apply app-specific styling and conventions should all begin with prefix "Base".
- Child components that are tightly coupled with their parent should include the parent component name as a prefix.
- Component names should start with the highest-level (often most general) words and end with descriptive modifying words.
- Components with no content should be self-closing in single-file components, string templates, and JSX - but never in DOM templates.
- Elements with multiple attributes should span multiple lines, with one attribute per line.
- Use kebab-case for events.
- Use production grade best practises
- You can use icons from tabler: import { IconTank } from '@tabler/icons-vue';