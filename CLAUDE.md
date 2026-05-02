# CLAUDE.md

## Project Overview

**Cannonade** is a cross-platform desktop application built with Electron + Vue 3 + TypeScript + Vite + Pinia store + sass. The project uses npm as the package manager.

```
## Commands
```
npm run lint
npm run build
```

## Coding Rules
- NEVER write comments on the code.
- Always add return type annotations for functions.
- Always use scoped scss.
- Always use :key with v-for.
- Never use v-if on the same element as v-for.
- Each component should be in its own file.
- Names and filenames of components should be always PascalCase.
- Base components that could be used anywhere should be inside /src/renderer/src/components/ui.
- Child components that are tightly coupled with their parent should include the parent component name as a prefix.
- Component names should start with the highest-level (often most general) words and end with descriptive modifying words.
- Components with no content should be self-closing in single-file components, string templates, and JSX - but never in DOM templates.
- Elements with multiple attributes should span multiple lines, with one attribute per line.
- Use kebab-case for events.
- Use production grade best practises
- You can use icons from tabler: import { IconTank } from '@tabler/icons-vue';