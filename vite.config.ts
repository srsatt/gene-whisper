import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'
import type { Connect } from 'vite'

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
    // Robust static large-file server with Range support for model files
    {
      name: 'serve-large-models',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          if (!url.startsWith('/II-Medical-8B-q4f16_1-MLC/') && !url.startsWith('/wasm/')) return next()

          const publicRoot = path.resolve(process.cwd(), 'public')
          // Rewrite HF-style resolve path to local files
          let rewrittenUrl = url.replace(
            /^\/II-Medical-8B-q4f16_1-MLC\/resolve\/main\//,
            '/II-Medical-8B-q4f16_1-MLC/'
          )
          const safeRelPath = path.normalize(rewrittenUrl).replace(/^\/+/, '')
          const filePath = path.resolve(publicRoot, safeRelPath)

          if (!filePath.startsWith(publicRoot)) {
            res.statusCode = 403
            return res.end('Forbidden')
          }

          if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            return res.end('{"error":"Not Found"}')
          }

          const stat = fs.statSync(filePath)

          const getContentType = (p: string) => {
            if (p.endsWith('.json')) return 'application/json'
            if (p.endsWith('.wasm')) return 'application/wasm'
            if (p.endsWith('.bin')) return 'application/octet-stream'
            if (p.endsWith('.model')) return 'application/octet-stream'
            if (p.endsWith('.txt')) return 'text/plain; charset=utf-8'
            return 'application/octet-stream'
          }

          res.setHeader('Content-Type', getContentType(filePath))
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          res.setHeader('Accept-Ranges', 'bytes')

          const range = req.headers['range']
          if (range) {
            const match = /bytes=(\d+)-(\d+)?/.exec(range)
            const start = match ? Number(match[1]) : 0
            const end = match && match[2] ? Number(match[2]) : stat.size - 1
            if (start >= stat.size || end >= stat.size) {
              res.statusCode = 416
              res.setHeader('Content-Range', `bytes */${stat.size}`)
              return res.end()
            }
            res.statusCode = 206
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`)
            res.setHeader('Content-Length', String(end - start + 1))
            const stream = fs.createReadStream(filePath, { start, end })
            stream.pipe(res)
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Length', String(stat.size))
          const stream = fs.createReadStream(filePath)
          stream.pipe(res)
        })
      }
    }
  ],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    fs: {
      allow: ['..', '.'],
    },
    // Configure for large files
    hmr: {
      overlay: false
    },
    // Increase server limits for large model files
    middlewareMode: false,
    proxy: {},
    cors: true,
    // Configure static file serving for large files
    open: false,
    strictPort: true,
    host: 'localhost',
    port: 5173,
    allowedHosts: ['cfaccd53f5e4.ngrok.app']
  },
  // Configure build for large assets
  build: {
    assetsInlineLimit: 0, // Don't inline any assets
    chunkSizeWarningLimit: 50000, // Increase chunk size warning limit
    rollupOptions: {
      output: {
        // Ensure large files are not processed by Rollup
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.includes('II-Medical') || assetInfo.name?.includes('MLC')) {
            return '[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
})
