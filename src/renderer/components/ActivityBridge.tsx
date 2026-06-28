import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useActivityStore } from '@/store/useActivityStore'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { syncSessionTickActive } from '@/utils/sessionTickBridge'
import { syncSessionOverlayTimerOnly } from '@/utils/sessionOverlaySync'
import { syncTaskbarProgress } from '@/utils/syncTaskbarProgress'
import { useI18n } from '@/i18n'

/** Syncs foreground art-app / idle state from main process. */
export default function ActivityBridge() {
  useEffect(() => {
    const unsub = window.electronAPI?.onActivityUpdate?.((state) => {
      useActivityStore.getState().update(state)
    })
    return () => unsub?.()
  }, [])

  return null
}

/** Applies session ticks from main process (works when main window is hidden/throttled). */
export function SessionTickBridge() {
  const { t, language } = useI18n()

  useEffect(() => {
    syncSessionTickActive()
    const unsubs = [
      useQuestSessionStore.subscribe(syncSessionTickActive),
      useSkillPracticeStore.subscribe(syncSessionTickActive),
    ]
    return () => {
      for (const unsub of unsubs) unsub()
      void window.electronAPI?.setSessionTickActive?.(false)
    }
  }, [])

  useEffect(() => {
    const unsub = window.electronAPI?.onSessionTick?.(() => {
      useQuestSessionStore.getState().tick()
      if (useActivityStore.getState().shouldCountTime) {
        useSkillPracticeStore.getState().tickActiveSecond()
      }
      syncSessionOverlayTimerOnly(language, t)
      syncTaskbarProgress()
    })
    return () => unsub?.()
  }, [language, t])

  return null
}

export function NavigateBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = window.electronAPI?.onNavigate?.((route) => {
      navigate(route)
    })
    return () => unsub?.()
  }, [navigate])

  return null
}
