import { defineConfig } from 'vite'
import { resolve } from 'path'
import { existsSync, readFileSync, cpSync } from 'fs'

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        detail: resolve(__dirname, 'src/detail.html'),
        admin: resolve(__dirname, 'src/admin/index.html'),
      },
    },
  },
  server: {
    open: '/',
    fs: {
      allow: ['..'],
    },
  },
  plugins: [
    {
      name: 'serve-data',
      configureServer(server) {
        server.middlewares.use('/data', (req, res, next) => {
          const dataPath = resolve(__dirname, 'data', req.url.slice(1))
          if (existsSync(dataPath)) {
            const ext = dataPath.split('.').pop()
            const mime = ext === 'json' ? 'application/json' : 'text/plain'
            res.setHeader('Content-Type', mime)
            res.end(readFileSync(dataPath, 'utf-8'))
          } else {
            next()
          }
        })
      },
      closeBundle() {
        const src = resolve(__dirname, 'data')
        const dest = resolve(__dirname, 'dist/data')
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true, force: true })
        }
      },
    },
  ],
})
