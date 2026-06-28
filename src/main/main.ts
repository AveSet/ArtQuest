import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, Notification, session, screen, globalShortcut } from 'electron'
import path from 'path'
import fs from 'fs'
import {
  getStorageMode,
  requeuePendingGalleryUploads,
} from './localDb'
import { registerProgressIpcHandlers } from './progress/progressIpc'
import { usesCloudStorage } from '../shared/storageMode'
import {
  sampleActivity,
  refreshActivitySnapshot,
  setActivityTrackerConfig,
  setCustomArtAppExecutablePath,
  pauseActivityTracking,
} from './activityTracker'
import {
  getGoogleDriveStatus,
  processGoogleUploadQueue,
  setUploadQueueIdleHandler,
} from './googleDrive'
import { installIpcSenderGuards } from './ipcTrustedSender'
import { registerGalleryIpcHandlers } from './ipc/galleryHandlers'
import { registerSessionTickIpcHandlers } from './ipc/sessionTickHandlers'
import { registerTaskbarProgressIpcHandlers } from './ipc/taskbarProgressHandlers'
import { registerWindowBoundsIpcHandlers, type PersistedWindowBounds, clampWindowPoint, isFinitePoint, isFiniteRect, isFiniteMainRect, mergePersistedWindowBounds } from './ipc/windowBoundsHandlers'
import { registerOverlayIpcHandlers } from './ipc/overlayHandlers'
import { registerReferenceWindowIpcHandlers } from './ipc/referenceWindowHandlers'
import {
  applyOpenAtLogin,
  registerDesktopSettingsIpcHandlers,
  type ReminderCfg,
} from './ipc/desktopSettingsHandlers'
import { registerShellIpcHandlers } from './ipc/shellHandlers'
import { registerStorageCloudIpcHandlers } from './ipc/storageCloudHandlers'
import { registerQuestSessionCommandIpcHandlers } from './ipc/questSessionCommandHandlers'
import type { QuestSessionCommand } from './ipc/questSessionCommands'
import { applyAppDocumentCsp, hardenReferenceWebviewContents } from './windowSecurity'

installIpcSenderGuards()

if (process.env.ARTQUEST_E2E_USER_DATA) {
  app.setPath('userData', path.resolve(process.env.ARTQUEST_E2E_USER_DATA))
}

// Folder for quest file backups inside userData
function getQuestBackupDir(): string {
  return path.join(app.getPath('userData'), 'quest_attachments')
}

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let referenceWindow: BrowserWindow | null = null
let tray: Tray | null = null
/** Tiny always-on-top window so tray Menu.popup() renders above exclusive fullscreen (Windows/macOS). */
let trayMenuAnchor: BrowserWindow | null = null
let isQuitting = false
let quitFlushAcknowledged = false
let quitFlushTimeout: ReturnType<typeof setTimeout> | null = null
let minimizeToTraySetting = false
let sessionMinimizeToOverlay = false
let singleInstanceLockAcquired = false

let activityTimer: ReturnType<typeof setInterval> | null = null
let activityRefreshTimer: ReturnType<typeof setInterval> | null = null
let sessionTickTimer: ReturnType<typeof setInterval> | null = null

let reminderCfg: ReminderCfg = {
  enabled: false,
  hour: 18,
  minute: 0,
  title: 'ArtQuest',
  body: '',
}
let lastReminderDayKey = ''
let reminderTimer: ReturnType<typeof setInterval> | null = null

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
      // Older builds: electron-builder copied `resources/tray.png` → resources/resources/tray.png
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

