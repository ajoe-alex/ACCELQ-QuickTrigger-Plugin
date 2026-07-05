import { existsSync, mkdirSync, rmSync, cpSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = path.join(root, 'plugin_assets')
const pluginDir = path.join(root, 'plugin')
const srcDir = path.join(pluginDir, 'src')
const outDir = path.join(pluginDir, 'build')

if (!existsSync(assetsDir)) {
  console.error('plugin_assets/ not found — run `vite build` first.')
  process.exit(1)
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

cpSync(assetsDir, outDir, { recursive: true })
cpSync(path.join(srcDir, 'manifest.json'), path.join(outDir, 'manifest.json'))
cpSync(path.join(srcDir, 'background.js'), path.join(outDir, 'background.js'))
cpSync(path.join(srcDir, 'icons'), path.join(outDir, 'icons'), { recursive: true })

console.log(`Chrome extension build ready at ${path.relative(root, outDir)}/ (zip this folder's contents to install)`)
