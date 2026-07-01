import type { BrowserWindow } from 'electron'
import {
  clampWindowPoint,
  isFiniteMainRect,
  isFinitePoint,
  isFiniteRect,
  mergePersistedWindowBounds,
  type PersistedWindowBounds,
} from '../ipc/windowBoundsHandlers'
import { appState } from '../app/appState'

export function getPersistedWindowBounds(): PersistedWindowBounds {
  return appState.persistedWindowBounds
}

export function setPersistedWindowBounds(partial: PersistedWindowBounds): void {
  appState.persistedWindowBounds = mergePersistedWindowBounds(appState.persistedWindowBounds, partial)
}

export function reportWindowBoundsToRenderer(partial: PersistedWindowBounds): void {
  if (appState.suppressWindowBoundsReport) return
  appState.persistedWindowBounds = mergePersistedWindowBounds(appState.persistedWindowBounds, partial)
  if (appState.mainWindow && !appState.mainWindow.isDestroyed()) {
    appState.mainWindow.webContents.send('artquest:v1:window-bounds:report', partial)
  }
}

export function applyPersistedWindowBounds(bounds: PersistedWindowBounds): void {
  appState.suppressWindowBoundsReport = true
  try {
    const { mainWindow, overlayWindow, referenceWindow } = appState
    if (mainWindow && !mainWindow.isDestroyed() && isFiniteMainRect(bounds.main)) {
      const current = mainWindow.getBounds()
      const next = clampWindowPoint(
        { x: bounds.main.x, y: bounds.main.y },
        bounds.main.width,
        bounds.main.height,
      )
      const target = { ...bounds.main, x: next.x, y: next.y }
      if (
        current.x !== target.x ||
        current.y !== target.y ||
        current.width !== target.width ||
        current.height !== target.height
      ) {
        mainWindow.setBounds(target)
      }
    }
    if (overlayWindow && !overlayWindow.isDestroyed() && isFinitePoint(bounds.overlay)) {
      const b = overlayWindow.getBounds()
      const next = clampWindowPoint(bounds.overlay, b.width, b.height)
      if (b.x !== next.x || b.y !== next.y) {
        overlayWindow.setBounds({ ...b, x: next.x, y: next.y })
      }
    }
    if (referenceWindow && !referenceWindow.isDestroyed() && isFiniteRect(bounds.reference)) {
      const current = referenceWindow.getBounds()
      const next = clampWindowPoint(
        { x: bounds.reference.x, y: bounds.reference.y },
        bounds.reference.width,
        bounds.reference.height,
      )
      const target = { ...bounds.reference, x: next.x, y: next.y }
      if (
        current.x !== target.x ||
        current.y !== target.y ||
        current.width !== target.width ||
        current.height !== target.height
      ) {
        referenceWindow.setBounds(target)
      }
    }
  } finally {
    appState.suppressWindowBoundsReport = false
  }
}

export function attachMainWindowBoundsReporting(mainWindow: BrowserWindow): void {
  const reportMainBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const b = mainWindow.getBounds()
    reportWindowBoundsToRenderer({
      main: { x: b.x, y: b.y, width: b.width, height: b.height },
    })
  }
  mainWindow.on('moved', reportMainBounds)
  mainWindow.on('resized', reportMainBounds)
}
