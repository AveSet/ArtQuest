/**
 * Builds static portrait WebP/PNG from sources in public/portraits/sources/.
 * Accepts: SVG, WebP, PNG, JPEG sources named either `portrait-{gender}.{ext}` or `{gender}.{ext}`.
 * Drops generated files into public/portraits/ as `{gender}.webp` + `{gender}.png`.
 * Run: node scripts/generate-portrait-assets.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../public/portraits')
const SRC_DIR = path.join(OUT_DIR, 'sources')
const SIZE = 512

const GENDERS = ['male', 'female']
const EXT_PRIORITY = ['svg', 'webp', 'png', 'jpg', 'jpeg']

function findSource(gender) {
  for (const ext of EXT_PRIORITY) {
    for (const name of [`portrait-${gender}.${ext}`, `${gender}.${ext}`]) {
      const fp = path.join(SRC_DIR, name)
      if (fs.existsSync(fp)) return fp
    }
  }
  return null
}

async function buildPortrait(gender) {
  const srcPath = findSource(gender)
  if (!srcPath) {
    console.warn(`[portraits] skip ${gender}: no source found in ${SRC_DIR}`)
    return
  }

  const ext = path.extname(srcPath).toLowerCase()
  const isVector = ext === '.svg'

  const webpPath = path.join(OUT_DIR, `${gender}.webp`)
  const pngPath = path.join(OUT_DIR, `${gender}.png`)

  const sharpOpts = isVector ? { density: 144 } : {}
  const pipeline = sharp(srcPath, sharpOpts).resize(SIZE, SIZE, { fit: 'cover' })

  await pipeline.clone().webp({ quality: 86, effort: 4 }).toFile(webpPath)
  await pipeline.clone().png({ compressionLevel: 9 }).toFile(pngPath)

  console.log(`[portraits] ${gender} ← ${path.basename(srcPath)} → ${path.basename(webpPath)}, ${path.basename(pngPath)}`)
}

fs.mkdirSync(OUT_DIR, { recursive: true })
for (const gender of GENDERS) {
  await buildPortrait(gender)
}
