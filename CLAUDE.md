# CLAUDE.md

## Project Overview

**Cannonade** is a cross-platform desktop application built with Electron + Vue 3 + TypeScript + Vite + Pinia store + sass. The project uses npm as the package manager.

## Commands
```bash
npm run build
npm run lint:fix
npm test
```

## Coding Rules
- NEVER write comments on the code.
- Always add return type annotations for functions.
- Always use scoped scss.
- Always use :key with v-for.
- Never use v-if on the same element as v-for.
- Each component should be in its own file.
- Names and filenames of components should be always PascalCase.
- Base components that could be used anywhere should be inside `/src/renderer/src/components/ui`.
- Always check the `/src/renderer/src/components/ui` for the existing components before designing a new view/component.
- Child components that are tightly coupled with their parent should include the parent component name as a prefix.
- Component names should start with the highest-level (often most general) words and end with descriptive modifying words.
- Components with no content should be self-closing in single-file components, string templates, and JSX - but never in DOM templates.
- Use kebab-case for events.
- Use production grade best practises
- Prefer explicit named types (e.g. `OutputItem[]`) over indexed access types (e.g. `ChatResponse['output']`).
- Prefer simple TypeScript: plain `string`/`string[]` fields plus `as const` constant objects (e.g. `ModelModality.Text`) over complex type-level syntax like derived unions (`(typeof X)[number]`), type predicates, or enums.
- You can use icons from tabler: `import { IconTank } from '@tabler/icons-vue'`;
- Never run TypeScript type checks, build the project instead.
- Never use `title:"some text"` on components, use `v-tooltip="'some text'"` instead.
- Use `createLogger` (`src/main/logger.ts` / `src/renderer/src/utils/logger.ts`) instead of `console.*`; scope names are kebab-case matching the module's purpose (e.g. `'test-runner'`).