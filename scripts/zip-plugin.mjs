import { existsSync, mkdirSync, rmSync, readFileSync, createWriteStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import archiver from 'archiver'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = path.join(root, 'plugin', 'build')
const distDir = path.join(root, 'plugin', 'dist')
const manifestPath = path.join(root, 'plugin', 'src', 'manifest.json')

if (!existsSync(buildDir)) {
  console.error('plugin/build/ not found — run the plugin build first.')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
const zipName = `accelq-quicktrigger-${manifest.version}.zip`
const zipPath = path.join(distDir, zipName)

rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })

const output = createWriteStream(zipPath)
const archive = archiver('zip', { zlib: { level: 9 } })

output.on('close', () => {
  const sizeKb = (archive.pointer() / 1024).toFixed(1)
  console.log(`Chrome extension zip ready at plugin/dist/${zipName} (${sizeKb} KB)`)
})

archive.on('error', (err) => {
  console.error('Failed to create zip:', err.message)
  process.exit(1)
})

archive.pipe(output)
archive.directory(buildDir, false)
await archive.finalize()
