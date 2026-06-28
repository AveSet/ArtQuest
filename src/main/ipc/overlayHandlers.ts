import { ipcMain, type BrowserWindow } from 'electron'

const MAX_OVERLAY_IPC_BYTES = 256 * 1024

export type OverlayLayoutOpts = {
  sessionType?: 'quest' | 'practice'
  refsOpen?: boolean
  contentHeight?: number
}

export type OverlayIpcDeps = {
  getMainWindow: () => BrowserWindow | null
  getOverlayWindow: () => BrowserWindow | null
  getCachedPayload: () => Record<string, unknown>
  setCachedPayload: (payload: Record<string, unknown>) => void
  patchCachedPayload: (patch: Record<string, unknown>) => void
  pushPayload: () => void
  applyLayout: (opts?: OverlayLayoutOpts) => void
  setSessionMinimizeToOverlay: (active: boolean) => void
  showOverlay: (hideMain: boolean) => void
  hideOverlay: () => void
  toggleOverlay: () => void
  expandFromOverlay: () => void
  cancelQuestSession: () => void
}

function overlayPayloadWithinLimit(payload: unknown): boolean {
  try {
    return JSON.stringify(payload).length <= MAX_OVERLAY_IPC_BYTES
  } catch {
    return false
  }
}

export function registerOverlayIpcHandlers(deps: OverlayIpcDeps): void {
  ipcMain.handle('artquest:v1:overlay:set-payload', async (_, payload: unknown) => {
    if (!overlayPayloadWithinLimit(payload)) {
      return { success: false, error: 'overlay payload too large' }
    }
    const next =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : { hasSession: false }
    deps.setCachedPayload(next)
    deps.pushPayload()
    const sessionType =
      next.hasSession === true &&
      (next.sessionType === 'practice' || next.sessionType === 'quest')
        ? (next.sessionType as 'quest' | 'practice')
        : undefined
    if (sessionType) {
      deps.applyLayout({ sessionType })
    }
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:set-patch', async (_, patch: unknown) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return { success: false, error: 'invalid overlay patch' }
    }
    if (!overlayPayloadWithinLimit(patch)) {
      return { success: false, error: 'overlay patch too large' }
    }
    deps.patchCachedPayload(patch as Record<string, unknown>)
    const overlayWindow = deps.getOverlayWindow()
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('artquest:v1:overlay:patch', patch)
    }
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:set-layout', async (_, raw: unknown) => {
    const opts =
      raw && typeof raw === 'object'
        ? {
            sessionType:
              (raw as { sessionType?: string }).sessionType === 'practice' ||
              (raw as { sessionType?: string }).sessionType === 'quest'
                ? ((raw as { sessionType: 'quest' | 'practice' }).sessionType)
                : undefined,
            refsOpen: (raw as { refsOpen?: boolean }).refsOpen === true,
            contentHeight:
              typeof (raw as { contentHeight?: number }).contentHeight === 'number'
                ? (raw as { contentHeight: number }).contentHeight
                : undefined,
          }
        : {}
    deps.applyLayout(opts)
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:set-session-active', async (_, active: unknown) => {
    deps.setSessionMinimizeToOverlay(active === true)
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:get-payload', async () => ({
    success: true,
    payload: deps.getCachedPayload(),
  }))

  ipcMain.handle('artquest:v1:overlay:ready', async () => {
    deps.pushPayload()
    const mainWindow = deps.getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('artquest:v1:overlay:request-sync')
    }
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:open', async (_, raw: unknown) => {
    const hideMain =
      !raw ||
      typeof raw !== 'object' ||
      raw === null ||
      (raw as { hideMain?: boolean }).hideMain !== false
    const mainWindow = deps.getMainWindow()
    const cached = deps.getCachedPayload()
    const cacheHasSession = cached.hasSession === true

    if (!cacheHasSession && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('artquest:v1:overlay:request-sync')
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 450)
        const check = setInterval(() => {
          if (deps.getCachedPayload().hasSession === true) {
            clearInterval(check)
            clearTimeout(timeout)
            resolve()
          }
        }, 16)
        setTimeout(() => clearInterval(check), 460)
      })
    }

    deps.pushPayload()
    deps.showOverlay(hideMain)
    deps.pushPayload()
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:hide', async () => {
    deps.hideOverlay()
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:toggle', async () => {
    deps.toggleOverlay()
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:expand', async () => {
    deps.expandFromOverlay()
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:cancel', async () => {
    deps.cancelQuestSession()
    return { success: true }
  })

  ipcMain.handle('artquest:v1:overlay:close', async () => {
    deps.expandFromOverlay()
    return { success: true }
  })
}
