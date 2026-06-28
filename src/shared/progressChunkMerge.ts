import { splitProgressSnapshot } from './progressSnapshot'

export const PROGRESS_CHUNK_KEYS = ['core', 'quests', 'skills', 'gallery', 'cosmetics'] as const
export type ProgressChunkKey = (typeof PROGRESS_CHUNK_KEYS)[number]

export type ProgressChunkEntry = { _chunkKey: ProgressChunkKey; data: Record<string, unknown> }

export function isProgressChunkPayload(value: unknown): value is ProgressChunkEntry {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  const key = obj._chunkKey
  if (typeof key !== 'string' || !PROGRESS_CHUNK_KEYS.includes(key as ProgressChunkKey)) return false
  return obj.data != null && typeof obj.data === 'object' && !Array.isArray(obj.data)
}

export function isProgressChunkBatchPayload(
  value: unknown,
): value is { _chunkBatch: ProgressChunkEntry[] } {
  if (!value || typeof value !== 'object') return false
  const batch = (value as { _chunkBatch?: unknown })._chunkBatch
  if (!Array.isArray(batch) || batch.length === 0) return false
  return batch.every((entry) => isProgressChunkPayload(entry))
}

/** Merge SQLite chunk rows into a single progress object (latest chunk wins per field group). */
export function mergeProgressChunks(
  chunks: Partial<Record<ProgressChunkKey, Record<string, unknown>>>,
  base?: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...(base ?? {}) }

  const core = chunks.core
  if (core) Object.assign(merged, core)

  const quests = chunks.quests
  if (quests) Object.assign(merged, quests)

  const skills = chunks.skills
  if (skills) Object.assign(merged, skills)

  const gallery = chunks.gallery
  if (gallery) Object.assign(merged, gallery)

  const cosmetics = chunks.cosmetics
  if (cosmetics?.portraitProgress != null) {
    merged.portraitProgress = cosmetics.portraitProgress
  }

  return merged
}

/** Split a full progress payload into chunk payloads (uses shared field registry). */
export function splitProgressIntoChunks(
  full: Record<string, unknown>,
): Record<ProgressChunkKey, Record<string, unknown>> {
  const chunks = splitProgressSnapshot(full)
  const core = chunks.core
  if (core.activeQuestSession === undefined) core.activeQuestSession = null
  if (core.activeSkillPracticeSession === undefined) core.activeSkillPracticeSession = null
  if (core.fundamentalsProgress === undefined) {
    core.fundamentalsProgress = { completedIds: [], lastCompletedDate: '' }
  }
  if (core.activeGoal === undefined) core.activeGoal = null
  if (core.completedGoals === undefined) core.completedGoals = []
  return chunks
}
