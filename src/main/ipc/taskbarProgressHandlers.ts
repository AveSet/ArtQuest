import { ipcMain, type BrowserWindow } from 'electron'

export type TaskbarProgressMode = 'normal' | 'paused' | 'error' | 'none' | 'indeterminate'

export type TaskbarProgressIpcDeps = {
  getMainWindow: () => BrowserWindow | null
}

const MODES = new Set<TaskbarProgressMode>(['normal', 'paused', 'error', 'none', 'indeterminate'])

function applyTaskbarProgress(
  win: BrowserWindow | null,
  progress: number,
  mode: TaskbarProgressMode,
): void {
  if (!win || win.isDestroyed()) return
  if (progress < 0 || mode === 'none') {
    win.setProgressBar(-1)
    return
  }
  if (mode === 'indeterminate') {
    win.setProgressBar(2, { mode: 'indeterminate' })
    return
  }
  const clamped = Math.min(1, Math.max(0, progress))
  win.setProgressBar(clamped, { mode })
}

export function registerTaskbarProgressIpcHandlers(deps: TaskbarProgressIpcDeps): void {
  ipcMain.handle(
    'artquest:v1:taskbar:set-progress',
    async (_, raw: unknown) => {
      if (!raw || typeof raw !== 'object') return { success: false, error: 'invalid payload' }
      const progress = (raw as { progress?: unknown }).progress
      const modeRaw = (raw as { mode?: unknown }).mode
      if (typeof progress !== 'number' || !Number.isFinite(progress)) {
        return { success: false, error: 'invalid progress' }
      }
      const mode: TaskbarProgressMode =
        typeof modeRaw === 'string' && MODES.has(modeRaw as TaskbarProgressMode)
          ? (modeRaw as TaskbarProgressMode)
          : 'normal'
      applyTaskbarProgress(deps.getMainWindow(), progress, mode)
      return { success: true }
    },
  )
}

export { applyTaskbarProgress }
