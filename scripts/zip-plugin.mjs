import { existsSync, mkdirSync, rmSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

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

try {
  execFileSync('zip', ['-r', '-X', '-q', zipPath, '.'], { cwd: buildDir, stdio: 'inherit' })
} catch (err) {
  console.error('Failed to create zip. Ensure the "zip" command-line tool is installed and on PATH.')
  process.exit(1)
}

console.log(`Chrome extension zip ready at ${path.relative(root, zipPath)}`)
