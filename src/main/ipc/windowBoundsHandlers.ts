import { ipcMain, screen, type BrowserWindow } from 'electron'

export type WindowBoundsPoint = {
  x: number
  y: number
}

export type WindowBoundsRect = WindowBoundsPoint & {
  width: number
  height: number
}

export type PersistedWindowBounds = {
  main?: WindowBoundsRect
  overlay?: WindowBoundsPoint
  reference?: WindowBoundsRect
}

export type WindowBoundsIpcDeps = {
  getMainWindow: () => BrowserWindow | null
  getPersistedBounds: () => PersistedWindowBounds
  setPersistedBounds: (partial: PersistedWindowBounds) => void
  applyPersistedBounds: (bounds: PersistedWindowBounds) => void
}

export function isFinitePoint(p: WindowBoundsPoint | undefined): p is WindowBoundsPoint {
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y)
}

export function isFiniteRect(r: WindowBoundsRect | undefined): r is WindowBoundsRect {
  return (
    !!r &&
    Number.isFinite(r.x) &&
    Number.isFinite(r.y) &&
    Number.isFinite(r.width) &&
    Number.isFinite(r.height) &&
    r.width >= 320 &&
    r.height >= 240
  )
}

export function isFiniteMainRect(r: WindowBoundsRect | undefined): r is WindowBoundsRect {
  return (
    !!r &&
    Number.isFinite(r.x) &&
    Number.isFinite(r.y) &&
    Number.isFinite(r.width) &&
    Number.isFinite(r.height) &&
    r.width >= 800 &&
    r.height >= 720
  )
}

/** Clamp window position so at least 120px remain on some display work area. */
export function clampWindowPoint(
  point: WindowBoundsPoint,
  width: number,
  height: number,
): WindowBoundsPoint {
  const displays = screen.getAllDisplays()
  for (const display of displays) {
    const area = display.workArea
    const minVisible = 120
    const x = Math.min(Math.max(area.x - width + minVisible, point.x), area.x + area.width - minVisible)
    const y = Math.min(Math.max(area.y, point.y), area.y + area.height - minVisible)
    if (x === point.x && y === point.y) return { x, y }
    if (
      x + width > area.x + minVisible &&
      y + height > area.y + minVisible &&
      x < area.x + area.width &&
      y < area.y + area.height
    ) {
      return { x, y }
    }
  }
  return point
}

export function mergePersistedWindowBounds(
  current: PersistedWindowBounds,
  partial: PersistedWindowBounds,
): PersistedWindowBounds {
  return {
    main: partial.main ? { ...current.main, ...partial.main } : current.main,
    overlay: partial.overlay ? { ...current.overlay, ...partial.overlay } : current.overlay,
    reference: partial.reference ? { ...current.reference, ...partial.reference } : current.reference,
  }
}

export function registerWindowBoundsIpcHandlers(deps: WindowBoundsIpcDeps): void {
  ipcMain.handle('artquest:v1:window-bounds:apply', async (_, raw: unknown) => {
    if (!raw || typeof raw !== 'object') return { success: false, error: 'invalid bounds' }
    const partial = raw as PersistedWindowBounds
    const next = mergePersistedWindowBounds(deps.getPersistedBounds(), partial)
    deps.setPersistedBounds(next)
    deps.applyPersistedBounds(next)
    return { success: true }
  })
}

export function createWindowBoundsReporter(getMainWindow: () => BrowserWindow | null) {
  return (partial: PersistedWindowBounds): void => {
    const win = getMainWindow()
    if (!win || win.isDestroyed()) return
    win.webContents.send('artquest:v1:window-bounds:report', partial)
  }
}

export function parsePersistedWindowBounds(raw: unknown): PersistedWindowBounds {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const mainRaw = o.main
  const overlayRaw = o.overlay
  const referenceRaw = o.reference
  const out: PersistedWindowBounds = {}
  if (mainRaw && typeof mainRaw === 'object') {
    const r = mainRaw as Record<string, unknown>
    if (
      typeof r.x === 'number' &&
      typeof r.y === 'number' &&
      typeof r.width === 'number' &&
      typeof r.height === 'number'
    ) {
      out.main = { x: r.x, y: r.y, width: r.width, height: r.height }
    }
  }
  if (overlayRaw && typeof overlayRaw === 'object') {
    const ox = (overlayRaw as { x?: unknown }).x
    const oy = (overlayRaw as { y?: unknown }).y
    if (typeof ox === 'number' && typeof oy === 'number') out.overlay = { x: ox, y: oy }
  }
  if (referenceRaw && typeof referenceRaw === 'object') {
    const r = referenceRaw as Record<string, unknown>
    if (
      typeof r.x === 'number' &&
      typeof r.y === 'number' &&
      typeof r.width === 'number' &&
      typeof r.height === 'number'
    ) {
      out.reference = { x: r.x, y: r.y, width: r.width, height: r.height }
    }
  }
  return out
}
