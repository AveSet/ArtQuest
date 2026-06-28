import { ipcMain } from 'electron'
import {
  getStorageMode,
  migrateGalleryItemsToCloudMode,
  requeuePendingGalleryUploads,
  setStorageMode,
  getLastUploadErrorMessage,
  type StorageMode,
} from '../localDb'
import { normalizeStorageMode, usesCloudStorage } from '../../shared/storageMode'
import {
  checkGoogleDriveScopeAccess,
  connectGoogleDrive,
  disconnectGoogleDrive,
  getGoogleDriveStatus,
  needsGoogleDriveScopeReconnect,
  processGoogleUploadQueue,
  retryGoogleUpload,
  syncGoogleDriveGallery,
  getGoogleDriveFolderWebUrl,
  setGoogleDrivePath,
} from '../googleDrive'

export function registerStorageCloudIpcHandlers(): void {
  ipcMain.handle('artquest:v1:storage:getMode', async () => {
    return { success: true, mode: getStorageMode() }
  })

  ipcMain.handle('artquest:v1:storage:setMode', async (_, rawMode: unknown) => {
    try {
      const mode = normalizeStorageMode(typeof rawMode === 'string' ? rawMode : 'local') as StorageMode
      setStorageMode(mode)
      if (usesCloudStorage(mode)) {
        migrateGalleryItemsToCloudMode()
        requeuePendingGalleryUploads()
        void processGoogleUploadQueue()
      }
      return { success: true, mode }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('artquest:v1:cloud:google:connect', async () => connectGoogleDrive())

  ipcMain.handle('artquest:v1:cloud:google:disconnect', async () => {
    try {
      return { success: true, account: disconnectGoogleDrive() }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('artquest:v1:cloud:google:setPath', async (_, rawPath: unknown) => {
    try {
      const drivePath = typeof rawPath === 'string' ? rawPath : '/ArtQuest/Gallery'
      return { success: true, account: setGoogleDrivePath(drivePath) }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('artquest:v1:cloud:google:getStatus', async () => {
    const account = getGoogleDriveStatus()
    const lastUploadError = getLastUploadErrorMessage()
    let needsScopeReconnect = needsGoogleDriveScopeReconnect(lastUploadError)
    if (account.connected && !needsScopeReconnect) {
      const scopeCheck = await checkGoogleDriveScopeAccess()
      if (!scopeCheck.ok && needsGoogleDriveScopeReconnect(scopeCheck.error)) {
        needsScopeReconnect = true
      }
    }
    return {
      success: true,
      account,
      lastUploadError,
      needsScopeReconnect,
      folderWebUrl: getGoogleDriveFolderWebUrl(),
    }
  })

  ipcMain.handle('artquest:v1:gallery:retryUpload', async (_, galleryItemId: unknown) => {
    if (typeof galleryItemId !== 'string' || !galleryItemId) {
      return { success: false, error: 'Invalid gallery item id' }
    }
    return retryGoogleUpload(galleryItemId)
  })

  ipcMain.handle('artquest:v1:gallery:retryAllUploads', async () => {
    try {
      return { success: true, ...(await syncGoogleDriveGallery()) }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('artquest:v1:gallery:sync', async () => {
    try {
      return { success: true, ...(await syncGoogleDriveGallery()) }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}
