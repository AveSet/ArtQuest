import type { StorageMode } from '../../shared/storageMode'

export type { StorageMode } from '../../shared/storageMode'

export type SyncStatus =
  | 'local_only'
  | 'queued'
  | 'queued_until_connected'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'conflict'
  | 'deleted_remote'

export type SavedGalleryItem = {
  id: string
  filename: string
  path: string
  questId: number | null
  date: string
  mediaType: 'image' | 'video'
  thumbnailPath?: string
  storageMode: StorageMode
  cloudProvider?: string
  remoteFileId?: string
  remotePath?: string
  syncStatus: SyncStatus
  lastSyncAt?: string
  syncError?: string
}

export type CloudAccount = {
  provider: 'google'
  connected: boolean
  accountEmail: string | null
  remoteRootPath: string
  remoteRootFolderId: string | null
  connectedAt: string | null
  updatedAt: string
}

export type UploadQueueRow = {
  id: string
  galleryItemId: string
  provider: 'google'
  status: 'queued' | 'uploading' | 'failed'
  attempts: number
  lastErrorCode: string | null
  lastErrorMessage: string | null
  nextAttemptAt: string | null
  createdAt: string
  updatedAt: string
}

export type UploadCandidate = UploadQueueRow & {
  localFilePath: string
  mediaType: 'image' | 'video'
  remotePath: string | null
  checksumSha256: string
}
