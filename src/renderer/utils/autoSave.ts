import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useUIStore } from '@/store/useUIStore'
import { useQuestSessionStore, type QuestSession } from '@/store/useQuestSessionStore'
import { useSkillPracticeStore, type SkillPracticeSession } from '@/store/useSkillPracticeStore'
import { usePortraitStore } from '@/store/usePortraitStore'
import { markChunkDirty, saveDirtyChunks, clearDirtyChunks } from '@/utils/incrementalSave'
import { questStoreSaveFingerprint } from '@/utils/questStoreSaveSlice'
import { skillStoreSaveFingerprint } from '@/utils/skillStoreSaveSlice'
import { uiStoreSaveFingerprint } from '@/utils/uiStoreSaveSlice'
import { portraitStoreSaveFingerprint } from '@/utils/portraitStoreSaveSlice'

const SAVE_DELAY_MS = 2000
const FULL_SAVE_EVERY_N_INCREMENTAL = 24
let saveTimer: ReturnType<typeof setTimeout> | null = null
let isInitialized = false
let isLoadingBatch = false
let incrementalSaveCount = 0

export function setBatchLoading(loading: boolean) {
  isLoadingBatch = loading
  if (!loading) {
    incrementalSaveCount = 0
  }
}

export function resetSaveFingerprint(): void {
  incrementalSaveCount = 0
}

/** @internal Vitest only */
export function resetAutoSaveForTests(): void {
  isInitialized = false
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
}

function markQuestChunksDirty(): void {
  // Quest store owns fields in both `quests`/`gallery` and `core` (daily/weekly/fundamentals).
  markChunkDirty('core')
  markChunkDirty('quests')
  markChunkDirty('gallery')
}

function scheduleSave() {
  if (isLoadingBatch) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void (async () => {
      incrementalSaveCount += 1
      const useFullSave = incrementalSaveCount % FULL_SAVE_EVERY_N_INCREMENTAL === 0
      try {
        if (useFullSave) {
          await useUIStore.getState().saveProgress()
          clearDirtyChunks()
        } else {
          const saved = await saveDirtyChunks()
          if (!saved) {
            await useUIStore.getState().saveProgress()
            clearDirtyChunks()
          }
        }
      } catch (err) {
        console.error('[autoSave] save failed:', err)
      } finally {
        saveTimer = null
      }
    })()
  }, SAVE_DELAY_MS)
}

export function initAutoSave() {
  if (isInitialized) return
  isInitialized = true

  let lastQuestSaveFingerprint = questStoreSaveFingerprint(useQuestStore.getState())
  const unsub1 = useQuestStore.subscribe((state) => {
    const next = questStoreSaveFingerprint(state)
    if (next === lastQuestSaveFingerprint) return
    lastQuestSaveFingerprint = next
    markQuestChunksDirty()
    scheduleSave()
  })
  let lastSkillSaveFingerprint = skillStoreSaveFingerprint(useSkillStore.getState())
  const unsub2 = useSkillStore.subscribe((state) => {
    const next = skillStoreSaveFingerprint(state)
    if (next === lastSkillSaveFingerprint) return
    lastSkillSaveFingerprint = next
    markChunkDirty('skills')
    scheduleSave()
  })
  let lastUiSaveFingerprint = uiStoreSaveFingerprint(useUIStore.getState())
  const unsub3 = useUIStore.subscribe((state) => {
    const next = uiStoreSaveFingerprint(state)
    if (next === lastUiSaveFingerprint) return
    lastUiSaveFingerprint = next
    markChunkDirty('core')
    scheduleSave()
  })
  let lastSessionPersistKey = ''
  const sessionPersistKey = (session: QuestSession | null): string => {
    if (!session) return ''
    return [
      session.questId,
      session.isRunning,
      session.isExpired,
      session.phasesComplete,
      session.currentPhaseIndex,
      session.graceExpired,
    ].join('|')
  }
  const unsub4 = useQuestSessionStore.subscribe((state) => {
    const key = sessionPersistKey(state.session)
    if (key === lastSessionPersistKey) return
    lastSessionPersistKey = key
    markChunkDirty('core')
    scheduleSave()
  })
  let lastSkillPracticePersistKey = ''
  const skillPracticePersistKey = (
    session: SkillPracticeSession | null,
    panelMinimized: boolean,
  ): string => {
    if (!session) return ''
    return [session.nodeId, session.category, session.startedAtMs, panelMinimized].join('|')
  }
  const unsub5 = useSkillPracticeStore.subscribe((state) => {
    const key = skillPracticePersistKey(state.session, state.panelMinimized)
    if (key === lastSkillPracticePersistKey) return
    lastSkillPracticePersistKey = key
    markChunkDirty('core')
    scheduleSave()
  })
  let lastPortraitSaveFingerprint = portraitStoreSaveFingerprint(usePortraitStore.getState())
  const unsub6 = usePortraitStore.subscribe((state) => {
    const next = portraitStoreSaveFingerprint(state)
    if (next === lastPortraitSaveFingerprint) return
    lastPortraitSaveFingerprint = next
    markChunkDirty('cosmetics')
    scheduleSave()
  })

  const flushSyncBeforeUnload = () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    try {
      useUIStore.getState().saveProgressSync()
    } catch (err) {
      console.error('[autoSave] unload flush failed:', err)
    }
  }

  /** Blocking full save used on app quit — ensures debounced dirty state is persisted. */
  const flushOnQuit = () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    try {
      useUIStore.getState().saveProgressSync()
    } catch (err) {
      console.error('[autoSave] quit flush failed:', err)
    }
  }

  const flushOnUnload = () => {
    flushSyncBeforeUnload()
  }
  window.addEventListener('beforeunload', flushOnUnload)

  const flushOnHidden = () => {
    if (document.hidden) flushSyncBeforeUnload()
  }
  document.addEventListener('visibilitychange', flushOnHidden)

  let detachBeforeQuit: (() => void) | null = null
  if (window.electronAPI?.onAppBeforeQuit) {
    detachBeforeQuit = window.electronAPI.onAppBeforeQuit(() => {
      flushOnQuit()
    })
  }

  return () => {
    unsub1()
    unsub2()
    unsub3()
    unsub4()
    unsub5()
    unsub6()
    window.removeEventListener('beforeunload', flushOnUnload)
    document.removeEventListener('visibilitychange', flushOnHidden)
    detachBeforeQuit?.()
    isInitialized = false
  }
}
