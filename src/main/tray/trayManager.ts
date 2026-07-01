import { app, Menu, Tray } from 'electron'
import { appState } from '../app/appState'
import { popupTrayContextMenu, destroyTrayMenuAnchor } from './trayMenuAnchor'
import { loadTrayNativeImage } from '../windows/iconAssets'
import { showMainWindow } from '../windows/mainWindow'

export function destroyTraySafely(): void {
  if (!appState.tray) return
  try {
    appState.tray.removeAllListeners()
    appState.tray.destroy()
  } catch {
    //
  }
  appState.tray = null
  destroyTrayMenuAnchor()
}

export function buildTray(): void {
  if (appState.tray) return

  try {
    const icon = loadTrayNativeImage()
    appState.tray = new Tray(icon)
    appState.tray.setToolTip('ArtQuest')

    appState.tray.on('double-click', () => showMainWindow())
    appState.tray.on('click', (event) => {
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
          appState.isQuitting = true
          app.quit()
        },
      },
    ])

    if (process.platform === 'linux') {
      appState.tray.setContextMenu(menu)
    } else {
      appState.tray.setContextMenu(null)
      appState.tray.on('right-click', (_event, bounds) => {
        popupTrayContextMenu(menu, bounds)
      })
    }
  } catch (e) {
    console.error('[tray] Failed to build tray:', e)
    appState.tray = null
  }
}
