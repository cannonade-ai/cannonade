# CLAUDE.md

## Project Overview

**Cannonade** is a cross-platform desktop application built with Electron + Vue 3 + TypeScript + Vite + Pinia store + sass. The project uses npm as the package manager.

## Commands
```bash
npm run validate # runs build, lint:fix, and tests
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
- Names and filenames of components should be always PascalCase, ts file names are kebab-case.
- Base components that could be used anywhere should be inside `/src/renderer/src/components/ui`.
- Always check the `/src/renderer/src/components/ui` for the existing components before designing a new view/component.
- Child components that are tightly coupled with their parent should include the parent component name as a prefix.
- Component names should start with the highest-level (often most general) words and end with descriptive modifying words.
- Components with no content should be self-closing in single-file components, string templates, and JSX - but never in DOM templates.
- Use kebab-case for events.
- Prefer explicit named types (e.g. `OutputItem[]`) over indexed access types (e.g. `ChatResponse['output']`).
- Prefer simple TypeScript: plain `string`/`string[]` fields plus `as const` constant objects (e.g. `ModelModality.Text`) over complex type-level syntax like derived unions (`(typeof X)[number]`), type predicates, or enums.
- You can use icons from tabler: `import { IconTank } from '@tabler/icons-vue'`;
- Never run TypeScript type checks, build the project instead.
- Never use `title:"some text"` on components, use `v-tooltip="'some text'"` instead.
- Use `createLogger` (`src/main/logger.ts` / `src/renderer/src/utils/logger.ts`) instead of `console.*`; scope names are kebab-case matching the module's purpose (e.g. `'test-runner'`).

## Important Folders
- `/src/main` - Electron main process entry, app state, logger.
- `/src/main/ipc` - IPC handler modules, one per domain (chat, provider, suite, run, settings...).
- `/src/main/eval` - evaluation metrics, validators, LLM rubric and G-Eval scoring.
- `/src/preload` - preload bridge and its type declarations.
- `/src/core/providers` - provider implementations, one folder per provider type, plus `base.ts` and `registry.ts`.
- `/src/shared` - code shared by main, preload and renderer; must stay pure (types + mappers, no I/O).
- `/src/renderer/src/views` - top-level page components, one per route.
- `/src/renderer/src/components` - feature components, grouped in a folder per feature.
- `/src/renderer/src/components/ui` - reusable base components; always check here first.
- `/src/renderer/src/stores` - Pinia stores.
- `/src/renderer/src/composables` - reusable composition functions.
- `/src/renderer/src/directives` - custom Vue directives (e.g. `v-tooltip`).
- `/src/renderer/src/styles` - global scss (colors, variables, animations).
- `/src/renderer/src/api` - typed wrapper over the preload IPC bridge.
- `/local_docs` - provider API docs and internal notes, not shipped.
- `/website` - separate Astro site with its own package.json