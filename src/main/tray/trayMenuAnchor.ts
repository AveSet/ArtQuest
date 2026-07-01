import { BrowserWindow } from 'electron'
import { appState } from '../app/appState'

export function destroyTrayMenuAnchor(): void {
  if (!appState.trayMenuAnchor) return
  try {
    appState.trayMenuAnchor.destroy()
  } catch {
    //
  }
  appState.trayMenuAnchor = null
}

/** Host Menu.popup above exclusive-fullscreen layers (game overlays). */
export function getOrCreateTrayMenuAnchor(): BrowserWindow {
  if (appState.trayMenuAnchor && !appState.trayMenuAnchor.isDestroyed()) return appState.trayMenuAnchor
  appState.trayMenuAnchor = new BrowserWindow({
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
    appState.trayMenuAnchor.setAlwaysOnTop(true, 'screen-saver')
  } catch {
    try {
      appState.trayMenuAnchor.setAlwaysOnTop(true, 'pop-up-menu')
    } catch {
      appState.trayMenuAnchor.setAlwaysOnTop(true)
    }
  }
  return appState.trayMenuAnchor
}

export function popupTrayContextMenu(menu: Electron.Menu, bounds: Electron.Rectangle): void {
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
        if (appState.trayMenuAnchor && !appState.trayMenuAnchor.isDestroyed()) {
          appState.trayMenuAnchor.hide()
        }
      } catch {
        //
      }
    },
  })
}
