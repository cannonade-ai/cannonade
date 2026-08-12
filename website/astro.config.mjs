// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

function readAppVersion() {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : '';
  } catch {
    return '';
  }
}

export default defineConfig({
  site: 'https://cannonade.app',
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(readAppVersion())
    }
  },
  integrations: [
    starlight({
      title: 'Cannonade',
      description:
        'A local-first desktop app for building test suites and running them against many LLMs at once.',
      logo: {
        src: './src/assets/mark.svg',
        alt: 'Cannonade'
      },
      favicon: '/favicon.svg',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/BekirUzun/cannonade' }
      ],
      editLink: {
        baseUrl: 'https://github.com/BekirUzun/cannonade/edit/main/website/'
      },
      lastUpdated: true,
      components: {
        Head: './src/components/Head.astro',
        ThemeProvider: './src/components/ThemeProvider.astro'
      },
      customCss: ['./src/styles/fonts.css', './src/styles/tokens.css', './src/styles/docs.css'],
      sidebar: [
        { label: 'Overview', link: '/docs/' },
        { label: 'Guides', items: [{ autogenerate: { directory: 'guides' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] }
      ]
    })
  ]
});
