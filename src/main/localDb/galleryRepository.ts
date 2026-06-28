import { nativeImage } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { normalizeStorageMode, usesCloudStorage, type StorageMode } from '../../shared/storageMode'
import { getCloudAccount, getStorageMode } from './cloudAccountRepository'
import {
  appendEvent,
  ensureDir,
  getDb,
  getGalleryRoot,
  nowIso,
  randomId,
  runTransaction,
} from './dbCore'
import { dataUrlToBuffer } from './mediaDataUrl'
import type { SavedGalleryItem, SyncStatus } from './types'
import {
  enqueueGalleryUpload,
  findUploadQueueIdForGalleryItem,
  markUploadSucceeded,
} from './uploadQueueRepository'

function createThumbnail(buffer: Buffer, ext: string, id: string): string | null {
  try {
    const image = nativeImage.createFromBuffer(buffer)
    if (!image || image.isEmpty()) return null
    const thumbDir = path.join(getGalleryRoot(), 'thumbs')
    ensureDir(thumbDir)
    const resized = image.resize({ width: 512 })
    const thumbPath = path.join(thumbDir, `${id}.png`)
    fs.writeFileSync(thumbPath, resized.toPNG())
    return thumbPath
  } catch (err) {
    console.warn('[gallery] thumbnail failed for', ext, err)
    return null
  }
}

function mapGalleryRow(row: {
  id: string
  quest_id: number | null
  media_type: 'image' | 'video'
  local_file_path: string
  thumbnail_path: string | null
  storage_mode: string
  cloud_provider: string | null
  remote_file_id: string | null
  remote_path: string | null
  sync_status: SyncStatus
  last_sync_at: string | null
  created_at: string
  sync_error?: string | null
}): SavedGalleryItem {
  return {
    id: row.id,
    filename: path.basename(row.local_file_path),
    path: row.local_file_path,
    questId: row.quest_id,
    date: row.created_at,
    mediaType: row.media_type,
    thumbnailPath: row.thumbnail_path ?? undefined,
    storageMode: normalizeStorageMode(row.storage_mode),
    cloudProvider: row.cloud_provider ?? undefined,
    remoteFileId: row.remote_file_id ?? undefined,
    remotePath: row.remote_path ?? undefined,
    syncStatus: row.sync_status,
    lastSyncAt: row.last_sync_at ?? undefined,
    syncError: row.sync_error ?? undefined,
  }
}