/** Windows prefers ICO for taskbar / Alt+Tab; PNG is fallback (also used on Linux). */
function loadWindowIcon(): Electron.NativeImage {
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

/** Win/Linux tray host often expects a small raster; normalize to avoid invisible icons. */
function finalizeTraySizes(icon: Electron.NativeImage): Electron.NativeImage {
  if (!icon || icon.isEmpty()) return icon
  if (process.platform === 'darwin') return icon
  try {
    return icon.resize({ width: 32, height: 32 })
  } catch {
    return icon
  }
}

function loadTrayNativeImage(): Electron.NativeImage {
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

function destroyTraySafely(): void {
  if (!tray) return
  try {
    tray.removeAllListeners()
    tray.destroy()
  } catch {
    //
  }
  tray = null
  destroyTrayMenuAnchor()
}

function destroyTrayMenuAnchor(): void {
  if (!trayMenuAnchor) return
  try {
    trayMenuAnchor.destroy()
  } catch {
    //
  }
  trayMenuAnchor = null
}

/** Host Menu.popup above exclusive-fullscreen layers (game overlays). */
function getOrCreateTrayMenuAnchor(): BrowserWindow {
  if (trayMenuAnchor && !trayMenuAnchor.isDestroyed()) return trayMenuAnchor
  trayMenuAnchor = new BrowserWindow({
    width: 2,
    height: 2,
    x: -10_000,
    y: -10_000,
    show: false,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    fullscreenable: false,
    hasShadow: false,
    thickFrame: false,
    focusable: true,
    webPreferences: {
      sandbox: true,
    },
  })
  try {
    trayMenuAnchor.setAlwaysOnTop(true, 'screen-saver')
  } catch {
    try {
      trayMenuAnchor.setAlwaysOnTop(true, 'pop-up-menu')
    } catch {
      trayMenuAnchor.setAlwaysOnTop(true)
    }
  }
  return trayMenuAnchor
}

function popupTrayContextMenu(menu: InstanceType<typeof Menu>, bounds: Electron.Rectangle): void {
  const anchor = getOrCreateTrayMenuAnchor()
  const x = Math.round(bounds.x)
  const y = Math.round(bounds.y)
  const w = Math.max(2, Math.round(bounds.width || 2))
  const h = Math.max(2, Math.round(bounds.height || 2))
  anchor.setBounds({ x, y, width: w, height: h })
  anchor.showInactive()
  menu.popup({
    window: anchor,
    x: 0,
    y: 0,
    callback: () => {
      try {
        if (trayMenuAnchor && !trayMenuAnchor.isDestroyed()) {
          trayMenuAnchor.hide()
        }
      } catch {
        //
      }
    },
  })
}

function applyNonElectronUserAgent(): void {
  try {
    const s = session.defaultSession
    const raw = s.getUserAgent()
    const cleaned = raw.replace(/\sElectron\/[\d.]+\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
    s.setUserAgent(cleaned.length > 0 ? cleaned : raw)
  } catch (e) {
    console.warn('[session] User-Agent adjust failed:', e)
  }
}

/**
 * YouTube embed shows "Error 153" when requests have no Referer (e.g. parent is `file://`).
 * Required minimum functionality: https://developers.google.com/youtube/terms/required-minimum-functionality
 * We only set Referer when the browser would send none.
 */
function applyYoutubeReferrerForEmbeds(): void {
  const ytReferrer = 'https://www.youtube.com/'
  const filter = {
    urls: [
      '*://*.youtube.com/*',
      '*://youtube.com/*',
      '*://*.youtube-nocookie.com/*',
      '*://youtube-nocookie.com/*',
      '*://*.googlevideo.com/*',
      '*://*.ytimg.com/*',
    ],
  }
  try {
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      const requestHeaders = { ...(details.requestHeaders ?? {}) }
      const existing = String(requestHeaders.Referer ?? requestHeaders.referer ?? '')
      if (!existing || existing.startsWith('file:') || !existing.startsWith('http')) {
        requestHeaders.Referer = ytReferrer
      }
      callback({ requestHeaders })
    })
  } catch (e) {
    console.warn('[session] YouTube Referer hook failed:', e)
  }
}

function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
    return
  }
  createWindow()
}

function hideOverlayForSessionExpand(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.hide()
}

function hideSessionOverlayWindow(): void {
  hideOverlayForSessionExpand()
}

function expandSessionFromOverlay(): void {
  sendQuestSessionCommand('showMainWindow')
}

function sendQuestSessionCommand(command: QuestSessionCommand): void {
  if (command === 'toggleOverlay') {
    toggleOverlayWindow()
    return
  }
  if (command === 'showMainWindow' || command === 'openQuestFinish') {
    hideOverlayForSessionExpand()
    showMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('artquest:v1:quest-session:command', command)
    }
    return
  }
  if (
    command === 'cancelQuestSession' ||
    command === 'cancelPractice' ||
    command === 'finishPractice'
  ) {
    hideOverlayForSessionExpand()
    showMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('artquest:v1:quest-session:command', command)
    }
    return
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('artquest:v1:quest-session:command', command)
  }
}

