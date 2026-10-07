// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    host: true,
  },
  // Authentication sessions are persisted in D1; do not provision Astro's default KV session store.
  session: false,
  // The application does not currently require Cloudflare Images.
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['astro/virtual-modules/middleware.js'],
      include: [
        'drizzle-orm',
        'drizzle-orm/d1',
        'drizzle-orm/sqlite-core',
        'zod',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'astro/assets/services/noop',
        'astro/logger/console',
        'astro/logger/json',
      ],
    },
    ssr: {
      noExternal: ['drizzle-orm'],
      optimizeDeps: {
        exclude: ['astro/virtual-modules/middleware.js'],
        include: [
          'drizzle-orm',
          'drizzle-orm/d1',
          'drizzle-orm/sqlite-core',
          'zod',
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'astro/assets/services/noop',
          'astro/logger/console',
          'astro/logger/json',
        ],
      },
    },
  },
});
