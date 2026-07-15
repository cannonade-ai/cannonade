<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

const props = defineProps<{ content: string }>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

md.renderer.rules.link_open = (tokens, idx, options, _env, self): string => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  return self.renderToken(tokens, idx, options)
}

const rendered = computed<string>(() => md.render(props.content))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="markdown-content" v-html="rendered" />
</template>

<style scoped lang="scss">
.markdown-content {
  word-break: break-word;

  :deep(> *:first-child) {
    margin-top: 0;
  }

  :deep(> *:last-child) {
    margin-bottom: 0;
  }

  :deep(p) {
    margin: 0 0 0.6em;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 0.8em 0 0.4em;
    font-weight: 600;
    line-height: 1.3;
  }

  :deep(h1) {
    font-size: 1.35em;
  }

  :deep(h2) {
    font-size: 1.2em;
  }

  :deep(h3) {
    font-size: 1.1em;
  }

  :deep(h4),
  :deep(h5),
  :deep(h6) {
    font-size: 1em;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 0.6em;
    padding-left: 1.4em;
  }

  :deep(li) {
    margin: 0.15em 0;
  }

  :deep(code) {
    padding: 1px 5px;
    font-family: var(--font-mono, monospace);
    font-size: 0.9em;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px);
  }

  :deep(pre) {
    margin: 0 0 0.6em;
    padding: 8px 10px;
    overflow-x: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 6px);

    code {
      padding: 0;
      background: none;
      border: none;
    }
  }

  :deep(blockquote) {
    margin: 0 0 0.6em;
    padding: 2px 0 2px 10px;
    color: var(--text-secondary);
    border-left: 3px solid var(--border);
  }

  :deep(a) {
    color: var(--accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(table) {
    margin: 0 0 0.6em;
    border-collapse: collapse;
  }

  :deep(th),
  :deep(td) {
    padding: 4px 8px;
    border: 1px solid var(--border);
    text-align: left;
  }

  :deep(th) {
    background: var(--surface);
    font-weight: 600;
  }

  :deep(hr) {
    margin: 0.8em 0;
    border: none;
    border-top: 1px solid var(--border);
  }

  :deep(img) {
    max-width: 100%;
  }
}
</style>