function loadRendererRoute(win: BrowserWindow, route: string): void {
  const hash = route.startsWith('/') ? route : `/${route}`
  if (!app.isPackaged) {
    win.loadURL(`http://localhost:5173/#${hash}`)
    return
  }

  const possiblePaths = [
    path.join(__dirname, '../renderer/index.html'),
    path.join(__dirname, '../../renderer/index.html'),
    path.join(process.resourcesPath, 'app/out/renderer/index.html'),
    path.join(__dirname, 'resources/app/out/renderer/index.html'),
  ]
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      win.loadFile(p, { hash })
      return
    }
  }
}

const OVERLAY_WIDTH = 258
/** Distance from the right edge of the work area (widget sits slightly left of default). */
const OVERLAY_RIGHT_INSET = 72
const OVERLAY_MIN_HEIGHT = 168
const OVERLAY_MAX_HEIGHT = 440
/** Fallback heights when overlay has not measured content yet. */
const OVERLAY_QUEST_HEIGHT = 204
const OVERLAY_QUEST_HEIGHT_REFS = 328
const OVERLAY_PRACTICE_HEIGHT = 184
const OVERLAY_PRACTICE_HEIGHT_REFS = 268

type OverlayLayoutOpts = {
  sessionType?: 'quest' | 'practice'
  refsOpen?: boolean
  contentHeight?: number
}

/** Last layout from overlay UI — survives frequent payload IPC (timer ticks). */
const overlayLayoutState: OverlayLayoutOpts = { refsOpen: false }

let persistedWindowBounds: PersistedWindowBounds = {}
/** Skip bounds IPC to renderer while applying saved bounds programmatically. */
let suppressWindowBoundsReport = false

function reportWindowBoundsToRenderer(partial: PersistedWindowBounds): void {
  if (suppressWindowBoundsReport) return
  persistedWindowBounds = mergePersistedWindowBounds(persistedWindowBounds, partial)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('artquest:v1:window-bounds:report', partial)
  }
}

function applyPersistedWindowBounds(bounds: PersistedWindowBounds): void {
  suppressWindowBoundsReport = true
  try {
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
    suppressWindowBoundsReport = false
  }
}

let cachedOverlayPayload: Record<string, unknown> = { hasSession: false }

function pushOverlayPayloadToWindow(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  const contents = overlayWindow.webContents
  if (contents.isLoading()) {
    contents.once('did-finish-load', () => pushOverlayPayloadToWindow())
    return
  }
  contents.send('artquest:v1:overlay:update', cachedOverlayPayload)
}

function applyOverlayWindowLayout(partial: OverlayLayoutOpts = {}): void {
  if (partial.sessionType === 'quest' || partial.sessionType === 'practice') {
    overlayLayoutState.sessionType = partial.sessionType
  }
  if (partial.refsOpen !== undefined) {
    overlayLayoutState.refsOpen = partial.refsOpen === true
  }
  if (typeof partial.contentHeight === 'number' && partial.contentHeight > 0) {
    overlayLayoutState.contentHeight = Math.ceil(partial.contentHeight)
  }

  if (!overlayWindow || overlayWindow.isDestroyed()) return
  const refsOpen = overlayLayoutState.refsOpen === true
  const isPractice = overlayLayoutState.sessionType === 'practice'
  const width = OVERLAY_WIDTH
  const fallback = refsOpen
    ? isPractice
      ? OVERLAY_PRACTICE_HEIGHT_REFS
      : OVERLAY_QUEST_HEIGHT_REFS
    : isPractice
      ? OVERLAY_PRACTICE_HEIGHT
      : OVERLAY_QUEST_HEIGHT
  const measured = overlayLayoutState.contentHeight
  const height = Math.min(
    OVERLAY_MAX_HEIGHT,
    Math.max(OVERLAY_MIN_HEIGHT, measured && measured > 0 ? measured : fallback),
  )
  overlayWindow.setMinimumSize(width, height)
  overlayWindow.setMaximumSize(width, height)
  const bounds = overlayWindow.getBounds()
  if (bounds.height === height && bounds.width === width) return
  overlayWindow.setBounds({ ...bounds, width, height })
}

function defaultOverlayPosition(width: number): { x: number; y: number } {
  const display = screen.getPrimaryDisplay().workArea
  return {
    x: Math.max(display.x + 16, display.x + display.width - width - OVERLAY_RIGHT_INSET),
    y: display.y + 32,
  }
}

