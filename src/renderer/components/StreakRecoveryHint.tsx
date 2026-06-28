import { useCallback, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '@/i18n'
import { useUIStore } from '@/store/useUIStore'
import { getLocalDateStr, resolveDailyQuestSlots } from '@/utils/dailyQuests'
import { usePortraitStore } from '@/store/usePortraitStore'

/** One-time hint when the player returns after missing a day and still has streak shield protection. */
export default function StreakRecoveryHint() {
  const { t } = useI18n()
  const { isLoaded, streakState, markStreakRecoveryHintShown } = useUIStore(
    useShallow((s) => ({
      isLoaded: s.isLoaded,
      streakState: s.streakState,
      markStreakRecoveryHintShown: s.markStreakRecoveryHintShown,
    })),
  )
  const shieldAvailable = usePortraitStore((s) => s.isStreakShieldAvailable())
  const [visible, setVisible] = useState(false)

  const today = getLocalDateStr()

  useEffect(() => {
    if (!isLoaded) return
    if (streakState.streakRecoveryDueDate !== today) return
    if (streakState.streakRecoveryHintShownDate === today) return
    if (streakState.current <= 0) return
    setVisible(true)
  }, [isLoaded, streakState, today])

  const dismiss = useCallback(() => {
    setVisible(false)
    markStreakRecoveryHintShown(today)
  }, [markStreakRecoveryHintShown, today])

  if (!visible) return null

  const questCount = resolveDailyQuestSlots(streakState, today)
  const body = shieldAvailable
    ? (t.dashboard.streakRecoveryStartHint ?? '').replace('{count}', String(questCount))
    : (t.dashboard.streakRecoveryBanner ?? '').replace('{count}', String(questCount))

  return (
    <div
      className="streak-recovery-hint"
      role="status"
      aria-live="polite"
    >
      <div className="streak-recovery-hint__inner card-fantasy">
        {shieldAvailable && (
          <span className="streak-recovery-hint__icon" aria-hidden>🛡️</span>
        )}
        <p className="streak-recovery-hint__text">{body}</p>
        <button type="button" className="btn-secondary text-xs shrink-0" onClick={dismiss}>
          {t.common.gotIt ?? t.dayComplete.continue}
        </button>
      </div>
    </div>
  )
}