export function saveGalleryMediaFromDataUrl(dataUrl: string, questId: string): SavedGalleryItem | null {
  if (!/^[a-zA-Z0-9-]+$/.test(questId) || questId.length > 50) return null
  const parsed = dataUrlToBuffer(dataUrl)
  if (!parsed) return null

  const id = randomId('gal')
  const originalDir = path.join(getGalleryRoot(), 'originals')
  ensureDir(originalDir)
  const filename = `quest-${questId}-${Date.now()}.${parsed.ext}`
  const localFilePath = path.join(originalDir, filename)
  const resolved = path.resolve(localFilePath)
  const root = path.resolve(originalDir) + path.sep
  if (!resolved.startsWith(root)) return null

  fs.writeFileSync(resolved, parsed.buffer)
  const checksum = crypto.createHash('sha256').update(parsed.buffer).digest('hex')
  const thumbnailPath = parsed.mediaType === 'image' ? createThumbnail(parsed.buffer, parsed.ext, id) : null
  const account = getCloudAccount('google')
  const storageMode = getStorageMode()
  const shouldQueue = usesCloudStorage(storageMode)
  const syncStatus: SyncStatus =
    shouldQueue && account?.connected ? 'queued' : shouldQueue ? 'queued_until_connected' : 'local_only'
  const remoteRoot = account?.remoteRootPath || '/ArtQuest/Gallery'
  const remotePath = shouldQueue ? `${remoteRoot.replace(/\/+$/, '')}/${filename}` : null
  const createdAt = nowIso()
  const numericQuestId = Number.parseInt(questId, 10)

  runTransaction(() => {
    getDb()
      .prepare(
        `INSERT INTO gallery_item (
          id, quest_id, media_type, local_file_path, thumbnail_path, checksum_sha256,
          storage_mode, cloud_provider, remote_path, sync_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        Number.isFinite(numericQuestId) ? numericQuestId : null,
        parsed.mediaType,
        resolved,
        thumbnailPath,
        checksum,
        storageMode,
        shouldQueue ? 'google' : null,
        remotePath,
        syncStatus,
        createdAt,
        createdAt,
      )
    if (shouldQueue) {
      enqueueGalleryUpload(id, createdAt)
    }
  })

  appendEvent('gallery_imported', { id, questId, mediaType: parsed.mediaType, storageMode, syncStatus })
  return {
    id,
    filename,
    path: resolved,
    questId: Number.isFinite(numericQuestId) ? numericQuestId : null,
    date: createdAt,
    mediaType: parsed.mediaType,
    thumbnailPath: thumbnailPath ?? undefined,
    storageMode,
    cloudProvider: shouldQueue ? 'google' : undefined,
    remotePath: remotePath ?? undefined,
    syncStatus,
  }
}

export function importDownloadedGalleryFile(input: {
  buffer: Buffer
  ext: string
  mediaType: 'image' | 'video'
  questId: number | null
  remoteFileId: string
  remotePath: string
  galleryItemId?: string
}): SavedGalleryItem {
  const id = input.galleryItemId ?? randomId('gal')
  const originalDir = path.join(getGalleryRoot(), 'originals')
  ensureDir(originalDir)
  const filename = path.basename(input.remotePath) || `remote-${input.remoteFileId}.${input.ext}`
  const localFilePath = path.join(originalDir, filename)
  fs.writeFileSync(localFilePath, input.buffer)
  const checksum = crypto.createHash('sha256').update(input.buffer).digest('hex')
  const thumbnailPath =
    input.mediaType === 'image' ? createThumbnail(input.buffer, input.ext, id) : null
  const storageMode = getStorageMode()
  return upsertGalleryItemFromRemote({
    id,
    questId: input.questId,
    localFilePath,
    thumbnailPath,
    remoteFileId: input.remoteFileId,
    remotePath: input.remotePath,
    mediaType: input.mediaType,
    checksumSha256: checksum,
    storageMode: usesCloudStorage(storageMode) ? storageMode : 'local_and_cloud',
  })
}

export function getGalleryItemById(id: string): { id: string; path: string; checksumSha256: string | null } | null {
  const row = getDb()
    .prepare('SELECT id, local_file_path, checksum_sha256 FROM gallery_item WHERE id = ?')
    .get(id) as { id: string; local_file_path: string; checksum_sha256: string | null } | undefined
  if (!row) return null
  return { id: row.id, path: row.local_file_path, checksumSha256: row.checksum_sha256 }
}

export function getGalleryItemByChecksum(checksum: string): {
  id: string
  localFilePath: string
  checksumSha256: string | null
} | null {
  const row = getDb()
    .prepare('SELECT id, local_file_path, checksum_sha256 FROM gallery_item WHERE checksum_sha256 = ?')
    .get(checksum) as { id: string; local_file_path: string; checksum_sha256: string | null } | undefined
  if (!row) return null
  return { id: row.id, localFilePath: row.local_file_path, checksumSha256: row.checksum_sha256 }
}

export function findGalleryItemByBasename(filename: string): {
  id: string
  localFilePath: string
  checksumSha256: string | null
} | null {
  const target = filename.toLowerCase()
  const row = getDb()
    .prepare(
      `SELECT id, local_file_path, checksum_sha256 FROM gallery_item
       WHERE substr(lower(local_file_path), -?) = ?`,
    )
    .get(target.length, target) as { id: string; local_file_path: string; checksum_sha256: string | null } | undefined
  if (!row) return null
  return { id: row.id, localFilePath: row.local_file_path, checksumSha256: row.checksum_sha256 }
}

export function linkGalleryItemToRemoteFile(input: {
  queueId?: string
  galleryItemId: string
  remoteFileId: string
  remotePath: string
}): void {
  const queueId = input.queueId ?? findUploadQueueIdForGalleryItem(input.galleryItemId)
  if (queueId) {
    markUploadSucceeded(queueId, input.galleryItemId, input.remoteFileId)
    getDb()
      .prepare('UPDATE gallery_item SET remote_path = ? WHERE id = ?')
      .run(input.remotePath, input.galleryItemId)
    return
  }
  const updatedAt = nowIso()
  getDb()
    .prepare(
      `UPDATE gallery_item
       SET sync_status = 'uploaded', remote_file_id = ?, remote_path = ?, last_sync_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(input.remoteFileId, input.remotePath, updatedAt, updatedAt, input.galleryItemId)
}

export function getGalleryItemByRemoteFileId(remoteFileId: string): SavedGalleryItem | null {
  const row = getDb()
    .prepare(
      `SELECT id, quest_id, media_type, local_file_path, thumbnail_path, storage_mode, cloud_provider,
              remote_file_id, remote_path, sync_status, last_sync_at, created_at
       FROM gallery_item WHERE remote_file_id = ?`,
    )
    .get(remoteFileId) as
    | {
        id: string
        quest_id: number | null
        media_type: 'image' | 'video'
        local_file_path: string
        thumbnail_path: string | null
        storage_mode: string
        cloud_provider: string | null
        remote_file_id: string | null
        remote_path: string | null
        sync_status: SyncStatus
        last_sync_at: string | null
        created_at: string
      }
    | undefined
  if (!row) return null
  return mapGalleryRow(row)
}

export function upsertGalleryItemFromRemote(input: {
  id: string
  questId: number | null
  localFilePath: string
  thumbnailPath?: string | null
  remoteFileId: string
  remotePath: string
  mediaType: 'image' | 'video'
  checksumSha256: string
  storageMode: StorageMode
}): SavedGalleryItem {
  const updatedAt = nowIso()
  const existing = getDb().prepare('SELECT id FROM gallery_item WHERE id = ? OR remote_file_id = ?').get(input.id, input.remoteFileId) as
    | { id: string }
    | undefined
  if (existing) {
    getDb()
      .prepare(
        `UPDATE gallery_item
         SET quest_id = ?, media_type = ?, local_file_path = ?, thumbnail_path = ?, checksum_sha256 = ?,
             storage_mode = ?, cloud_provider = 'google', remote_file_id = ?, remote_path = ?,
             sync_status = 'uploaded', last_sync_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        input.questId,
        input.mediaType,
        input.localFilePath,
        input.thumbnailPath ?? null,
        input.checksumSha256,
        input.storageMode,
        input.remoteFileId,
        input.remotePath,
        updatedAt,
        updatedAt,
        existing.id,
      )
  } else {
    getDb()
      .prepare(
        `INSERT INTO gallery_item (
          id, quest_id, media_type, local_file_path, thumbnail_path, checksum_sha256,
          storage_mode, cloud_provider, remote_file_id, remote_path, sync_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'google', ?, ?, 'uploaded', ?, ?)`,
      )
      .run(
        input.id,
        input.questId,
        input.mediaType,
        input.localFilePath,
        input.thumbnailPath ?? null,
        input.checksumSha256,
        input.storageMode,
        input.remoteFileId,
        input.remotePath,
        updatedAt,
        updatedAt,
      )
  }
  return getGalleryItemByRemoteFileId(input.remoteFileId) ?? {
    id: input.id,
    filename: path.basename(input.localFilePath),
    path: input.localFilePath,
    questId: input.questId,
    date: updatedAt,
    mediaType: input.mediaType,
    thumbnailPath: input.thumbnailPath ?? undefined,
    storageMode: input.storageMode,
    cloudProvider: 'google',
    remoteFileId: input.remoteFileId,
    remotePath: input.remotePath,
    syncStatus: 'uploaded',
    lastSyncAt: updatedAt,
  }
}

export function listSavedGalleryItems(): SavedGalleryItem[] {
  const rows = getDb()
    .prepare(
      `SELECT g.id, g.quest_id, g.media_type, g.local_file_path, g.thumbnail_path, g.storage_mode, g.cloud_provider,
              g.remote_file_id, g.remote_path, g.sync_status, g.last_sync_at, g.created_at,
              q.last_error_message AS sync_error
       FROM gallery_item g
       LEFT JOIN upload_queue q ON q.gallery_item_id = g.id
       ORDER BY g.created_at ASC`,
    )
    .all() as Array<{
    id: string
    quest_id: number | null
    media_type: 'image' | 'video'
    local_file_path: string
    thumbnail_path: string | null
    storage_mode: StorageMode
    cloud_provider: string | null
    remote_file_id: string | null
    remote_path: string | null
    sync_status: SyncStatus
    last_sync_at: string | null
    created_at: string
    sync_error: string | null
  }>

  return rows.map((row) => mapGalleryRow(row))
}
