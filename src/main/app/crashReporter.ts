import { app, ipcMain } from 'electron'
import { appendEvent } from '../localDb/dbCore'

let installed = false

export function installCrashReporter(): void {
  if (installed) return
  installed = true

  process.on('uncaughtException', (error) => {
    appendEvent('crash', {
      scope: 'main',
      message: error.message,
      stack: error.stack,
    })
    console.error('[crash] uncaughtException:', error)
  })

  process.on('unhandledRejection', (reason) => {
    appendEvent('crash', {
      scope: 'main',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    })
  })

  app.on('render-process-gone', (_event, _webContents, details) => {
    appendEvent('crash', {
      scope: 'renderer',
      reason: details.reason,
      exitCode: details.exitCode,
    })
  })

  ipcMain.handle('artquest:v1:telemetry:track', (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { success: false }
    }
    appendEvent('telemetry', payload)
    return { success: true }
  })
}
