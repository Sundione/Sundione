// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Served from GitHub Pages at https://sundione.github.io/Sundione/
export default defineConfig({
  site: 'https://sundione.github.io',
  base: '/Sundione',
  i18n: {
    locales: ['en', 'th'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    // Writes sitemap-index.xml (submit it in Google Search Console), with en/th alternates.
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', th: 'th' },
      },
    }),
  ],
});
