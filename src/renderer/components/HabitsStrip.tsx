import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '@/i18n'
import { useUIStore } from '@/store/useUIStore'
import { useQuestStore } from '@/store/useQuestStore'
import { usePortraitStore } from '@/store/usePortraitStore'
import { DAILY_CHEST_STREAK_DAYS } from '@/utils/portraitChestProgress'
import { getIsoWeekKey, isWeeklyChallengeComplete } from '@/utils/weeklyChallenge'
import { isStreakShieldAvailable as canUseStreakShield } from '@/utils/streakShield'
import { getLocalDateStr } from '@/utils/dailyQuests'

export default function HabitsStrip() {
  const { t } = useI18n()
  const streakState = useUIStore((s) => s.streakState)
  const { dailyChestStreak, streakShieldUsedMonth } = usePortraitStore(
    useShallow((s) => ({
      dailyChestStreak: s.dailyChestStreak,
      streakShieldUsedMonth: s.streakShieldUsedMonth,
    })),
  )
  const shieldAvailable = useMemo(
    () => canUseStreakShield(streakShieldUsedMonth, getLocalDateStr()),
    [streakShieldUsedMonth],
  )
  const { weekKey, questId, completedWeek, completedQuests } = useQuestStore(
    useShallow((s) => ({
      weekKey: s.weeklyChallengeWeek,
      questId: s.weeklyChallengeQuestId,
      completedWeek: s.weeklyChallengeCompletedWeek,
      completedQuests: s.completedQuests,
    })),
  )

  const weeklyDone = useMemo(
    () => isWeeklyChallengeComplete(weekKey || getIsoWeekKey(), completedWeek, questId, completedQuests),
    [weekKey, completedWeek, questId, completedQuests],
  )

  return (
    <section className="habits-strip card-fantasy" aria-labelledby="habits-strip-title">
      <h2 id="habits-strip-title" className="heading-2 text-base mb-3">
        {t.stats.habitsTitle}
      </h2>
      <div className="habits-strip__grid">
        <div className="habits-strip__tile">
          <span className="habits-strip__value">{streakState.current}</span>
          <span className="habits-strip__label">{t.stats.dailyStreak}</span>
          <span className="habits-strip__meta">
            {t.stats.bestStreak.replace('{days}', String(streakState.longest))}
          </span>
        </div>
        <div className="habits-strip__tile">
          <span className="habits-strip__value">
            {dailyChestStreak}/{DAILY_CHEST_STREAK_DAYS}
          </span>
          <span className="habits-strip__label">{t.stats.chestProgress}</span>
        </div>
        <div className="habits-strip__tile">
          <span className="habits-strip__value">{weeklyDone ? '✓' : '…'}</span>
          <span className="habits-strip__label">{t.stats.weeklyChallengeStatus}</span>
          <span className="habits-strip__meta">
            {weeklyDone ? t.stats.weeklyChallengeDone : t.stats.weeklyChallengePending}
          </span>
        </div>
        <div className="habits-strip__tile">
          <span className="habits-strip__value">{shieldAvailable ? '🛡️' : '—'}</span>
          <span className="habits-strip__label">{t.portrait.streakShieldLabel}</span>
          <span className="habits-strip__meta">
            {shieldAvailable ? t.portrait.streakShieldAvailable : t.portrait.streakShieldUsedThisMonth}
          </span>
        </div>
      </div>
    </section>
  )
}
