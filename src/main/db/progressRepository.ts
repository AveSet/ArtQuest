import {
  mergeProgressChunks,
  splitProgressIntoChunks,
  type ProgressChunkKey,
} from '../../shared/progressChunkMerge'
import { appendEvent, getDb, runTransaction as runDbTransaction } from '../localDb/dbCore'

function nowIso(): string {
  return new Date().toISOString()
}

function runTransaction(fn: () => void): void {
  runDbTransaction(fn)
}

export function saveProgressSnapshot(payload: unknown): void {
  const updatedAt = nowIso()
  getDb()
    .prepare(
      `INSERT INTO progress_snapshot (id, payload_json, updated_at)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`,
    )
    .run(JSON.stringify(payload), updatedAt)
  appendEvent('progress_saved', { updatedAt })
}

export function getProgressChunkUpdatedAtMs(chunkKey: string): number | null {
  const row = getDb()
    .prepare('SELECT updated_at_ms FROM progress_chunk WHERE chunk_key = ?')
    .get(chunkKey) as { updated_at_ms: number } | undefined
  return row ? row.updated_at_ms : null
}

/** Returns true when the chunk was written; false when rejected as stale. */
export function saveProgressChunk(
  chunkKey: string,
  data: Record<string, unknown>,
  createdAtMs?: number,
): boolean {
  const updatedAtMs = createdAtMs ?? Date.now()
  const existingMs = getProgressChunkUpdatedAtMs(chunkKey)
  if (existingMs != null && updatedAtMs < existingMs) {
    return false
  }
  const updatedAt = nowIso()
  getDb()
    .prepare(
      `INSERT INTO progress_chunk (chunk_key, payload_json, updated_at, updated_at_ms)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(chunk_key) DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at,
         updated_at_ms = excluded.updated_at_ms
       WHERE excluded.updated_at_ms >= progress_chunk.updated_at_ms`,
    )
    .run(chunkKey, JSON.stringify(data), updatedAt, updatedAtMs)
  return true
}

export type ProgressChunksLoadResult = {
  chunks: Record<string, Record<string, unknown>>
  corruptKeys: string[]
}

export function loadProgressChunksWithMeta(): ProgressChunksLoadResult {
  const rows = getDb()
    .prepare('SELECT chunk_key, payload_json FROM progress_chunk')
    .all() as { chunk_key: string; payload_json: string }[]
  const out: Record<string, Record<string, unknown>> = {}
  const corruptKeys: string[] = []
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.payload_json) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        out[row.chunk_key] = parsed as Record<string, unknown>
      }
    } catch {
      corruptKeys.push(row.chunk_key)
    }
  }
  if (corruptKeys.length > 0) {
    console.warn('[db] skipped corrupt progress chunks:', corruptKeys.join(', '))
    appendEvent('progress_chunk_corrupt', { keys: corruptKeys })
  }
  return { chunks: out, corruptKeys }
}

export function loadProgressChunks(): Record<string, Record<string, unknown>> {
  return loadProgressChunksWithMeta().chunks
}

export function clearProgressChunks(): void {
  getDb().prepare('DELETE FROM progress_chunk').run()
}

export function loadProgressSnapshot(): Record<string, unknown> | null {
  const row = getDb().prepare('SELECT payload_json FROM progress_snapshot WHERE id = 1').get() as
    | { payload_json: string }
    | undefined
  if (!row) return null
  try {
    const parsed = JSON.parse(row.payload_json) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch (err) {
    console.warn('[db] corrupt progress snapshot:', err)
    return null
  }
}

export type RebuiltProgressFromChunks = {
  merged: Record<string, unknown> | null
  corruptKeys: string[]
  chunkKeys: string[]
  usedSnapshot: boolean
}

export function rebuildProgressFromChunksWithMeta(): RebuiltProgressFromChunks {
  const { chunks: raw, corruptKeys } = loadProgressChunksWithMeta()
  const chunkKeys = Object.keys(raw)
  if (chunkKeys.length === 0) {
    return { merged: null, corruptKeys, chunkKeys, usedSnapshot: false }
  }
  const snapshot = loadProgressSnapshot()
  return {
    merged: mergeProgressChunks(
      raw as Partial<Record<ProgressChunkKey, Record<string, unknown>>>,
      snapshot ?? undefined,
    ),
    corruptKeys,
    chunkKeys,
    usedSnapshot: snapshot != null,
  }
}

export function rebuildProgressFromChunks(): Record<string, unknown> | null {
  return rebuildProgressFromChunksWithMeta().merged
}

function writeProgressChunks(
  chunks: Record<string, Record<string, unknown>>,
  createdAtMs: number,
): void {
  for (const [key, data] of Object.entries(chunks)) {
    saveProgressChunk(key, data, createdAtMs)
  }
}

export function syncProgressChunksFromFull(
  payload: Record<string, unknown>,
  createdAtMs?: number,
): void {
  const chunks = splitProgressIntoChunks(payload)
  const ms = createdAtMs ?? Date.now()
  runTransaction(() => {
    writeProgressChunks(chunks, ms)
  })
}

/** Atomically write all chunks and the snapshot in a single transaction. */
export function saveFullProgressAtomic(
  payload: Record<string, unknown>,
  createdAtMs?: number,
): void {
  const chunks = splitProgressIntoChunks(payload)
  const ms = createdAtMs ?? Date.now()
  runTransaction(() => {
    writeProgressChunks(chunks, ms)
    saveProgressSnapshot(payload)
  })
}

export function persistProgressChunkBatch(
  entries: Array<{ _chunkKey: string; data: Record<string, unknown>; _createdAtMs?: number }>,
): void {
  runTransaction(() => {
    for (const entry of entries) {
      saveProgressChunk(entry._chunkKey, entry.data, entry._createdAtMs)
    }
  })
}
