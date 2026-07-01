import { BrowserWindow, screen } from 'electron'
import { appState } from '../app/appState'
import { applyAppDocumentCsp } from '../windowSecurity'
import { createRendererWebPreferences } from './rendererWebPreferences'
import { resolvePreloadPath } from './iconAssets'
import { loadRendererRoute } from './loadRendererRoute'
import { reportWindowBoundsToRenderer } from './windowBoundsState'
import { sendQuestSessionCommand } from '../app/sessionCommands'

const OVERLAY_WIDTH = 258
const OVERLAY_RIGHT_INSET = 72
const OVERLAY_MIN_HEIGHT = 168
const OVERLAY_MAX_HEIGHT = 440
const OVERLAY_QUEST_HEIGHT = 188
const OVERLAY_PRACTICE_HEIGHT = 188

export function pushOverlayPayloadToWindow(): void {
  if (!appState.overlayWindow || appState.overlayWindow.isDestroyed()) return
  const contents = appState.overlayWindow.webContents
  if (contents.isLoading()) {
    contents.once('did-finish-load', () => pushOverlayPayloadToWindow())
    return
  }
  contents.send('artquest:v1:overlay:update', appState.cachedOverlayPayload)
}

export function applyOverlayWindowLayout(
  partial: Partial<typeof appState.overlayLayoutState> = {},
): void {
  if (partial.sessionType === 'quest' || partial.sessionType === 'practice') {
    appState.overlayLayoutState.sessionType = partial.sessionType
  }
  if (partial.refsOpen !== undefined) {
    appState.overlayLayoutState.refsOpen = partial.refsOpen === true
  }
  if (typeof partial.contentHeight === 'number' && partial.contentHeight > 0) {
    appState.overlayLayoutState.contentHeight = Math.ceil(partial.contentHeight)
  }

  if (!appState.overlayWindow || appState.overlayWindow.isDestroyed()) return
  const isPractice = appState.overlayLayoutState.sessionType === 'practice'
  const width = OVERLAY_WIDTH
  const fallback = isPractice ? OVERLAY_PRACTICE_HEIGHT : OVERLAY_QUEST_HEIGHT
  const measured = appState.overlayLayoutState.contentHeight
  const height = Math.min(
    OVERLAY_MAX_HEIGHT,
    Math.max(OVERLAY_MIN_HEIGHT, measured && measured > 0 ? measured : fallback),
  )
  appState.overlayWindow.setMinimumSize(width, height)
  appState.overlayWindow.setMaximumSize(width, height)
  const bounds = appState.overlayWindow.getBounds()
  if (bounds.height === height && bounds.width === width) return
  appState.overlayWindow.setBounds({ ...bounds, width, height })
}

function defaultOverlayPosition(width: number): { x: number; y: number } {
  const display = screen.getPrimaryDisplay().workArea
  return {
    x: Math.max(display.x + 16, display.x + display.width - width - OVERLAY_RIGHT_INSET),
    y: display.y + 32,
  }
}

export function createOverlayWindow(): BrowserWindow {
  if (appState.overlayWindow && !appState.overlayWindow.isDestroyed()) return appState.overlayWindow
  const saved = appState.persistedWindowBounds.overlay
  const fallback = defaultOverlayPosition(OVERLAY_WIDTH)
  const overlayX = typeof saved?.x === 'number' ? saved.x : fallback.x
  const overlayY = typeof saved?.y === 'number' ? saved.y : fallback.y
  appState.overlayWindow = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: OVERLAY_QUEST_HEIGHT,
    hasShadow: false,
    x: overlayX,
    y: overlayY,
    minWidth: OVERLAY_WIDTH,
    minHeight: OVERLAY_QUEST_HEIGHT,
    maxWidth: OVERLAY_WIDTH,
    maxHeight: OVERLAY_MAX_HEIGHT,
    resizable: false,
    frame: false,
    transparent: true,
    roundedCorners: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: createRendererWebPreferences({ preloadPath: resolvePreloadPath('overlay') }),
  })
  applyAppDocumentCsp(appState.overlayWindow.webContents.session)
  appState.overlayWindow.setAlwaysOnTop(true, 'floating')
  appState.overlayWindow.on('closed', () => {
    appState.overlayWindow = null
  })
  appState.overlayWindow.on('moved', () => {
    if (!appState.overlayWindow || appState.overlayWindow.isDestroyed()) return
    const { x, y } = appState.overlayWindow.getBounds()
    reportWindowBoundsToRenderer({ overlay: { x, y } })
  })
  appState.overlayWindow.webContents.on('did-finish-load', () => {
    pushOverlayPayloadToWindow()
  })
  appState.overlayWindow.once('ready-to-show', () => appState.overlayWindow?.show())
  loadRendererRoute(appState.overlayWindow, '/overlay')
  return appState.overlayWindow
}

export function showOverlayWindow(hideMain = false): void {
  const win = createOverlayWindow()
  appState.overlayLayoutState.refsOpen = false
  applyOverlayWindowLayout({ refsOpen: false })
  win.show()
  win.focus()
  if (hideMain && appState.mainWindow && !appState.mainWindow.isDestroyed()) {
    appState.mainWindow.hide()
  }
}

export function hideOverlayForSessionExpand(): void {
  if (appState.overlayWindow && !appState.overlayWindow.isDestroyed()) {
    appState.overlayWindow.hide()
  }
}

export function hideSessionOverlayWindow(): void {
  hideOverlayForSessionExpand()
}

export function toggleOverlayWindow(): void {
  const win = createOverlayWindow()
  if (win.isVisible()) {
    sendQuestSessionCommand('showMainWindow')
    return
  }
  win.show()
  win.focus()
  if (appState.mainWindow && !appState.mainWindow.isDestroyed() && appState.mainWindow.isVisible()) {
    appState.mainWindow.hide()
  }
}
