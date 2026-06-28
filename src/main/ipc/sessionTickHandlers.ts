import { ipcMain } from 'electron'

export type SessionTickIpcDeps = {
  startSessionTickTimer: () => void
  stopSessionTickTimer: () => void
}

export function registerSessionTickIpcHandlers(deps: SessionTickIpcDeps): void {
  ipcMain.handle('artquest:v1:session:set-tick-active', async (_, active: unknown) => {
    if (active === true) {
      deps.startSessionTickTimer()
    } else {
      deps.stopSessionTickTimer()
    }
    return { success: true }
  })
}
