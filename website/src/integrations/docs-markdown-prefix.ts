import type { AstroIntegration } from 'astro'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import path from 'node:path'

const DOCS_PREFIX = 'docs'
const SOURCE_DIRS = ['getting-started', 'guides', 'reference']

async function moveMarkdownFiles(fromDir: string, toDir: string): Promise<void> {
  let entries: string[]
  try {
    entries = await fs.readdir(fromDir)
  } catch {
    return
  }

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue
    await fs.mkdir(toDir, { recursive: true })
    await fs.rename(path.join(fromDir, entry), path.join(toDir, entry))
  }

  try {
    await fs.rmdir(fromDir)
  } catch {
    return
  }
}

export function docsMarkdownPrefix(): AstroIntegration {
  return {
    name: 'docs-markdown-prefix',
    hooks: {
      'astro:build:done': async ({ dir }): Promise<void> => {
        const distPath = fileURLToPath(dir)
        const docsPath = path.join(distPath, DOCS_PREFIX)

        for (const dirName of SOURCE_DIRS) {
          await moveMarkdownFiles(path.join(distPath, dirName), path.join(docsPath, dirName))
        }

        const rootMarkdown = path.join(distPath, 'index.md')
        try {
          await fs.access(rootMarkdown)
          await fs.rename(rootMarkdown, path.join(docsPath, 'index.md'))
        } catch {
          return
        }
      }
    }
  }
}
