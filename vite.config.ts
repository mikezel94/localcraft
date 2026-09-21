import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-maskable.svg'],
      manifest: {
        id: '/',
        name: 'LocalCraft — offline toolbox',
        short_name: 'LocalCraft',
        description:
          'A toolbox for developers and everyday work that runs entirely in your browser. Zero servers, 100% private, works offline.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#12172b',
        theme_color: '#12172b',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // mjs covers the lazily loaded pdf.js worker; wasm stays runtime-cached (ffmpeg core is 25 MB)
        globPatterns: ['**/*.{js,mjs,css,html,svg,woff2}'],
        // pdf.js worker + fonts are large; precache everything so the app is fully offline.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // ffmpeg core: big, so cache on first use instead of precaching
            urlPattern: /\/ffmpeg\/.+\.(wasm|js)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'ffmpeg-core', expiration: { maxEntries: 4, purgeOnQuotaError: true } },
          },
          {
            // background-removal model blobs (one-time download, then offline)
            urlPattern: /^https:\/\/staticimgly\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'imgly-model', expiration: { maxEntries: 32, purgeOnQuotaError: true } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
});
