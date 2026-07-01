import { app, nativeImage } from 'electron'
import fs from 'fs'
import path from 'path'

/** 16×16 minimal PNG fallback so tray works even without resources/tray.png on disk */
const TRAY_ICON_FALLBACK = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAIUlEQVQ4y2NkGGj4DwQMDAwMjEAkPjYwDJgYBoYBBgYGAAC9ABYJ5XaEAAAAAElFTkSuQmCC',
  'base64',
)

function resolveTrayImagePath(): string | null {
  const exeResources = path.join(path.dirname(process.execPath), 'resources')
  const candidates: string[] = []

  if (app.isPackaged) {
    candidates.push(
      path.join(process.resourcesPath, 'tray.png'),
      path.join(process.resourcesPath, 'resources', 'tray.png'),
      path.join(exeResources, 'tray.png'),
      path.join(exeResources, 'resources', 'tray.png'),
    )
  }

  candidates.push(
    path.join(process.cwd(), 'resources', 'tray.png'),
    path.join(__dirname, '..', '..', 'resources', 'tray.png'),
    path.join(__dirname, '..', 'resources', 'tray.png'),
    path.join(process.resourcesPath, 'tray.png'),
    path.join(process.resourcesPath, 'resources', 'tray.png'),
  )

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }
  return null
}

function resolveAppIconIcoPath(): string | null {
  const exeResources = path.join(path.dirname(process.execPath), 'resources')
  const candidates: string[] = []

  if (app.isPackaged) {
    candidates.push(
      path.join(process.resourcesPath, 'app-icon.ico'),
      path.join(process.resourcesPath, 'resources', 'app-icon.ico'),
      path.join(exeResources, 'app-icon.ico'),
      path.join(exeResources, 'resources', 'app-icon.ico'),
    )
  }

  candidates.push(
    path.join(process.cwd(), 'build', 'icon.ico'),
    path.join(process.cwd(), 'resources', 'app-icon.ico'),
  )

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }
  return null
}

function resolveWindowIconPath(): string | null {
  const exeResources = path.join(path.dirname(process.execPath), 'resources')
  const candidates: string[] = []

  if (app.isPackaged) {
    candidates.push(
      path.join(process.resourcesPath, 'window-icon.png'),
      path.join(process.resourcesPath, 'resources', 'window-icon.png'),
      path.join(exeResources, 'window-icon.png'),
      path.join(exeResources, 'resources', 'window-icon.png'),
    )
  }

  candidates.push(
    path.join(process.cwd(), 'resources', 'window-icon.png'),
    path.join(__dirname, '..', '..', 'resources', 'window-icon.png'),
    path.join(__dirname, '..', 'resources', 'window-icon.png'),
    path.join(process.resourcesPath, 'window-icon.png'),
    path.join(process.resourcesPath, 'resources', 'window-icon.png'),
  )

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }
  return null
}

function normalizeTrayNativeImage(icon: Electron.NativeImage): Electron.NativeImage {
  if (!icon || icon.isEmpty()) return icon
  const { width, height } = icon.getSize()
  const maxDim = 64
  if (width <= maxDim && height <= maxDim) return icon
  const scale = maxDim / Math.max(width, height)
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  return icon.resize({
    width: Math.max(16, w),
    height: Math.max(16, h),
  })
}

function finalizeTraySizes(icon: Electron.NativeImage): Electron.NativeImage {
  if (!icon || icon.isEmpty()) return icon
  if (process.platform === 'darwin') return icon
  try {
    return icon.resize({ width: 32, height: 32 })
  } catch {
    return icon
  }
}

export function loadTrayNativeImage(): Electron.NativeImage {
  const trayPath = resolveTrayImagePath()
  if (trayPath) {
    try {
      const png = fs.readFileSync(trayPath)
      let decoded = nativeImage.createFromBuffer(png)
      if (decoded.isEmpty()) {
        decoded = nativeImage.createFromPath(trayPath)
      }
      if (!decoded.isEmpty()) {
        return finalizeTraySizes(normalizeTrayNativeImage(decoded))
      }
      console.warn('[tray] Tray image decode empty at:', trayPath)
    } catch (e) {
      console.warn('[tray] Could not read tray image file:', trayPath, e)
    }
  } else {
    console.warn('[tray] tray.png not found — using embedded fallback')
  }

  try {
    const fb = finalizeTraySizes(normalizeTrayNativeImage(nativeImage.createFromBuffer(TRAY_ICON_FALLBACK)))
    if (!fb.isEmpty()) return fb
  } catch {
    //
  }

  console.error('[tray] Embedded fallback decode failed')
  return finalizeTraySizes(nativeImage.createFromBuffer(TRAY_ICON_FALLBACK))
}

/** Windows prefers ICO for taskbar / Alt+Tab; PNG is fallback (also used on Linux). */
export function loadWindowIcon(): Electron.NativeImage {
  if (process.platform === 'win32') {
    const icoPath = resolveAppIconIcoPath()
    if (icoPath) {
      try {
        let fromIco = nativeImage.createFromPath(icoPath)
        if (fromIco.isEmpty()) {
          const buf = fs.readFileSync(icoPath)
          fromIco = nativeImage.createFromBuffer(buf)
        }
        if (!fromIco.isEmpty()) {
          return fromIco
        }
        console.warn('[icon] ICO decoded empty:', icoPath)
      } catch (e) {
        console.warn('[icon] ICO load failed:', icoPath, e)
      }
    }
  }

  const iconPath = resolveWindowIconPath()
  if (iconPath) {
    try {
      const png = fs.readFileSync(iconPath)
      let decoded = nativeImage.createFromBuffer(png)
      if (decoded.isEmpty()) {
        decoded = nativeImage.createFromPath(iconPath)
      }
      if (!decoded.isEmpty()) {
        return decoded
      }
      console.warn('[icon] Window icon decode empty at:', iconPath)
    } catch (e) {
      console.warn('[icon] Could not read window icon:', iconPath, e)
    }
  } else {
    console.warn('[icon] window-icon.png not found — falling back to tray asset')
  }

  return loadTrayNativeImage()
}

export function resolvePreloadPath(surface: 'main' | 'overlay' = 'main'): string {
  const fileName = surface === 'main' ? 'preload.js' : 'overlayPreload.js'
  const candidates = [
    path.join(__dirname, '..', 'preload', fileName),
    path.join(__dirname, '..', fileName),
    path.join(__dirname, '..', '..', 'preload', fileName),
    path.join(__dirname, '..', '..', 'preload', surface === 'main' ? 'preload.mjs' : 'overlayPreload.mjs'),
    path.join(process.resourcesPath, 'app.asar', 'out', 'preload', fileName),
    path.join(process.resourcesPath, 'app', 'out', 'preload', fileName),
    path.join(process.resourcesPath, 'out', 'preload', fileName),
  ]
  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      return p
    }
  }
  const msg = `[preload] Could not resolve preload path for ${surface}; tried: ${candidates.join(', ')}`
  console.error(msg)
  throw new Error(msg)
}
