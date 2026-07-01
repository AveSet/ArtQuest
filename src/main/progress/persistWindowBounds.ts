import { pickProgressChunkFields } from '../../shared/progressSnapshot'
import {
  loadProgressSnapshot,
  rebuildProgressFromChunks,
  saveProgressChunk,
} from '../db/progressRepository'
import { appState } from '../app/appState'
import { mergePersistedWindowBounds, type PersistedWindowBounds } from '../ipc/windowBoundsHandlers'

/** Merge in-memory window bounds into the core progress chunk (SQLite). */
export function persistWindowBoundsInProgress(bounds?: PersistedWindowBounds): void {
  const partial = bounds ?? appState.persistedWindowBounds
  if (!partial.main && !partial.overlay && !partial.reference) return

  const merged = rebuildProgressFromChunks() ?? loadProgressSnapshot()
  if (!merged) return

  const settings =
    merged.settings && typeof merged.settings === 'object' && !Array.isArray(merged.settings)
      ? { ...(merged.settings as Record<string, unknown>) }
      : {}

  const existing =
    settings.windowBounds &&
    typeof settings.windowBounds === 'object' &&
    !Array.isArray(settings.windowBounds)
      ? (settings.windowBounds as PersistedWindowBounds)
      : {}

  settings.windowBounds = mergePersistedWindowBounds(existing, partial)
  merged.settings = settings

  const coreChunk = pickProgressChunkFields('core', merged)
  saveProgressChunk('core', coreChunk)
}
