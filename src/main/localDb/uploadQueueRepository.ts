import fs from 'fs'
import path from 'path'
import { isCloudOnlyStorage, type StorageMode } from '../../shared/storageMode'
import { getCloudAccount, getStorageMode } from './cloudAccountRepository'
import { appendEvent, getDb, nowIso, randomId, runTransaction } from './dbCore'
import type { SyncStatus, UploadCandidate } from './types'

function pruneLocalOriginalAfterCloudUpload(galleryItemId: string): void {
  if (!isCloudOnlyStorage(getStorageMode())) return
  const row = getDb()
    .prepare('SELECT local_file_path, thumbnail_path FROM gallery_item WHERE id = ?')
    .get(galleryItemId) as { local_file_path: string; thumbnail_path: string | null } | undefined
  if (!row?.local_file_path) return
  if (!row.thumbnail_path || !fs.existsSync(row.thumbnail_path)) return
  try {
    if (fs.existsSync(row.local_file_path)) fs.unlinkSync(row.local_file_path)
  } catch {
    // Keep remote copy as source of truth even if local delete fails.
  }
}

export function enqueueGalleryUpload(galleryItemId: string, createdAt = nowIso()): void {
  getDb()
    .prepare(
      `INSERT INTO upload_queue (id, gallery_item_id, provider, status, created_at, updated_at)
       VALUES (?, ?, 'google', 'queued', ?, ?)`,
    )
    .run(randomId('upq'), galleryItemId, createdAt, createdAt)
}

export function ensureUploadQueueEntry(galleryItemId: string, createdAt = nowIso()): boolean {
  const existing = getDb()
    .prepare('SELECT id FROM upload_queue WHERE gallery_item_id = ?')
    .get(galleryItemId) as { id: string } | undefined
  if (existing) return false
  enqueueGalleryUpload(galleryItemId, createdAt)
  return true
}

export function requeuePendingGalleryUploads(): number {
  const updatedAt = nowIso()
  let requeued = 0
  runTransaction(() => {
    getDb()
      .prepare(
        `UPDATE gallery_item
         SET sync_status = 'queued', updated_at = ?
         WHERE storage_mode IN ('local_and_cloud', 'cloud_only', 'google_drive')
           AND sync_status IN ('queued', 'queued_until_connected', 'failed', 'uploading')`,
      )
      .run(updatedAt)
    getDb()
      .prepare(
        `UPDATE upload_queue
         SET status = 'queued', next_attempt_at = NULL, last_error_code = NULL,
             last_error_message = NULL, updated_at = ?
         WHERE provider = 'google'`,
      )
      .run(updatedAt)

    const pending = getDb()
      .prepare(
        `SELECT id FROM gallery_item
         WHERE storage_mode IN ('local_and_cloud', 'cloud_only', 'google_drive')
           AND sync_status != 'uploaded'`,
      )
      .all() as Array<{ id: string }>

    for (const row of pending) {
      if (ensureUploadQueueEntry(row.id, updatedAt)) requeued += 1
    }
  })
  return requeued
}

export function getLastUploadErrorMessage(): string | null {
  const row = getDb()
    .prepare(
      `SELECT last_error_message AS message
       FROM upload_queue
       WHERE provider = 'google' AND last_error_message IS NOT NULL
       ORDER BY updated_at DESC
       LIMIT 1`,
    )
    .get() as { message: string } | undefined
  return row?.message ?? null
}

export function migrateGalleryItemsToCloudMode(): number {
  const updatedAt = nowIso()
  const account = getCloudAccount('google')
  const remoteRoot = account?.remoteRootPath || '/ArtQuest/Gallery'
  const targetMode = getStorageMode()
  const cloudMode: StorageMode =
    targetMode === 'cloud_only' ? 'cloud_only' : 'local_and_cloud'
  let migrated = 0
  runTransaction(() => {
    const rows = getDb()
      .prepare(
        `SELECT id, local_file_path, sync_status
         FROM gallery_item
         WHERE storage_mode = 'local' OR storage_mode = 'google_drive'`,
      )
      .all() as Array<{ id: string; local_file_path: string; sync_status: SyncStatus }>

    for (const row of rows) {
      const filename = path.basename(row.local_file_path)
      const remotePath = `${remoteRoot.replace(/\/+$/, '')}/${filename}`
      getDb()
        .prepare(
          `UPDATE gallery_item
           SET storage_mode = ?, cloud_provider = 'google', remote_path = ?,
               sync_status = 'queued', updated_at = ?
           WHERE id = ?`,
        )
        .run(cloudMode, remotePath, updatedAt, row.id)
      ensureUploadQueueEntry(row.id, updatedAt)
      migrated += 1
    }
  })
  return migrated
}

