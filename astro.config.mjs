// @ts-check
import { defineConfig } from 'astro/config';

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
});
