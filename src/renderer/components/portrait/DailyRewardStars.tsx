import { memo, type CSSProperties } from 'react'
import { useI18n } from '@/i18n'
import { DAILY_CHEST_STREAK_DAYS } from '@/utils/portraitChestProgress'
import {
  getChestCycleProgress,
  getStreakTier,
  getStreakTierColor,
} from '@/utils/streakRewardVisual'

type Props = {
  filledCount: number
  hint?: string
  streakDays?: number
}

const BEAM_PARTICLE_COUNT = 8

const DailyRewardStars = memo(function DailyRewardStars({
  filledCount,
  hint,
  streakDays = 0,
}: Props) {
  const { t } = useI18n()
  const cycle = getChestCycleProgress(filledCount)
  const lit = cycle.current
  const label = t.portrait.rewardStarsLabel
    .replace('{current}', String(lit))
    .replace('{total}', String(DAILY_CHEST_STREAK_DAYS))

  const tier = getStreakTier(streakDays)
  const tierColor = getStreakTierColor(tier)
  const beamAnchor = Math.max(14, Math.min(86, cycle.percent))
  const blockStyle = {
    '--streak-color': tierColor,
    '--beam-anchor': `${beamAnchor}%`,
  } as CSSProperties

  const streakBadgeLabel =
    streakDays > 0
      ? `🔥 ${streakDays} ${t.dashboard.dailyStreakDays}`
      : null

  return (
    <div className="daily-reward-stars-block" style={blockStyle}>
      <div className="daily-reward-stars-block__title-row">
        <span className="daily-reward-stars-block__label">{label}</span>
        {streakDays > 0 ? (
          <>
            <span className="daily-reward-stars-block__title-dot" aria-hidden>
              ·
            </span>
            <span
              className={`daily-reward-stars-block__streak-badge daily-reward-stars-block__streak-badge--${tier}`}
              title={streakBadgeLabel ?? undefined}
            >
              <span className="daily-reward-stars-block__streak-flame" aria-hidden>
                🔥
              </span>
              <span className="daily-reward-stars-block__streak-days">{streakDays}</span>
              <span className="daily-reward-stars-block__streak-suffix">
                {t.dashboard.dailyStreakDays}
              </span>
            </span>
          </>
        ) : null}
      </div>

      <div
        className="daily-reward-stars-block__cycle-wrap"
        role="progressbar"
        aria-valuenow={cycle.current}
        aria-valuemin={0}
        aria-valuemax={cycle.total}
        aria-label={
          streakBadgeLabel ? `${label} · ${streakBadgeLabel}` : label
        }
      >
        {streakDays > 0 ? (
          <div className="daily-reward-stars-block__beam" aria-hidden>
            <div className="daily-reward-stars-block__beam-glow" />
            <div className="daily-reward-stars-block__beam-core" />
            {Array.from({ length: BEAM_PARTICLE_COUNT }, (_, i) => (
              <span
                key={i}
                className="daily-reward-stars-block__beam-particle"
                style={
                  {
                    '--particle-delay': `${i * 0.32}s`,
                    '--particle-x': `${((i * 17) % 5 - 2) * 11}px`,
                    '--particle-size': `${2 + (i % 3)}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        ) : null}

        <div className="daily-reward-stars-block__cycle-track">
          <div
            className={`daily-reward-stars-block__cycle-fill daily-reward-stars-block__cycle-fill--${tier}`}
            style={{ width: `${cycle.percent}%` }}
          />
        </div>
      </div>

      {hint && <p className="daily-reward-stars-block__hint">{hint}</p>}

      <div className="daily-reward-stars" role="img" aria-label={label}>
        {Array.from({ length: DAILY_CHEST_STREAK_DAYS }, (_, i) => (
          <span
            key={i}
            className={`daily-reward-stars__star${i < lit ? ' daily-reward-stars__star--lit' : ''}${i === lit - 1 && lit > 0 ? ' daily-reward-stars__star--just-lit' : ''}`}
            aria-hidden
          >
            ✦
          </span>
        ))}
      </div>
    </div>
  )
})

export default DailyRewardStars
