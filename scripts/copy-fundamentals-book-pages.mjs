/**
 * Copy book page PNGs into public/fundamentals/pages/ for bundled fundamentals UI.
 * Source: D:\books\25 Drawing Exercises\25 Drawing Exercises-NN.png
 *
 * Usage: node scripts/copy-fundamentals-book-pages.mjs
 * Env: FUNDAMENTALS_BOOK_SOURCE_DIR overrides default source folder.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DEFAULT_SOURCE = 'D:\\books\\25 Drawing Exercises'
const TARGET_DIR = path.join(ROOT, 'public', 'fundamentals', 'pages')
const PAGE_COUNT = 76

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function main() {
  const sourceDir = process.env.FUNDAMENTALS_BOOK_SOURCE_DIR ?? DEFAULT_SOURCE
  if (!(await exists(sourceDir))) {
    console.warn(`[fundamentals-pages] Source not found, skipping: ${sourceDir}`)
    return
  }

  await fs.mkdir(TARGET_DIR, { recursive: true })
  let copied = 0
  for (let page = 1; page <= PAGE_COUNT; page++) {
    const nn = String(page).padStart(2, '0')
    const srcName = `25 Drawing Exercises-${nn}.png`
    const src = path.join(sourceDir, srcName)
    const dest = path.join(TARGET_DIR, `${nn}.png`)
    if (!(await exists(src))) {
      console.warn(`[fundamentals-pages] Missing: ${srcName}`)
      continue
    }
    await fs.copyFile(src, dest)
    copied++
  }
  console.log(`[fundamentals-pages] Copied ${copied}/${PAGE_COUNT} pages → ${TARGET_DIR}`)
}

main().catch((err) => {
  console.error('[fundamentals-pages]', err)
  process.exit(1)
})
