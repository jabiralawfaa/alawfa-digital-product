import { spawn } from 'child_process'
import { createWriteStream, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const logsDir = join(root, 'logs')
mkdirSync(logsDir, { recursive: true })

const date = new Date().toISOString().slice(0, 10)
const logFile = join(logsDir, `dev-${date}.log`)
const stream = createWriteStream(logFile, { flags: 'a' })

function ts() {
  return new Date().toLocaleTimeString('id-ID', { hour12: false })
}

function write(prefix, text) {
  const time = ts()
  text.split('\n').forEach(line => {
    if (!line) return
    const entry = `[${time}] [${prefix}] ${line}`
    console.log(entry)
    stream.write(entry + '\n')
  })
}

console.log(`[${ts()}] [LOGGER] Logging ke: ${logFile}`)
stream.write(`[${ts()}] [LOGGER] === Server started ===\n`)

const vite = spawn('npx', ['vite'], {
  cwd: root,
  shell: true,
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe'],
})

vite.stdout.on('data', d => write('INFO', d.toString().trimEnd()))
vite.stderr.on('data', d => write('ERR',  d.toString().trimEnd()))

vite.on('close', code => {
  write('LOGGER', `Vite exited with code ${code}`)
  stream.end()
  process.exit(code)
})

process.on('SIGINT', () => {
  write('LOGGER', 'Received SIGINT, shutting down...')
  vite.kill('SIGINT')
})
process.on('SIGTERM', () => {
  write('LOGGER', 'Received SIGTERM, shutting down...')
  vite.kill('SIGTERM')
})