function createOverlayWindow(): BrowserWindow {
  if (overlayWindow && !overlayWindow.isDestroyed()) return overlayWindow
  const saved = persistedWindowBounds.overlay
  const fallback = defaultOverlayPosition(OVERLAY_WIDTH)
  const overlayX = typeof saved?.x === 'number' ? saved.x : fallback.x
  const overlayY = typeof saved?.y === 'number' ? saved.y : fallback.y
  overlayWindow = new BrowserWindow({
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
    webPreferences: {
      preload: resolvePreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
  })
  applyAppDocumentCsp(overlayWindow.webContents.session)
  overlayWindow.setAlwaysOnTop(true, 'floating')
  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
  overlayWindow.on('moved', () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return
    const { x, y } = overlayWindow.getBounds()
    reportWindowBoundsToRenderer({ overlay: { x, y } })
  })
  overlayWindow.webContents.on('did-finish-load', () => {
    pushOverlayPayloadToWindow()
  })
  overlayWindow.once('ready-to-show', () => overlayWindow?.show())
  loadRendererRoute(overlayWindow, '/overlay')
  return overlayWindow
}

function showOverlayWindow(hideMain = false): void {
  const win = createOverlayWindow()
  overlayLayoutState.refsOpen = false
  applyOverlayWindowLayout({ refsOpen: false })
  win.show()
  win.focus()
  if (hideMain && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
}

function broadcastActivitySnapshot(snapshot = sampleActivity()): void {
  const payload = {
    processName: snapshot.processName,
    idleSec: snapshot.idleSec,
    artAppActive: snapshot.artAppActive,
    userActive: snapshot.userActive,
    shouldCountTime: snapshot.shouldCountTime,
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('artquest:v1:activity:update', payload)
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('artquest:v1:activity:update', payload)
  }
}

function pulseSessionTick(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('artquest:v1:session:tick')
  }
}

function stopSessionTickTimer(): void {
  if (sessionTickTimer) {
    clearInterval(sessionTickTimer)
    sessionTickTimer = null
  }
}

function startSessionTickTimer(): void {
  if (sessionTickTimer) return
  sessionTickTimer = setInterval(pulseSessionTick, 1000)
  pulseSessionTick()
}

function startActivityTimer(): void {
  if (activityTimer) return
  const broadcastCached = () => {
    broadcastActivitySnapshot(sampleActivity())
  }
  activityTimer = setInterval(broadcastCached, 1000)
  broadcastCached()

  const refreshPoll = () => {
    void refreshActivitySnapshot()
      .then(broadcastActivitySnapshot)
      .catch(() => broadcastActivitySnapshot())
  }
  activityRefreshTimer = setInterval(refreshPoll, 3000)
  void refreshActivitySnapshot()
    .then(broadcastActivitySnapshot)
    .catch(() => broadcastActivitySnapshot())
}

function stopActivityPolling(): void {
  if (activityTimer) {
    clearInterval(activityTimer)
    activityTimer = null
  }
  if (activityRefreshTimer) {
    clearInterval(activityRefreshTimer)
    activityRefreshTimer = null
  }
}

function toggleOverlayWindow(): void {
  const win = createOverlayWindow()
  if (win.isVisible()) {
    expandSessionFromOverlay()
    return
  }
  win.show()
  win.focus()
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
    mainWindow.hide()
  }
}

type ReferenceWindowOpenParams = {
  mode?: string
  questId?: number
  nodeId?: string
  category?: string
  tags?: string[]
  lang?: string
  source?: string
}

function buildReferenceMaterialsRoute(params: ReferenceWindowOpenParams): string {
  const p = new URLSearchParams()
  if (params.mode) p.set('mode', params.mode)
  if (params.questId != null) p.set('questId', String(params.questId))
  if (params.nodeId) p.set('node', params.nodeId)
  if (params.category) p.set('category', params.category)
  if (params.tags?.length) p.set('tags', params.tags.join(','))
  if (params.lang) p.set('lang', params.lang)
  if (params.source) p.set('source', params.source)
  const qs = p.toString()
  return `/reference-materials${qs ? `?${qs}` : ''}`
}

