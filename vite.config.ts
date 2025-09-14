import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB limit
      },
      manifest: {
        name: 'Generic LLM RAG',
        short_name: 'LLM-RAG',
        display: 'standalone',
        start_url: '/',
        background_color: '#0b0b0b',
        theme_color: '#0b0b0b',
        icons: [
          { src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/vite.svg', sizes: '512x512', type: 'image/svg+xml' }
        ],
      },
    }),
  ],
})
