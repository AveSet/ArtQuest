import { useEffect, useRef, useState } from 'react'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { initAutoSave } from '@/utils/autoSave'
import { checkAndGenerateDailyQuests, initializeDailyQuests } from '@/utils/dailyQuestCoordinator'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { ensureAudioContext, preloadSounds } from '@/utils/sound'
import { stopAmbientLoop, syncAmbientLoop } from '@/utils/ambientSound'
import { warmGalleryImageCache } from '@/utils/hydrateGallery'

const SOFT_RESTART_ABSENCE_DAYS = 14

export function useAppBootstrap() {
  const loadProgress = useUIStore((state) => state.loadProgress)
  const loadQuests = useQuestStore((state) => state.loadQuests)
  const autoSaveInitRef = useRef(false)
  const autoCleanupRef = useRef<(() => void) | null | undefined>(null)
  const [softRestartOpen, setSoftRestartOpen] = useState(false)

  useEffect(() => {
    Promise.all([loadQuests(), loadProgress()])
      .then(() => {
        initializeDailyQuests()
        useQuestStore.getState().ensureWeeklyChallenge()
        void useUIStore.getState().saveProgress()
        if (!autoSaveInitRef.current) {
          autoCleanupRef.current = initAutoSave()
          autoSaveInitRef.current = true
        }
        void import('@/utils/e2eTestHooks').then(({ installE2eTestHooks }) => installE2eTestHooks())
        const runWarm = () => void warmGalleryImageCache()
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(runWarm, { timeout: 8000 })
        } else {
          window.setTimeout(runWarm, 2000)
        }

        const streakState = useUIStore.getState().streakState
        if (streakState.lastActiveDate) {
          const daysSince = Math.floor(
            (Date.now() - new Date(streakState.lastActiveDate + 'T00:00:00').getTime()) / 86400000,
          )
          if (daysSince >= SOFT_RESTART_ABSENCE_DAYS) setSoftRestartOpen(true)
        }
      })

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && useUIStore.getState().isLoaded) {
        const questStore = useQuestStore.getState()
        checkAndGenerateDailyQuests()
        questStore.ensureWeeklyChallenge()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    let lastKnownDate = getLocalDateStr()
    const dateCheckInterval = window.setInterval(() => {
      if (!useUIStore.getState().isLoaded) return
      const today = getLocalDateStr()
      if (today === lastKnownDate) return
      lastKnownDate = today
      checkAndGenerateDailyQuests(today)
      useQuestStore.getState().ensureWeeklyChallenge()
    }, 60_000)

    const resumeAudio = () => {
      ensureAudioContext()
      preloadSounds()
      document.removeEventListener('pointerdown', resumeAudio)
      document.removeEventListener('keydown', resumeAudio)
    }
    document.addEventListener('pointerdown', resumeAudio, { once: true })
    document.addEventListener('keydown', resumeAudio, { once: true })

    syncAmbientLoop()
    const unsubAmbient = useUIStore.subscribe((state, prev) => {
      const a = state.settings
      const b = prev.settings
      if (
        a.ambientEnabled !== b.ambientEnabled ||
        a.ambientVolume !== b.ambientVolume ||
        a.soundEnabled !== b.soundEnabled ||
        a.reduceMotion !== b.reduceMotion
      ) {
        syncAmbientLoop()
      }
    })

    return () => {
      unsubAmbient()
      stopAmbientLoop()
      autoCleanupRef.current?.()
      autoCleanupRef.current = null
      autoSaveInitRef.current = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(dateCheckInterval)
      document.removeEventListener('pointerdown', resumeAudio)
      document.removeEventListener('keydown', resumeAudio)
    }
  }, [loadQuests, loadProgress])

  return { softRestartOpen, setSoftRestartOpen }
}
