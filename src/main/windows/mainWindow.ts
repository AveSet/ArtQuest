import { app, BrowserWindow, Menu, screen } from 'electron'
import fs from 'fs'
import path from 'path'
import { appState } from '../app/appState'
import { applyAppDocumentCsp } from '../windowSecurity'
import { createRendererWebPreferences } from './rendererWebPreferences'
import { loadWindowIcon, resolvePreloadPath } from './iconAssets'
import { attachMainWindowBoundsReporting, reportWindowBoundsToRenderer } from './windowBoundsState'
import { showOverlayWindow } from './overlayWindow'
import { buildTray } from '../tray/trayManager'
import { clampWindowPoint, isFiniteMainRect } from '../ipc/windowBoundsHandlers'
import { persistWindowBoundsInProgress } from '../progress/persistWindowBounds'

/** Fit dashboard sidebar without clipping; stay within work area. */
export function getDefaultWindowSize(): { width: number; height: number } {
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

export function showMainWindow(): void {
  if (appState.mainWindow && !appState.mainWindow.isDestroyed()) {
    appState.mainWindow.show()
    appState.mainWindow.focus()
    return
  }
  createWindow()
}

export function createWindow(): void {
  Menu.setApplicationMenu(null)
  const { width: winW, height: winH } = getDefaultWindowSize()
  const savedMain = appState.persistedWindowBounds.main
  const initialWidth = isFiniteMainRect(savedMain) ? savedMain.width : winW
  const initialHeight = isFiniteMainRect(savedMain) ? savedMain.height : winH
  const mainPosition = isFiniteMainRect(savedMain)
    ? clampWindowPoint({ x: savedMain.x, y: savedMain.y }, initialWidth, initialHeight)
    : null

  appState.mainWindow = new BrowserWindow({
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
    webPreferences: createRendererWebPreferences({ preloadPath: resolvePreloadPath() }),
  })
  try {
    const ic = loadWindowIcon()
    if (!ic.isEmpty()) {
      appState.mainWindow.setIcon(ic)
    }
  } catch {
    //
  }

  applyAppDocumentCsp(appState.mainWindow.webContents.session)

  const loadBuiltRenderer = app.isPackaged || process.env.ARTQUEST_ELECTRON_E2E === '1'

  if (!loadBuiltRenderer) {
    appState.mainWindow.loadURL('http://localhost:5173')
    appState.mainWindow.webContents.openDevTools()
  } else {
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'renderer', 'index.html'),
      path.join(__dirname, '..', 'renderer', 'index.html'),
      path.join(process.resourcesPath, 'app/out/renderer/index.html'),
      path.join(__dirname, 'resources/app/out/renderer/index.html'),
    ]

    let loaded = false
    for (const p of possiblePaths) {
      if (p && fs.existsSync(p)) {
        appState.mainWindow.loadFile(p)
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

  appState.mainWindow.on('minimize', () => {
    if (appState.sessionMinimizeToOverlay) {
      showOverlayWindow(true)
    }
  })

  attachMainWindowBoundsReporting(appState.mainWindow)

  appState.mainWindow.on('close', (event) => {
    if (!appState.mainWindow || appState.mainWindow.isDestroyed()) return
    const b = appState.mainWindow.getBounds()
    reportWindowBoundsToRenderer({
      main: { x: b.x, y: b.y, width: b.width, height: b.height },
    })
    if (appState.isQuitting) {
      try {
        persistWindowBoundsInProgress()
      } catch (err) {
        console.warn('[mainWindow] Failed to persist window bounds on close:', err)
      }
    }
    if (!appState.isQuitting && appState.minimizeToTraySetting) {
      event.preventDefault()
      appState.mainWindow.hide()
      setImmediate(buildTray)
      return
    }
    void import('../app/shutdown').then(({ shutdownApplicationResources }) => shutdownApplicationResources())
  })

  appState.mainWindow.on('closed', () => {
    appState.mainWindow = null
  })
}
