import { createWriteStream, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const logsDir = join(__dirname, '..', 'logs')
mkdirSync(logsDir, { recursive: true })

const date = new Date().toISOString().slice(0, 10)
const errorLog = join(logsDir, `error-${date}.log`)
const stream = createWriteStream(errorLog, { flags: 'a' })

function ts() {
  return new Date().toLocaleTimeString('id-ID', { hour12: false })
}

function log(prefix, msg, extra = '') {
  const time = ts()
  const entry = `[${time}] [${prefix}] ${msg}${extra ? '\n' + extra : ''}`
  stream.write(entry + '\n')
  console.error(entry)
}

export default function errorLoggerPlugin() {
  return {
    name: 'error-logger',
    configureServer(server) {
      log('PLUGIN', `Error logger aktif, log file: ${errorLog}`)

      // Log unhandled promise rejections
      process.on('unhandledRejection', (reason) => {
        log('UNHANDLED', reason?.message || String(reason),
          reason?.stack ? `Stack:\n${reason.stack}` : '')
      })

      process.on('uncaughtException', (err) => {
        log('UNCAUGHT', err.message, err.stack)
      })

      // Intercept API middleware errors
      const origUse = server.middlewares.use
      server.middlewares.use = function (...args) {
        const fn = args[args.length - 1]
        if (typeof fn === 'function' && fn.name !== 'error-logger-wrap') {
          const wrapped = function errorLoggerWrap(req, res, next) {
            const wrappedNext = (err) => {
              if (err) {
                log('API', `${req.method} ${req.url} — ${err.message}`,
                  err.stack)
              }
              next(err)
            }
            try {
              const result = fn(req, res, wrappedNext)
              if (result && typeof result.catch === 'function') {
                result.catch(err => {
                  log('API', `${req.method} ${req.url} — ${err.message}`,
                    err.stack)
                  if (!res.headersSent) {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: err.message }))
                  }
                })
              }
            } catch (err) {
              log('API', `${req.method} ${req.url} — ${err.message}`,
                err.stack)
              wrappedNext(err)
            }
          }
          Object.defineProperty(wrapped, 'name', { value: 'error-logger-wrap' })
          args[args.length - 1] = wrapped
        }
        return origUse.apply(server.middlewares, args)
      }
    },
    closeBundle() {
      stream.end()
    },
  }
}
