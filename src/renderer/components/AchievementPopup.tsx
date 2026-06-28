import { useState, useEffect, useRef, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import type { Achievement } from '@/store/models'
import { playAchievementUnlock } from '@/utils/sound'

const DISPLAY_DURATION_FULL = 4000
const DISPLAY_DURATION_REDUCED = 2600
const CHAIN_GAP_MS = 300
const CHAIN_GAP_REDUCED_MS = 120

const AchievementPopup = () => {
  const { achievementQueue, shiftNextAchievement, reduceMotion } = useUIStore(
    useShallow((state) => ({
      achievementQueue: state.achievementQueue,
      shiftNextAchievement: state.shiftNextAchievement,
      reduceMotion: state.settings.reduceMotion,
    })),
  )
  const { t, language } = useI18n()
  const displayDuration = reduceMotion ? DISPLAY_DURATION_REDUCED : DISPLAY_DURATION_FULL
  const chainGap = reduceMotion ? CHAIN_GAP_REDUCED_MS : CHAIN_GAP_MS
  const [current, setCurrent] = useState<Achievement | null>(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAnimatingRef = useRef(false)
  const lastSoundAchievementIdRef = useRef<string | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (chainTimerRef.current != null) {
      clearTimeout(chainTimerRef.current)
      chainTimerRef.current = null
    }
  }, [])

  const showNext = useCallback(() => {
    if (isAnimatingRef.current) return

    const queue = useUIStore.getState().achievementQueue
    if (queue.length === 0) {
      setCurrent(null)
      setVisible(false)
      isAnimatingRef.current = false
      return
    }

    isAnimatingRef.current = true
    const shown = queue[0]!
    setCurrent(shown)
    shiftNextAchievement()
    setVisible(true)
    if (lastSoundAchievementIdRef.current !== shown.id) {
      lastSoundAchievementIdRef.current = shown.id
      const lastLog = useQuestStore.getState().questCompletionLogs.at(-1)
      playAchievementUnlock(lastLog?.category)
    }

    clearTimers()
    timerRef.current = setTimeout(() => {
      setVisible(false)
      chainTimerRef.current = setTimeout(() => {
        chainTimerRef.current = null
        setCurrent(null)
        isAnimatingRef.current = false
        if (useUIStore.getState().achievementQueue.length > 0) {
          showNext()
        }
      }, chainGap)
    }, displayDuration)
  }, [shiftNextAchievement, clearTimers, displayDuration, chainGap])

  useEffect(() => {
    if (achievementQueue.length > 0 && !isAnimatingRef.current && current === null) {
      showNext()
    }
  }, [achievementQueue, current, showNext])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const handleDismiss = () => {
    clearTimers()
    setVisible(false)
    chainTimerRef.current = setTimeout(() => {
      chainTimerRef.current = null
      setCurrent(null)
      isAnimatingRef.current = false
      showNext()
    }, chainGap)
  }

  if (!current) return null

  const titleMap = current.title as Record<string, string>
  const descMap = current.description as Record<string, string>
  const title = titleMap[language] || titleMap.en || ''
  const desc = descMap[language] || descMap.en || ''

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="toast-anchor-achievement z-[210]">
    <button
      type="button"
      onClick={handleDismiss}
      className={`w-full text-left border-0 bg-transparent p-0 cursor-pointer transition-all ease-out achievement-popup-anchor ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{
        transitionDuration: reduceMotion
          ? 'var(--motion-duration-fast, 120ms)'
          : 'var(--motion-duration-med, 260ms)',
      }}
      aria-label={`${t.achievements.achievementUnlocked}. ${title}. ${desc}`}
    >
      <div
        className={`card-fantasy px-5 py-4 shadow-lg border border-[var(--gold-primary)] hover:border-[var(--accent)] transition-colors ${
          !reduceMotion ? 'achievement-popup-fx' : ''
        }`}
      >
        <div className="text-xs font-bold text-[var(--gold-light)] uppercase tracking-widest mb-2">
          {t.achievements.achievementUnlocked}
        </div>
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0" aria-hidden>
            {current.icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[var(--text-primary)] leading-tight mb-1">{title}</div>
            <div className="text-xs text-[var(--text-secondary)] leading-snug">{desc}</div>
          </div>
        </div>
      </div>
    </button>
    </div>
  )
}

export default AchievementPopup
