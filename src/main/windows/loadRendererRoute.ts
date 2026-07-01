import { app, type BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'

export function loadRendererRoute(win: BrowserWindow, route: string): void {
  const hash = route.startsWith('/') ? route : `/${route}`
  if (!app.isPackaged && process.env.ARTQUEST_ELECTRON_E2E !== '1') {
    win.loadURL(`http://localhost:5173/#${hash}`)
    return
  }

  const possiblePaths = [
    path.join(__dirname, '..', '..', 'renderer', 'index.html'),
    path.join(__dirname, '..', 'renderer', 'index.html'),
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