function getReferenceWindowSize(): { width: number; height: number } {
  const { width: workW, height: workH } = screen.getPrimaryDisplay().workAreaSize
  return {
    width: Math.min(Math.max(640, Math.round(workW * 0.82)), workW - 24),
    height: Math.min(Math.max(480, Math.round(workH * 0.85)), workH - 24),
  }
}

function createReferenceWindow(params: ReferenceWindowOpenParams): BrowserWindow {
  const refSize = getReferenceWindowSize()
  const saved = persistedWindowBounds.reference
  if (referenceWindow && !referenceWindow.isDestroyed()) {
    loadRendererRoute(referenceWindow, buildReferenceMaterialsRoute(params))
    referenceWindow.show()
    referenceWindow.focus()
    return referenceWindow
  }

  const initialBounds = isFiniteRect(saved)
    ? saved
    : { ...refSize, x: 0, y: 0 }
  const positioned = isFiniteRect(saved)
    ? clampWindowPoint({ x: saved.x, y: saved.y }, saved.width, saved.height)
    : null

  referenceWindow = new BrowserWindow({
    width: initialBounds.width,
    height: initialBounds.height,
    x: positioned?.x,
    y: positioned?.y,
    center: !positioned,
    minWidth: 640,
    minHeight: 480,
    show: false,
    title: 'ArtQuest — Materials',
    webPreferences: {
      preload: resolvePreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
    },
  })
  applyAppDocumentCsp(referenceWindow.webContents.session)
  hardenReferenceWebviewContents(referenceWindow.webContents)
  const reportReferenceBounds = () => {
    if (!referenceWindow || referenceWindow.isDestroyed()) return
    const b = referenceWindow.getBounds()
    reportWindowBoundsToRenderer({
      reference: { x: b.x, y: b.y, width: b.width, height: b.height },
    })
  }
  referenceWindow.on('close', reportReferenceBounds)
  referenceWindow.on('closed', () => {
    referenceWindow = null
  })
  referenceWindow.on('moved', reportReferenceBounds)
  referenceWindow.on('resized', reportReferenceBounds)
  referenceWindow.once('ready-to-show', () => referenceWindow?.show())
  loadRendererRoute(referenceWindow, buildReferenceMaterialsRoute(params))
  return referenceWindow
}

function openUrlInReferenceWebview(url: string): void {
  if (!referenceWindow || referenceWindow.isDestroyed()) return
  referenceWindow.webContents.send('artquest:v1:reference-window:navigate', url)
}

let registeredQuestAccelerators: string[] = []
let pendingQuestShortcutBindings: Array<[string, QuestSessionCommand]> | null = null

function unregisterQuestGlobalShortcuts(): void {
  const previous = registeredQuestAccelerators
  registeredQuestAccelerators = []
  if (!app.isReady()) return
  for (const accelerator of previous) {
    try {
      globalShortcut.unregister(accelerator)
    } catch {
      /* ignore */
    }
  }
}

function registerQuestGlobalShortcuts(bindings: Array<[string, QuestSessionCommand]>): void {
  if (!app.isReady()) {
    pendingQuestShortcutBindings = bindings
    return
  }
  unregisterQuestGlobalShortcuts()
  const next: string[] = []
  for (const [accelerator, command] of bindings) {
    if (!accelerator || typeof accelerator !== 'string') continue
    try {
      const ok = globalShortcut.register(accelerator, () => sendQuestSessionCommand(command))
      if (!ok) {
        console.warn('[shortcuts] Could not register', accelerator)
        continue
      }
      next.push(accelerator)
    } catch (e) {
      console.warn('[shortcuts] Failed to register', accelerator, e)
    }
  }
  registeredQuestAccelerators = next
}

function applyInitialQuestGlobalShortcuts(): void {
  const bindings = pendingQuestShortcutBindings ?? DEFAULT_QUEST_SHORTCUT_BINDINGS
  pendingQuestShortcutBindings = null
  registerQuestGlobalShortcuts(bindings)
}

const DEFAULT_QUEST_SHORTCUT_BINDINGS: Array<[string, QuestSessionCommand]> = [
  ['CommandOrControl+Alt+Right', 'advancePhase'],
  ['CommandOrControl+Alt+O', 'toggleOverlay'],
  ['CommandOrControl+Alt+R', 'openReferences'],
  ['CommandOrControl+Alt+M', 'showMainWindow'],
]

