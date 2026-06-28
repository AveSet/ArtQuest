import { ipcMain } from 'electron'
import { validateReferenceNavigationUrl } from '../../shared/referenceUrlPolicy'

export type ReferenceWindowOpenParams = {
  mode?: string
  questId?: number
  nodeId?: string
  category?: string
  tags?: string[]
  lang?: string
  source?: string
}

export type ReferenceWindowIpcDeps = {
  openReferenceWindow: (params: ReferenceWindowOpenParams) => void
  navigateReferenceWindow: (url: string) => void
}

export function registerReferenceWindowIpcHandlers(deps: ReferenceWindowIpcDeps): void {
  ipcMain.handle('artquest:v1:reference-window:open', async (_, raw: unknown) => {
    try {
      const params = (raw && typeof raw === 'object' ? raw : {}) as ReferenceWindowOpenParams
      deps.openReferenceWindow(params)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('artquest:v1:reference-window:navigate', async (_, rawUrl: unknown) => {
    try {
      if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
        return { success: false, error: 'invalid url' }
      }
      const checked = validateReferenceNavigationUrl(rawUrl)
      if (!checked.ok) return { success: false, error: checked.reason }
      deps.navigateReferenceWindow(checked.url)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}
