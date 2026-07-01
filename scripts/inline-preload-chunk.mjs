/**
 * electron-vite splits shared preload code into out/preload/chunks/*.cjs.
 * Packaged Electron can fail to resolve that relative require from preload.js,
 * leaving window.electronAPI undefined. Inline the chunk into each entry (like
 * dist-build-2026-06-28) and remove the chunks folder.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const preloadDir = path.join(root, 'out', 'preload')

function readExposeChunkSource(chunksDir) {
  const chunkFiles = fs
    .readdirSync(chunksDir)
    .filter((name) => name.startsWith('exposeElectronApi-') && name.endsWith('.cjs'))

  if (chunkFiles.length === 0) return null
  if (chunkFiles.length > 1) {
    console.warn('[inline-preload-chunk] multiple exposeElectronApi chunks; using first:', chunkFiles[0])
  }

  let source = fs.readFileSync(path.join(chunksDir, chunkFiles[0]), 'utf8')
  // Drop CommonJS export getters — functions stay in scope after inlining.
  source = source.replace(/\r?\nObject\.defineProperty\(exports[\s\S]*$/m, '').trimEnd()
  return source
}

function inlineEntry(entryPath, chunkSource, invokeCall) {
  if (!fs.existsSync(entryPath)) return false

  const entrySource = fs.readFileSync(entryPath, 'utf8')
  const requirePattern = /require\("\.\/chunks\/exposeElectronApi-[^"]+\.cjs"\)\.\w+\(\);?/

  if (!requirePattern.test(entrySource)) {
    console.log(`[inline-preload-chunk] ${path.basename(entryPath)} already monolithic, skipping`)
    return false
  }

  const inlined = `${chunkSource}\n${invokeCall}\n`
  fs.writeFileSync(entryPath, inlined, 'utf8')
  console.log(`[inline-preload-chunk] inlined ${path.basename(entryPath)} (${inlined.length} bytes)`)
  return true
}

function main() {
  const chunksDir = path.join(preloadDir, 'chunks')
  if (!fs.existsSync(chunksDir)) {
    console.log('[inline-preload-chunk] no chunks dir — preload already monolithic')
    return
  }

  const chunkSource = readExposeChunkSource(chunksDir)
  if (!chunkSource) {
    console.warn('[inline-preload-chunk] chunks dir exists but no exposeElectronApi chunk found')
    return
  }

  inlineEntry(path.join(preloadDir, 'preload.js'), chunkSource, 'exposeElectronApi();')
  inlineEntry(path.join(preloadDir, 'overlayPreload.js'), chunkSource, 'exposeOverlayElectronApi();')

  fs.rmSync(chunksDir, { recursive: true, force: true })
  console.log('[inline-preload-chunk] removed out/preload/chunks')
}

main()
