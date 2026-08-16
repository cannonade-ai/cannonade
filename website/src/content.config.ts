import { defineCollection } from 'astro:content'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'

function toDocsId(entry: string): string {
  const withoutExtension = entry.replace(/\.[^./]+$/, '')
  const withoutIndex = withoutExtension.replace(/(^|\/)index$/, '')
  const slug = withoutIndex.toLowerCase().replace(/\s+/g, '-')
  return slug ? `docs/${slug}` : 'docs'
}

export const collections = {
  docs: defineCollection({
    loader: docsLoader({ generateId: ({ entry }): string => toDocsId(entry) }),
    schema: docsSchema()
  })
}
