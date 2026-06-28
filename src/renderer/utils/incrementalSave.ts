import { useUIStore } from '@/store/useUIStore'
import { CURRENT_PROGRESS_SCHEMA_VERSION, parseProgressPayload } from '../../shared/progressSchema'
import { mergeProgressChunks, type ProgressChunkKey } from '../../shared/progressChunkMerge'
import { buildProgressChunkFromStores } from '@/utils/progressChunkBuilders'
import { saveProgressToBrowser, loadProgressFromBrowser } from '@/utils/browserProgress'

export type ChunkKey = ProgressChunkKey

const dirtyChunks = new Set<ChunkKey>()
const dirtyChunkVersions = new Map<ChunkKey, number>()

export function markChunkDirty(chunk: ChunkKey): void {
  dirtyChunks.add(chunk)
  dirtyChunkVersions.set(chunk, (dirtyChunkVersions.get(chunk) ?? 0) + 1)
}

export function clearDirtyChunks(): void {
  dirtyChunks.clear()
  dirtyChunkVersions.clear()
}

export function getDirtyChunks(): ChunkKey[] {
  return [...dirtyChunks]
}

function buildChunk(chunk: ChunkKey): Record<string, unknown> {
  return buildProgressChunkFromStores(chunk)
}

function buildChunkPayload(chunk: ChunkKey, data: Record<string, unknown>): string {
  return JSON.stringify({
    _chunkKey: chunk,
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    chunkVersion: 1,
    _createdAtMs: Date.now(),
    data,
  })
}

function reportChunkSaveError(): void {
  useUIStore.setState({ saveError: 'save_failed' })
}

export async function saveDirtyChunks(): Promise<boolean> {
  const chunks = getDirtyChunks()
  if (chunks.length === 0) return false
  const saveVersions = new Map(chunks.map((chunk) => [chunk, dirtyChunkVersions.get(chunk) ?? 0]))
  const createdAtMs = Date.now()

  const api = window.electronAPI
  if (api?.saveProgress) {
    const batch: Array<{ _chunkKey: ChunkKey; data: Record<string, unknown>; _createdAtMs: number }> = []
    for (const chunk of chunks) {
      batch.push({ _chunkKey: chunk, data: buildChunk(chunk), _createdAtMs: createdAtMs })
    }
    if (batch.length === 0) return false

    const payload =
      batch.length === 1
        ? buildChunkPayload(batch[0]!._chunkKey, batch[0]!.data)
        : JSON.stringify({
            _chunkBatch: batch,
            schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
            chunkVersion: 1,
          })

    const result = await api.saveProgress(payload)
    if (result && !result.success) {
      console.error('[incrementalSave] chunk batch failed:', result.error)
      reportChunkSaveError()
      return false
    }
    for (const chunk of chunks) {
      if ((dirtyChunkVersions.get(chunk) ?? 0) === saveVersions.get(chunk)) {
        dirtyChunks.delete(chunk)
        dirtyChunkVersions.delete(chunk)
      }
    }
    useUIStore.setState({ saveError: null })
    return true
  }

  const partial: Partial<Record<ChunkKey, Record<string, unknown>>> = {}
  for (const chunk of chunks) {
    partial[chunk] = buildChunk(chunk)
  }
  const base = loadProgressFromBrowser() ?? {}
  const merged = mergeProgressChunks(partial, base)
  const checked = parseProgressPayload(merged)
  if (!checked.success) {
    useUIStore.setState({ saveError: 'invalid_data' })
    return false
  }
  if (!saveProgressToBrowser(checked.data)) {
    useUIStore.setState({ saveError: 'storage_full' })
    return false
  }
  for (const chunk of chunks) {
    if ((dirtyChunkVersions.get(chunk) ?? 0) === saveVersions.get(chunk)) {
      dirtyChunks.delete(chunk)
      dirtyChunkVersions.delete(chunk)
    }
  }
  useUIStore.setState({ saveError: null })
  return true
}