function buildTray(): void {
  if (tray) return

  try {
    const icon = loadTrayNativeImage()
    tray = new Tray(icon)
    tray.setToolTip('ArtQuest')

    tray.on('double-click', () => showMainWindow())
    /** Win/Linux: primary tray click shows window; ignore right button so it doesn't open the app behind the menu. */
    tray.on('click', (event) => {
      if (process.platform === 'darwin') return
      const btn = (event as unknown as { button?: number }).button
      if (btn === 2) return
      showMainWindow()
    })

    const menu = Menu.buildFromTemplate([
      {
        label: 'Show ArtQuest',
        click: () => showMainWindow(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true
          shutdownApplicationResources()
          app.quit()
        },
      },
    ])

    if (process.platform === 'linux') {
      tray.setContextMenu(menu)
    } else {
      tray.setContextMenu(null)
      tray.on('right-click', (_event, bounds) => {
        popupTrayContextMenu(menu, bounds)
      })
    }
  } catch (e) {
    console.error('[tray] Failed to build tray:', e)
    tray = null
  }
}

function tickReminder(): void {
  if (!reminderCfg.enabled || !Notification.isSupported()) return
  const now = new Date()
  if (now.getHours() !== reminderCfg.hour || now.getMinutes() !== reminderCfg.minute) return
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (lastReminderDayKey === key) return
  lastReminderDayKey = key

  try {
    const notification = new Notification({
      title: reminderCfg.title || 'ArtQuest',
      body: reminderCfg.body || '',
    })
    notification.show()
  } catch (e) {
    console.warn('Reminder notification failed:', e)
  }
}

function startReminderTimer(): void {
  if (reminderTimer) return
  reminderTimer = setInterval(tickReminder, 15000)
}

function stopBackgroundTimers(): void {
  stopActivityPolling()
  stopSessionTickTimer()
  if (reminderTimer) {
    clearInterval(reminderTimer)
    reminderTimer = null
  }
  pauseActivityTracking()
}

function destroyAuxiliaryWindows(): void {
  sessionMinimizeToOverlay = false
  for (const win of [overlayWindow, referenceWindow, trayMenuAnchor]) {
    if (!win || win.isDestroyed()) continue
    try {
      win.destroy()
    } catch {
      /* ignore */
    }
  }
  overlayWindow = null
  referenceWindow = null
  trayMenuAnchor = null
}

function shutdownApplicationResources(): void {
  stopBackgroundTimers()
  destroyAuxiliaryWindows()
  destroyTraySafely()
  if (app.isReady()) {
    try {
      unregisterQuestGlobalShortcuts()
    } catch {
      /* ignore */
    }
  }
}

function resolvePreloadPath(): string {
  const candidates = [
    path.join(__dirname, '..', 'preload', 'preload.js'),
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, '..', 'preload', 'preload.mjs'),
    path.join(__dirname, 'preload.mjs'),
  ]
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }
  return candidates[0] || ''
}

/** Fit dashboard sidebar (stars + skill rows) without clipping; stay within work area. */
function getDefaultWindowSize(): { width: number; height: number } {
  const { width: workW, height: workH } = screen.getPrimaryDisplay().workAreaSize
  const marginX = 32
  const marginY = 12
  const desiredWidth = Math.round(workW * 0.9)
  const desiredHeight = Math.round(workH * 0.92)
  return {
    width: Math.min(desiredWidth, Math.max(800, workW - marginX)),
    height: Math.min(desiredHeight, Math.max(720, workH - marginY)),
  }
}

