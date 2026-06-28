export type { StorageMode } from './localDb/types'
export type {
  SyncStatus,
  SavedGalleryItem,
  CloudAccount,
  UploadQueueRow,
  UploadCandidate,
} from './localDb/types'

export {
  getDatabasePath,
  getGalleryRoot,
  getDb,
  appendEvent,
  clearLocalUserData,
} from './localDb/dbCore'

export {
  getStorageMode,
  setStorageMode,
  getCloudAccount,
  upsertCloudAccount,
  normalizeDrivePath,
} from './localDb/cloudAccountRepository'

export {
  requeuePendingGalleryUploads,
  getLastUploadErrorMessage,
  migrateGalleryItemsToCloudMode,
  listPendingUploadGalleryItems,
  getNextUploadCandidate,
  markUploadStarted,
  markUploadSucceeded,
  markUploadFailed,
  retryGalleryUpload,
} from './localDb/uploadQueueRepository'

export {
  saveGalleryMediaFromDataUrl,
  importDownloadedGalleryFile,
  getGalleryItemById,
  getGalleryItemByChecksum,
  findGalleryItemByBasename,
  linkGalleryItemToRemoteFile,
  getGalleryItemByRemoteFileId,
  upsertGalleryItemFromRemote,
  listSavedGalleryItems,
} from './localDb/galleryRepository'

export {
  getQuestReferencesRoot,
  deleteQuestReferenceFile,
  saveQuestReferenceFromDataUrl,
  saveCustomAvatarFromDataUrl,
  isManagedMediaPath,
} from './localDb/localMediaRepository'

export {
  saveProgressSnapshot,
  saveProgressChunk,
  loadProgressChunks,
  loadProgressChunksWithMeta,
  clearProgressChunks,
  loadProgressSnapshot,
  rebuildProgressFromChunks,
  rebuildProgressFromChunksWithMeta,
  syncProgressChunksFromFull,
} from './db/progressRepository'
