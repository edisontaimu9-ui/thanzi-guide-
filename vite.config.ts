import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves this repo at /thanzi-guide-/, not from the root —
// only apply that prefix for production builds so local dev (npm run dev)
// still works normally at http://localhost:5173/.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/thanzi-guide-/' : '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Thanzi Guide',
        short_name: 'Thanzi Guide',
        description: 'Learn about your health. Understand your food. Make better choices.',
        theme_color: '#0F5E4C',
        background_color: '#FBF8F2',
        display: 'standalone',
        // '.' means "relative to wherever this manifest is served from" —
        // resolves correctly whether that's the root or /thanzi-guide-/.
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}']
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
}));