export function listPendingUploadGalleryItems(): Array<{
  queueId: string
  galleryItemId: string
  localFilePath: string
  checksumSha256: string | null
}> {
  return getDb()
    .prepare(
      `SELECT q.id AS queueId, q.gallery_item_id AS galleryItemId,
              g.local_file_path AS localFilePath, g.checksum_sha256 AS checksumSha256
       FROM upload_queue q
       JOIN gallery_item g ON g.id = q.gallery_item_id
       WHERE q.provider = 'google' AND q.status IN ('queued', 'failed', 'uploading')`,
    )
    .all() as Array<{
    queueId: string
    galleryItemId: string
    localFilePath: string
    checksumSha256: string | null
  }>
}

export function getNextUploadCandidate(): UploadCandidate | null {
  const row = getDb()
    .prepare(
      `SELECT q.id, q.gallery_item_id AS galleryItemId, q.provider, q.status, q.attempts,
              q.last_error_code AS lastErrorCode, q.last_error_message AS lastErrorMessage,
              q.next_attempt_at AS nextAttemptAt, q.created_at AS createdAt, q.updated_at AS updatedAt,
              g.local_file_path AS localFilePath, g.media_type AS mediaType,
              g.remote_path AS remotePath, g.checksum_sha256 AS checksumSha256
       FROM upload_queue q
       JOIN gallery_item g ON g.id = q.gallery_item_id
       WHERE q.provider = 'google'
         AND q.status IN ('queued', 'failed')
         AND (q.next_attempt_at IS NULL OR q.next_attempt_at <= ?)
       ORDER BY q.created_at ASC
       LIMIT 1`,
    )
    .get(nowIso()) as UploadCandidate | undefined
  return row ?? null
}

export function markUploadStarted(queueId: string, galleryItemId: string): void {
  const updatedAt = nowIso()
  runTransaction(() => {
    getDb().prepare("UPDATE upload_queue SET status = 'uploading', updated_at = ? WHERE id = ?").run(updatedAt, queueId)
    getDb().prepare("UPDATE gallery_item SET sync_status = 'uploading', updated_at = ? WHERE id = ?").run(updatedAt, galleryItemId)
  })
}

export function markUploadSucceeded(queueId: string, galleryItemId: string, remoteFileId: string): void {
  const updatedAt = nowIso()
  runTransaction(() => {
    getDb().prepare('DELETE FROM upload_queue WHERE id = ?').run(queueId)
    getDb()
      .prepare(
        `UPDATE gallery_item
         SET sync_status = 'uploaded', remote_file_id = ?, last_sync_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(remoteFileId, updatedAt, updatedAt, galleryItemId)
  })
  appendEvent('gallery_uploaded', { galleryItemId, remoteFileId })
  pruneLocalOriginalAfterCloudUpload(galleryItemId)
}

export function markUploadFailed(queueId: string, galleryItemId: string, code: string, message: string): void {
  const updatedAt = nowIso()
  const attemptsRow = getDb().prepare('SELECT attempts FROM upload_queue WHERE id = ?').get(queueId) as
    | { attempts: number }
    | undefined
  const attempts = (attemptsRow?.attempts ?? 0) + 1
  const delayMinutes = Math.min(60, 2 ** Math.min(attempts, 6))
  const nextAttemptAt = new Date(Date.now() + delayMinutes * 60_000).toISOString()
  runTransaction(() => {
    getDb()
      .prepare(
        `UPDATE upload_queue
         SET status = 'failed', attempts = ?, last_error_code = ?, last_error_message = ?,
             next_attempt_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(attempts, code, message.slice(0, 500), nextAttemptAt, updatedAt, queueId)
    getDb().prepare("UPDATE gallery_item SET sync_status = 'failed', updated_at = ? WHERE id = ?").run(updatedAt, galleryItemId)
  })
  appendEvent('gallery_upload_failed', { galleryItemId, code, attempts })
}

export function retryGalleryUpload(galleryItemId: string): boolean {
  const row = getDb().prepare('SELECT id FROM upload_queue WHERE gallery_item_id = ?').get(galleryItemId) as
    | { id: string }
    | undefined
  const updatedAt = nowIso()
  if (row) {
    getDb()
      .prepare(
        `UPDATE upload_queue
         SET status = 'queued', next_attempt_at = NULL, last_error_code = NULL,
             last_error_message = NULL, updated_at = ?
         WHERE id = ?`,
      )
      .run(updatedAt, row.id)
  } else {
    enqueueGalleryUpload(galleryItemId, updatedAt)
  }
  getDb().prepare("UPDATE gallery_item SET sync_status = 'queued', updated_at = ? WHERE id = ?").run(updatedAt, galleryItemId)
  return true
}

export function findUploadQueueIdForGalleryItem(galleryItemId: string): string | null {
  const row = getDb()
    .prepare('SELECT id FROM upload_queue WHERE gallery_item_id = ?')
    .get(galleryItemId) as { id: string } | undefined
  return row?.id ?? null
}
