import type { IpcResult } from '../ipcTypes'
import type { StorageMode } from '../../shared/storageMode'
import { invokeIpc, onChannel, onVoidChannel } from '../ipcHelpers'

interface SavedImage {
  id?: string
  filename: string
  path: string
  questId: number | null
  date: string
  mediaType?: 'image' | 'video'
  thumbnailPath?: string
  storageMode?: StorageMode | 'google_drive'
  cloudProvider?: string
  remoteFileId?: string
  remotePath?: string
  syncStatus?: string
  syncError?: string
  lastSyncAt?: string
}

type GallerySyncResult = {
  success: boolean
  requeued?: number
  migrated?: number
  uploaded?: number
  failed?: number
  downloaded?: number
  linked?: number
  lastError?: string | null
  needsScopeReconnect?: boolean
  error?: string
}

export function createGalleryApi() {
  const saveImage = async (
    base64Data: string,
    questId: string,
  ): Promise<IpcResult & { path?: string; galleryItemId?: string; syncStatus?: string; storageMode?: string }> =>
    (await invokeIpc('save-image', base64Data, questId)) as IpcResult & {
      path?: string
      galleryItemId?: string
      syncStatus?: string
      storageMode?: string
    }

  const saveQuestReference = async (
    base64Data: string,
    questId: string,
  ): Promise<IpcResult & { id?: string; path?: string }> =>
    (await invokeIpc('save-quest-reference', base64Data, questId)) as IpcResult & {
      id?: string
      path?: string
    }

  const deleteQuestReference = async (filePath: string): Promise<IpcResult> =>
    (await invokeIpc('delete-quest-reference', filePath)) as IpcResult

  const getSavedImages = async (): Promise<SavedImage[]> => {
    try {
      return (await invokeIpc('get-saved-images')) as SavedImage[]
    } catch {
      return []
    }
  }

  const readImage = async (filepath: string): Promise<string | null> => {
    try {
      return (await invokeIpc('read-image', filepath)) as string | null
    } catch {
      return null
    }
  }

  const getLocalMediaUrl = async (filepath: string): Promise<string | null> => {
    try {
      return (await invokeIpc('get-local-media-url', filepath)) as string | null
    } catch {
      return null
    }
  }

  const pickPortraitImage = async (): Promise<{ success: boolean; dataUrl?: string; error?: unknown }> =>
    (await invokeIpc('pick-portrait-image')) as { success: boolean; dataUrl?: string; error?: unknown }

  const saveCustomAvatar = async (base64Data: string): Promise<IpcResult & { path?: string }> =>
    (await invokeIpc('save-custom-avatar', base64Data)) as IpcResult & { path?: string }

  const retryGalleryUpload = async (galleryItemId: string): Promise<{ success: boolean; error?: string }> =>
    (await invokeIpc('artquest:v1:gallery:retryUpload', galleryItemId)) as {
      success: boolean
      error?: string
    }

  const retryAllGalleryUploads = async (): Promise<GallerySyncResult> =>
    (await invokeIpc('artquest:v1:gallery:retryAllUploads')) as GallerySyncResult

  const syncGallery = async (): Promise<GallerySyncResult> =>
    (await invokeIpc('artquest:v1:gallery:sync')) as GallerySyncResult

  const onGallerySyncUpdated = (handler: () => void): (() => void) =>
    onVoidChannel('artquest:v1:gallery:syncUpdated', handler)

  return {
    saveImage,
    saveQuestReference,
    deleteQuestReference,
    getSavedImages,
    readImage,
    getLocalMediaUrl,
    pickPortraitImage,
    saveCustomAvatar,
    retryGalleryUpload,
    retryAllGalleryUploads,
    syncGallery,
    onGallerySyncUpdated,
    namespace: {
      saveImage,
      saveQuestReference,
      deleteQuestReference,
      listImages: getSavedImages,
      readImage,
      getLocalMediaUrl,
      pickPortraitImage,
      saveCustomAvatar,
      retryUpload: retryGalleryUpload,
      retryAllUploads: retryAllGalleryUploads,
      sync: syncGallery,
      onSyncUpdated: onGallerySyncUpdated,
    },
  }
}

export type GalleryApi = ReturnType<typeof createGalleryApi>
