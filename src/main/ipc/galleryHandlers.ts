import { ipcMain, app, dialog, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'
import {
  getCloudAccount,
  isManagedMediaPath,
  listSavedGalleryItems,
  saveCustomAvatarFromDataUrl,
  saveGalleryMediaFromDataUrl,
  saveQuestReferenceFromDataUrl,
  deleteQuestReferenceFile,
} from '../localDb'
import { usesCloudStorage } from '../../shared/storageMode'
import { processGoogleUploadQueue } from '../googleDrive'

import { validateMediaData, validateQuestId } from './galleryValidation'

export { validateMediaData, validateQuestId } from './galleryValidation'

const PORTRAIT_IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

export type GalleryIpcDeps = {
  getMainWindow: () => BrowserWindow | null
}

export function registerGalleryIpcHandlers(deps: GalleryIpcDeps): void {
  ipcMain.handle('save-image', async (_, base64Data: string, questId: string) => {
    try {
      if (!validateMediaData(base64Data)) {
        return { success: false, error: 'Invalid media data' }
      }
      if (!validateQuestId(questId)) {
        return { success: false, error: 'Invalid quest ID' }
      }

      const item = saveGalleryMediaFromDataUrl(base64Data, questId)
      if (!item) return { success: false, error: 'Invalid media data' }
      if (
        usesCloudStorage(item.storageMode) &&
        getCloudAccount('google')?.connected &&
        (item.syncStatus === 'queued' ||
          item.syncStatus === 'failed' ||
          item.syncStatus === 'queued_until_connected')
      ) {
        void processGoogleUploadQueue()
      }
      return {
        success: true,
        path: item.path,
        galleryItemId: item.id,
        syncStatus: item.syncStatus,
        storageMode: item.storageMode,
      }
    } catch (error) {
      console.error('Failed to save image:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('save-quest-reference', async (_, base64Data: string, questId: string) => {
    try {
      if (!validateMediaData(base64Data)) {
        return { success: false, error: 'Invalid media data' }
      }
      if (!validateQuestId(questId)) {
        return { success: false, error: 'Invalid quest ID' }
      }
      const saved = saveQuestReferenceFromDataUrl(base64Data, questId)
      if (!saved) return { success: false, error: 'Save failed' }
      return { success: true, id: saved.id, path: saved.path }
    } catch (error) {
      console.error('Failed to save quest reference:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('delete-quest-reference', async (_, filePath: string) => {
    try {
      if (typeof filePath !== 'string') return { success: false }
      return { success: deleteQuestReferenceFile(filePath) }
    } catch (error) {
      console.error('Failed to delete quest reference:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('pick-portrait-image', async () => {
    try {
      const mainWindow = deps.getMainWindow()
      const parent =
        mainWindow && !mainWindow.isDestroyed() ? mainWindow : BrowserWindow.getFocusedWindow()
      if (parent && !parent.isDestroyed()) {
        parent.focus()
      }
      const result = parent
        ? await dialog.showOpenDialog(parent, {
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
            properties: ['openFile'],
          })
        : await dialog.showOpenDialog({
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
            properties: ['openFile'],
          })
      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'cancelled' }
      }
      const filePath = result.filePaths[0]
      const stat = fs.statSync(filePath)
      if (stat.size > 25 * 1024 * 1024) {
        return { success: false, error: 'File too large' }
      }
      const ext = path.extname(filePath).toLowerCase()
      const mime = PORTRAIT_IMAGE_MIME[ext]
      if (!mime) {
        return { success: false, error: 'Unsupported image type' }
      }
      const buffer = fs.readFileSync(filePath)
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
      return { success: true, dataUrl }
    } catch (error) {
      console.error('Failed to pick portrait image:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('save-custom-avatar', async (_, base64Data: string) => {
    try {
      if (!validateMediaData(base64Data)) {
        return { success: false, error: 'Invalid media data' }
      }
      const saved = saveCustomAvatarFromDataUrl(base64Data)
      if (!saved) return { success: false, error: 'Save failed' }
      return { success: true, path: saved.path }
    } catch (error) {
      console.error('Failed to save custom avatar:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('get-saved-images', async () => {
    try {
      const galleryItems = listSavedGalleryItems()
      const imagesDir = path.join(app.getPath('userData'), 'images')
      if (!fs.existsSync(imagesDir)) {
        return galleryItems
      }
      const files = fs.readdirSync(imagesDir)
      const imageFiles = files.filter((f) => /\.(png|jpe?g|webp|mp4|webm|mov)$/i.test(f))
      const legacyItems = imageFiles.map((filename) => {
        const questMatch = filename.match(/^quest-(.+?)-(\d+)\.\w+$/)
        const questIdStr = questMatch ? questMatch[1] : null
        const timestamp = questMatch ? parseInt(questMatch[2]!, 10) : NaN
        const parsed = questIdStr ? parseInt(questIdStr, 10) : NaN
        return {
          filename,
          path: path.join(imagesDir, filename),
          questId: !isNaN(parsed) ? parsed : null,
          date: !isNaN(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString(),
        }
      })
      const knownPaths = new Set(galleryItems.map((item) => path.resolve(item.path).toLowerCase()))
      return [
        ...galleryItems,
        ...legacyItems.filter((item) => !knownPaths.has(path.resolve(item.path).toLowerCase())),
      ]
    } catch (error) {
      console.error('Failed to get saved images:', error)
      return []
    }
  })

  ipcMain.handle('read-image', async (_, filepath: string) => {
    try {
      const resolvedPath = path.resolve(filepath)
      if (!isManagedMediaPath(resolvedPath)) {
        console.error('read-image: path outside allowed directories:', resolvedPath)
        return null
      }

      if (!fs.existsSync(resolvedPath)) {
        console.error('File not found:', resolvedPath)
        return null
      }

      const stats = fs.statSync(resolvedPath)
      const maxImageBytes = 25 * 1024 * 1024
      if (stats.size > maxImageBytes) {
        console.warn('read-image: file too large, skipping base64 conversion:', resolvedPath)
        return null
      }

      const buffer = fs.readFileSync(resolvedPath)
      const ext = path.extname(resolvedPath).toLowerCase()
      const mimeType =
        ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : ext === '.webp'
              ? 'image/webp'
              : ext === '.mp4'
                ? 'video/mp4'
                : ext === '.webm'
                  ? 'video/webm'
                  : ext === '.mov'
                    ? 'video/quicktime'
                    : 'image/png'
      if (mimeType.startsWith('video/')) {
        return null
      }
      return `data:${mimeType};base64,${buffer.toString('base64')}`
    } catch (error) {
      console.error('Failed to read image:', error)
      return null
    }
  })

  ipcMain.handle('get-local-media-url', async (_, filepath: string) => {
    try {
      if (typeof filepath !== 'string' || !filepath) return null
      const resolvedPath = path.resolve(filepath)
      if (!isManagedMediaPath(resolvedPath) || !fs.existsSync(resolvedPath)) return null

      return pathToFileURL(resolvedPath).href
    } catch (error) {
      console.error('get-local-media-url:', error)
      return null
    }
  })
}
