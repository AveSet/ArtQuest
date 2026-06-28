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

export function saveProgressChunk(chunkKey: string, data: Record<string, unknown>): void {
  const updatedAt = nowIso()
  getDb()
    .prepare(
      `INSERT INTO progress_chunk (chunk_key, payload_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(chunk_key) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`,
    )
    .run(chunkKey, JSON.stringify(data), updatedAt)
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

export function syncProgressChunksFromFull(payload: Record<string, unknown>): void {
  const chunks = splitProgressIntoChunks(payload)
  runTransaction(() => {
    for (const [key, data] of Object.entries(chunks)) {
      saveProgressChunk(key, data)
    }
  })
}
