import {
  parseProgressPayload,
  type ProgressPayload,
} from '../../shared/progressSchema'
import { saveProgressToBrowser } from '@/utils/browserProgress'
import { devLog } from '@/utils/devLog'
import { logProgressPayloadFootprint } from '@/utils/progressPayloadLog'
import { buildProgressPayloadFromStores } from '@/utils/progressChunkBuilders'
import { useQuestStore } from '@/store/useQuestStore'
import { enqueueSave } from '@/utils/saveQueue'
import { clearDirtyChunks } from '@/utils/incrementalSave'

export type SaveErrorCode = 'save_failed' | 'storage_full' | 'invalid_data' | 'reset_failed'
export type ProgressSaveResult = { ok: true } | { ok: false; error: SaveErrorCode }

/** Aggregate all store slices into a single progress payload for persistence. */
export function buildProgressData(): ProgressPayload {
  const result = buildProgressPayloadFromStores()

  const questState = useQuestStore.getState()
  devLog('[buildProgressData]', {
    completedToday: questState.completedToday,
    lastDailyQuestDate: questState.lastDailyQuestDate,
  })
  const parsed = parseProgressPayload(result)
  if (!parsed.success) {
    throw new Error('Built progress payload failed schema validation: ' + parsed.error.message)
  }
  return parsed.data
}

export async function saveProgressAsync(): Promise<ProgressSaveResult> {
  return enqueueSave(async (): Promise<ProgressSaveResult> => {
    try {
      const progressData = buildProgressData()
      logProgressPayloadFootprint('async', progressData)

      if (window.electronAPI?.saveProgress) {
        const result = await window.electronAPI.saveProgress(JSON.stringify(progressData))
        if (result && !result.success) {
          console.error('Failed to save progress:', result.error)
          return { ok: false, error: 'save_failed' }
        }
        clearDirtyChunks()
        return { ok: true }
      }
      if (!saveProgressToBrowser(progressData)) {
        return { ok: false, error: 'storage_full' }
      }
      clearDirtyChunks()
      return { ok: true }
    } catch (error) {
      console.error('Failed to save progress:', error)
      return { ok: false, error: 'save_failed' }
    }
  })
}

/** Blocking save — use only for beforeunload / app quit flush. */
export function saveProgressSync(): ProgressSaveResult {
  try {
    const progressData = buildProgressData()
    logProgressPayloadFootprint('sync', progressData)
    const api = window.electronAPI
    if (api?.saveProgressSync) {
      const result = api.saveProgressSync(JSON.stringify(progressData))
      if (result && !result.success) {
        console.error('Failed to save progress (sync):', result.error)
        return { ok: false, error: 'save_failed' }
      }
      return { ok: true }
    }
    if (!saveProgressToBrowser(progressData)) {
      return { ok: false, error: 'storage_full' }
    }
    return { ok: true }
  } catch (error) {
    console.error('Failed to save progress (sync):', error)
    return { ok: false, error: 'save_failed' }
  }
}