function createWindow() {
  Menu.setApplicationMenu(null)
  const { width: winW, height: winH } = getDefaultWindowSize()
  const savedMain = persistedWindowBounds.main
  const initialWidth = isFiniteMainRect(savedMain) ? savedMain.width : winW
  const initialHeight = isFiniteMainRect(savedMain) ? savedMain.height : winH
  const mainPosition = isFiniteMainRect(savedMain)
    ? clampWindowPoint({ x: savedMain.x, y: savedMain.y }, initialWidth, initialHeight)
    : null

  mainWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    x: mainPosition?.x,
    y: mainPosition?.y,
    minWidth: 800,
    minHeight: 720,
    icon: loadWindowIcon(),
    show: true,
    center: !mainPosition,
    backgroundColor: '#0b0f19',
    webPreferences: {
      preload: resolvePreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  })
  try {
    const ic = loadWindowIcon()
    if (!ic.isEmpty()) {
      mainWindow.setIcon(ic)
    }
  } catch {
    //
  }

  applyAppDocumentCsp(mainWindow.webContents.session)

  const loadBuiltRenderer = app.isPackaged || process.env.ARTQUEST_ELECTRON_E2E === '1'

  if (!loadBuiltRenderer) {
    // Development mode
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // Production / Electron smoke mode - load renderer from out/renderer
    const possiblePaths = [
      path.join(__dirname, '../renderer/index.html'),
      path.join(__dirname, '../../renderer/index.html'),
      path.join(process.resourcesPath, 'app/out/renderer/index.html'),
      path.join(__dirname, 'resources/app/out/renderer/index.html'),
    ]

    let loaded = false
    for (const p of possiblePaths) {
      if (p && fs.existsSync(p)) {
        mainWindow.loadFile(p)
        loaded = true
        break
      }
    }

    if (!loaded) {
      console.error('No index.html found! Tried paths:', possiblePaths)
      try {
        const dirPath = path.dirname(possiblePaths[0] ?? '')
        console.warn('Contents of', dirPath, ':', fs.readdirSync(dirPath!))
      } catch (e) {
        console.error('Cannot read directory:', e)
      }
    }
  }

  mainWindow.on('minimize', () => {
    if (sessionMinimizeToOverlay) {
      showOverlayWindow(true)
    }
  })

  const reportMainBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const b = mainWindow.getBounds()
    reportWindowBoundsToRenderer({
      main: { x: b.x, y: b.y, width: b.width, height: b.height },
    })
  }
  mainWindow.on('moved', reportMainBounds)
  mainWindow.on('resized', reportMainBounds)

  mainWindow.on('close', (event) => {
    reportMainBounds()
    if (!isQuitting && minimizeToTraySetting) {
      event.preventDefault()
      mainWindow?.hide()
      setImmediate(buildTray)
      return
    }
    // Overlay / reference windows keep the process alive after the main window closes.
    shutdownApplicationResources()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function completeQuitAfterFlush(): void {
  quitFlushAcknowledged = true
  if (quitFlushTimeout) {
    clearTimeout(quitFlushTimeout)
    quitFlushTimeout = null
  }
  shutdownApplicationResources()
  app.quit()
}

function flushProgressBeforeQuit(): void {
  quitFlushAcknowledged = false
  try {
    if (!mainWindow || mainWindow.isDestroyed()) {
      completeQuitAfterFlush()
      return
    }
    mainWindow.webContents.send('app-before-quit')
    if (quitFlushTimeout) clearTimeout(quitFlushTimeout)
    quitFlushTimeout = setTimeout(() => {
      console.warn('[quit] progress flush timed out — quitting anyway')
      completeQuitAfterFlush()
    }, 10_000)
  } catch (e) {
    console.warn('[quit] Failed to notify renderer before quit:', e)
    completeQuitAfterFlush()
  }
}

ipcMain.on('app-before-quit-done', () => {
  if (!isQuitting || quitFlushAcknowledged) return
  completeQuitAfterFlush()
})

function notifyGallerySyncUpdated(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('artquest:v1:gallery:syncUpdated')
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.artquest.app')
  }

  createWindow()

  setImmediate(() => {
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      const p = permission as string
      if (p === 'fullscreen' || p === 'media' || p === 'encrypted-media') {
        callback(true)
        return
      }
      callback(false)
    })

    applyYoutubeReferrerForEmbeds()
    applyNonElectronUserAgent()
    applyInitialQuestGlobalShortcuts()
    startActivityTimer()
    startReminderTimer()
    setUploadQueueIdleHandler(notifyGallerySyncUpdated)
    if (getGoogleDriveStatus().connected && usesCloudStorage(getStorageMode())) {
      requeuePendingGalleryUploads()
      void processGoogleUploadQueue()
    }
  })

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow()
    }
  })
})

app.on('will-quit', () => {
  shutdownApplicationResources()
})

singleInstanceLockAcquired = app.requestSingleInstanceLock()
if (!singleInstanceLockAcquired) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showMainWindow()
  })
}

app.on('before-quit', (event) => {
  if (quitFlushAcknowledged) return
  event.preventDefault()
  isQuitting = true
  flushProgressBeforeQuit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Progress file path
const getProgressPath = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'progress.json')
}

