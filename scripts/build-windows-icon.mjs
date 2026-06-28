/**
 * Builds build/icon.ico from build/icon-source.png for Windows (taskbar, Start, shortcuts).
 * Strips typical gray/white checkerboard “fake transparency” if the PNG has no alpha.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const srcPath = path.join(root, 'build', 'icon-source.png')
const outIco = path.join(root, 'build', 'icon.ico')
const tmpDir = path.join(root, 'build', 'icon-ico-pngs')

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

/** Outside logo — checker preview, flat white mat, or light gray (connected to edges → transparent). */
function isLikelyCheckerPixel(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min > 40) return false
  if (min >= 232 && max <= 255) return true
  if (min >= 175 && max <= 240) return true
  return false
}

async function stripCheckerboardIfOpaquePipeline(input) {
  const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const stride = 4

  // Flood-fill transparency from edges through neutral light backgrounds (checker / white mat).
  const out = Buffer.from(data)
  const visited = new Uint8Array(w * h)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const idx = y * w + x
    if (visited[idx]) return
    visited[idx] = 1
    stack.push([x, y])
  }

  for (let x = 0; x < w; x++) {
    push(x, 0)
    push(x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    push(0, y)
    push(w - 1, y)
  }

  while (stack.length) {
    const [x, y] = stack.pop()
    const i = (y * w + x) * stride
    const r = out[i]
    const g = out[i + 1]
    const b = out[i + 2]
    if (!isLikelyCheckerPixel(r, g, b)) continue
    out[i + 3] = 0
    push(x + 1, y)
    push(x - 1, y)
    push(x, y + 1)
    push(x, y - 1)
  }

  return sharp(Buffer.from(out), { raw: { width: w, height: h, channels: 4 } }).png()
}

async function main() {
  if (!fs.existsSync(srcPath)) {
    console.error('Missing', srcPath)
    process.exit(1)
  }

  fs.mkdirSync(tmpDir, { recursive: true })

  const cleanedSharp = await stripCheckerboardIfOpaquePipeline(sharp(srcPath))
  const masterPng = await cleanedSharp.png({ compressionLevel: 9 }).toBuffer()

  const pngPaths = []
  for (const size of ICO_SIZES) {
    const pngPath = path.join(tmpDir, `icon-${size}.png`)
    await sharp(masterPng)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(pngPath)
    pngPaths.push(pngPath)
  }

  const ico = await pngToIco(pngPaths)
  fs.writeFileSync(outIco, ico)
  console.log('Wrote', outIco, '(' + ICO_SIZES.join(', ') + ')')

  const trayPath = path.join(root, 'resources', 'tray.png')
  await sharp(masterPng)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(trayPath)
  console.log('Wrote', trayPath, '(64×64)')

  const windowIconPath = path.join(root, 'resources', 'window-icon.png')
  await sharp(masterPng)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(windowIconPath)
  console.log('Wrote', windowIconPath, '(256×256 taskbar / window)')

  const brandDir = path.join(root, 'src', 'renderer', 'assets')
  fs.mkdirSync(brandDir, { recursive: true })
  const brandPath = path.join(brandDir, 'artquest-icon.png')
  await sharp(masterPng)
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(brandPath)
  console.log('Wrote', brandPath, '(Navbar / favicon source)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
