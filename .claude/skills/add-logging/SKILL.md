---
name: add-logging
description: Add logging to a module in this project using createLogger. Use when asked to add logs, debug logs, or logging to main-process or renderer code.
---

# Add Logging

## Setup

Create one logger per module, at the top of the file after imports:

- Main process: `import { createLogger } from '@main/logger'`
- Renderer: `import { createLogger } from '@renderer/utils/logger'`

```ts
const log = createLogger('suite-handlers')
```

The scope is kebab-case and matches the module's purpose (usually the filename).

## Rules

- Never use `console.*`.
- Pick the level by meaning: `log.debug` for tracing flow, `log.info` for notable state changes, `log.warn` for recoverable problems, `log.error` for failures (include the caught error as a second argument: `log.error('Failed to load suites', err)`).
- Log outcomes, not entry points — skip "doing X" logs at the start of a function; log what was found or done, with the relevant id or count.
- Prefer short template strings with counts over dumping whole objects: ``log.debug(`Found ${jsonFiles.length} suite files`)``, not `log.debug('Found suite files', jsonFiles)`.
- When an identifier matters, include it: ``log.debug(`Saving suite: ${suite.id}`) ``.
- No comments (project rule applies to logging code too).