const getProgressBackupPath = () => getProgressPath() + '.bak'

// Validate base64 image or video data — moved to ipc/galleryHandlers.ts

// Validate quest ID to prevent path traversal — moved to ipc/galleryHandlers.ts

const DEBUG_LOG_PATH = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'progress_debug.log')
}

const MAX_DEBUG_LOG_BYTES = 512 * 1024
const DEBUG_LOG_KEEP_LINES = 500

function appendDebugLog(msg: string) {
  try {
    const p = DEBUG_LOG_PATH()
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p)
      if (stat.size > MAX_DEBUG_LOG_BYTES) {
        const content = fs.readFileSync(p, 'utf-8')
        const lines = content.split('\n').filter(Boolean)
        const trimmed = lines.slice(-DEBUG_LOG_KEEP_LINES).join('\n')
        fs.writeFileSync(p, trimmed.length > 0 ? trimmed + '\n' : '', 'utf-8')
      }
    }
    const timestamp = new Date().toISOString()
    fs.appendFileSync(p, `[${timestamp}] ${msg}\n`)
  } catch {}
}

registerProgressIpcHandlers({
  getProgressPath,
  getProgressBackupPath,
  getQuestBackupDir,
  getDebugLogPath: DEBUG_LOG_PATH,
  appendDebugLog,
})

registerGalleryIpcHandlers({ getMainWindow: () => mainWindow })

registerSessionTickIpcHandlers({
  startSessionTickTimer,
  stopSessionTickTimer,
})

registerTaskbarProgressIpcHandlers({
  getMainWindow: () => mainWindow,
})

registerWindowBoundsIpcHandlers({
  getMainWindow: () => mainWindow,
  getPersistedBounds: () => persistedWindowBounds,
  setPersistedBounds: (partial) => {
    persistedWindowBounds = mergePersistedWindowBounds(persistedWindowBounds, partial)
  },
  applyPersistedBounds: applyPersistedWindowBounds,
})

registerOverlayIpcHandlers({
  getMainWindow: () => mainWindow,
  getOverlayWindow: () => overlayWindow,
  getCachedPayload: () => cachedOverlayPayload,
  setCachedPayload: (payload) => {
    cachedOverlayPayload = payload
  },
  patchCachedPayload: (patch) => {
    cachedOverlayPayload = { ...cachedOverlayPayload, ...patch }
  },
  pushPayload: pushOverlayPayloadToWindow,
  applyLayout: applyOverlayWindowLayout,
  setSessionMinimizeToOverlay: (active) => {
    sessionMinimizeToOverlay = active
  },
  showOverlay: showOverlayWindow,
  hideOverlay: hideSessionOverlayWindow,
  toggleOverlay: toggleOverlayWindow,
  expandFromOverlay: expandSessionFromOverlay,
  cancelQuestSession: () => sendQuestSessionCommand('cancelQuestSession'),
})

registerReferenceWindowIpcHandlers({
  openReferenceWindow: (params) => {
    createReferenceWindow(params)
  },
  navigateReferenceWindow: openUrlInReferenceWebview,
})

registerDesktopSettingsIpcHandlers({
  getReminderCfg: () => reminderCfg,
  setMinimizeToTray: (value) => {
    minimizeToTraySetting = value
  },
  setReminderCfg: (cfg) => {
    reminderCfg = cfg
  },
  setOpenAtLogin: applyOpenAtLogin,
  setActivityTrackingEnabled: (enabled) => {
    setActivityTrackerConfig({ enabled })
    if (enabled) {
      startActivityTimer()
    } else {
      stopActivityPolling()
    }
  },
  setTrackedArtApps: (apps) => {
    setActivityTrackerConfig({ trackedArtApps: apps })
  },
  setCustomArtAppExecutablePath: (exePath) => {
    setCustomArtAppExecutablePath(exePath)
  },
  setArtIdleTimeoutSec: (sec) => {
    setActivityTrackerConfig({ idleTimeoutSec: sec })
  },
  registerQuestGlobalShortcuts,
  defaultQuestShortcutBindings: DEFAULT_QUEST_SHORTCUT_BINDINGS,
})

registerQuestSessionCommandIpcHandlers({ sendCommand: sendQuestSessionCommand })
registerShellIpcHandlers()
registerStorageCloudIpcHandlers()

