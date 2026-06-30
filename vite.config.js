import { defineConfig, loadEnv } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync, cpSync, statSync, readdirSync, writeFileSync, rmSync, mkdirSync } from 'fs'
import { trackView, trackClick, saveProduct, deleteProduct, saveLanding } from './api/github.js'
import errorLoggerPlugin from './tools/vite-error-logger.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) }
      catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

function json(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function loadEnvFile() {
  try {
    const text = readFileSync(resolve(__dirname, '.env'), 'utf-8')
    text.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) return
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (key && !process.env[key]) {
        process.env[key] = val
      }
    })
  } catch (err) {
    console.warn('.env file tidak ditemukan atau gagal dibaca:', err.message)
  }
}

loadEnvFile()

export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        detail: resolve(__dirname, 'src/detail.html'),
        admin: resolve(__dirname, 'src/admin/index.html'),
        login: resolve(__dirname, 'src/admin/login.html'),
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
            if (statSync(dataPath).isFile()) {
              const ext = dataPath.split('.').pop()
              res.setHeader('Content-Type', ext === 'json' ? 'application/json' : 'text/plain')
              res.end(readFileSync(dataPath, 'utf-8'))
              return
            }
            if (statSync(dataPath).isDirectory()) {
              const files = readdirSync(dataPath).filter(f => f.endsWith('.json'))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(files))
              return
            }
          }
          next()
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
    {
      name: 'api-endpoints',
      configureServer(server) {
        server.middlewares.use('/api/track-view', async (req, res) => {
          if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
          try {
            const { productId } = await parseBody(req)
            if (!productId) return json(res, 400, { error: 'productId required' })
            await trackView(productId)
            json(res, 200, { ok: true })
          } catch (err) {
            json(res, 500, { error: err.message })
          }
        })

        server.middlewares.use('/api/track-click', async (req, res) => {
          if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
          try {
            const { productId } = await parseBody(req)
            if (!productId) return json(res, 400, { error: 'productId required' })
            await trackClick(productId)
            json(res, 200, { ok: true })
          } catch (err) {
            json(res, 500, { error: err.message })
          }
        })

        server.middlewares.use('/api/verify-login', async (req, res) => {
          if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
          try {
            const { password } = await parseBody(req)
            const valid = process.env.ADMIN_PASSWORD
            if (!password || password !== valid) {
              return json(res, 401, { error: 'Unauthorized' })
            }
            json(res, 200, { ok: true })
          } catch (err) {
            json(res, 500, { error: err.message })
          }
        })

        server.middlewares.use('/api/save-product', async (req, res) => {
          if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
          try {
            const auth = req.headers.authorization
            if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
              return json(res, 401, { error: 'Unauthorized' })
            }
            const { product } = await parseBody(req)
            if (!product || !product.id || !product.title || !product.lynkUrl) {
              return json(res, 400, { error: 'Missing required fields: id, title, lynkUrl' })
            }
            await saveProduct(product)
            const localPath = resolve(__dirname, 'data/products', `${product.id}.json`)
            mkdirSync(resolve(__dirname, 'data/products'), { recursive: true })
            writeFileSync(localPath, JSON.stringify(product, null, 2), 'utf-8')
            json(res, 200, { ok: true, id: product.id })
          } catch (err) {
            json(res, 500, { error: err.message })
          }
        })

        server.middlewares.use('/api/delete-product', async (req, res) => {
          if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
          try {
            const auth = req.headers.authorization
            if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
              return json(res, 401, { error: 'Unauthorized' })
            }
            const { productId } = await parseBody(req)
            if (!productId) return json(res, 400, { error: 'productId required' })
            await deleteProduct(productId)
            const localPath = resolve(__dirname, 'data/products', `${productId}.json`)
            if (existsSync(localPath)) rmSync(localPath)
            json(res, 200, { ok: true })
          } catch (err) {
            json(res, 500, { error: err.message })
          }
        })

        server.middlewares.use('/api/save-landing', async (req, res) => {
          if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
          try {
            const auth = req.headers.authorization
            if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
              return json(res, 401, { error: 'Unauthorized' })
            }
            const { landing } = await parseBody(req)
            if (!landing) return json(res, 400, { error: 'landing data required' })
            await saveLanding(landing)
            const localLandingPath = resolve(__dirname, 'data/landing.json')
            writeFileSync(localLandingPath, JSON.stringify(landing, null, 2), 'utf-8')
            json(res, 200, { ok: true })
          } catch (err) {
            json(res, 500, { error: err.message })
          }
        })
      },
    },
    errorLoggerPlugin(),
  ],
})
