import { app, dialog, ipcMain, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { isManagedMediaPath } from '../localDb'
import { validateExternalOpenUrl } from '../../shared/referenceUrlPolicy'
import {
  isValidExportPayload,
  isValidShareCardPayload,
  sanitizeShareCardFilename,
} from './shellExportValidation'

export {
  isValidExportPayload,
  isValidShareCardPayload,
  MAX_EXPORT_BYTES,
  MAX_SHARE_CARD_BYTES,
  sanitizeShareCardFilename,
} from './shellExportValidation'

export function registerShellIpcHandlers(): void {
  ipcMain.handle('show-item-in-folder', async (_, filePath: string) => {
    try {
      if (!filePath || typeof filePath !== 'string') return
      if (!isManagedMediaPath(filePath)) {
        console.warn('show-item-in-folder rejected path outside allowed roots:', filePath)
        return
      }
      shell.showItemInFolder(path.resolve(filePath))
    } catch (err) {
      console.error('Failed to show item in folder:', filePath, err)
    }
  })

  ipcMain.handle('open-external', async (_, rawUrl: unknown) => {
    try {
      if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
        return { success: false, error: 'invalid url' }
      }
      const checked = validateExternalOpenUrl(rawUrl)
      if (!checked.ok) {
        return { success: false, error: checked.reason }
      }
      await shell.openExternal(checked.url)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('save-share-card-png', async (_, rawPayload: unknown, rawFilename: unknown) => {
    try {
      if (!isValidShareCardPayload(rawPayload)) {
        return { success: false, error: 'Invalid share card payload' }
      }
      const safeName = sanitizeShareCardFilename(rawFilename)
      const result = await dialog.showSaveDialog({
        defaultPath: path.join(app.getPath('documents'), safeName),
        filters: [{ name: 'PNG', extensions: ['png'] }],
      })
      if (result.canceled || !result.filePath) {
        return { success: false, error: 'cancelled' }
      }
      fs.writeFileSync(result.filePath, Buffer.from(rawPayload, 'base64'))
      return { success: true, path: result.filePath }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('export-progress-file', async (_, rawPayload: unknown) => {
    try {
      if (!isValidExportPayload(rawPayload)) {
        return { success: false, error: 'Invalid export payload' }
      }
      const defaultName = `artquest-progress-${new Date().toISOString().slice(0, 10)}.json`
      const result = await dialog.showSaveDialog({
        defaultPath: path.join(app.getPath('documents'), defaultName),
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })
      if (result.canceled || !result.filePath) {
        return { success: false, error: 'cancelled' }
      }
      fs.writeFileSync(result.filePath, rawPayload, 'utf8')
      return { success: true, path: result.filePath }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}
