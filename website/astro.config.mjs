// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://cannonade.app',
  integrations: [
    starlight({
      title: 'Cannonade',
      description:
        'A local-first desktop app for building test suites and running them against many LLMs at once.',
      logo: {
        src: './src/assets/logo.png',
        alt: 'Cannonade'
      },
      favicon: '/favicon.ico',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/BekirUzun/cannonade'
        }
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
})
