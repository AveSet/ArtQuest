import { useCallback, useRef, useEffect } from 'react'
import { useI18n } from '@/i18n'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useAnimatedPresence } from '@/hooks/useAnimatedPresence'
import { DAILY_CHEST_STREAK_DAYS } from '@/utils/portraitChestProgress'
import { playSessionSound } from '@/utils/sound'

type Props = {
  open: boolean
  onClose: () => void
  streakDays: number
  bonusXp?: number
  starsFilled: number
  usedShield?: boolean
}

export default function DayCompleteModal({
  open,
  onClose,
  streakDays,
  bonusXp,
  starsFilled,
  usedShield,
}: Props) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const { mounted, visible } = useAnimatedPresence(open)
  useFocusTrap(open, panelRef)

  useEffect(() => {
    if (!open) return
    playSessionSound('dayClose')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  if (!mounted) return null

  return (
    <div
      className={`day-complete-overlay motion-overlay ${visible ? 'motion-overlay--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-complete-title"
      onClick={handleBackdrop}
    >
      <div
        ref={panelRef}
        className={`day-complete-modal motion-panel ${visible ? 'motion-panel--visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="day-complete-modal__burst" aria-hidden />
        <h2 id="day-complete-title" className="day-complete-modal__title">
          {t.dayComplete.title}
        </h2>
        <p className="day-complete-modal__subtitle">{t.dashboard.todayCompleteBody}</p>

        <ul className="day-complete-modal__stats">
          <li>
            <span className="day-complete-modal__stat-icon">🔥</span>
            <span>
              {t.dayComplete.streak.replace('{days}', String(streakDays))}
            </span>
          </li>
          {bonusXp != null && bonusXp > 0 && (
            <li>
              <span className="day-complete-modal__stat-icon">⭐</span>
              <span>{t.dayComplete.bonus.replace('{xp}', String(bonusXp))}</span>
            </li>
          )}
          <li>
            <span className="day-complete-modal__stat-icon">✦</span>
            <span>
              {t.dayComplete.star
                .replace('{current}', String(starsFilled))
                .replace('{total}', String(DAILY_CHEST_STREAK_DAYS))}
            </span>
          </li>
          {usedShield && (
            <li>
              <span className="day-complete-modal__stat-icon">🛡️</span>
              <span>{t.portrait.streakShieldUsed}</span>
            </li>
          )}
        </ul>

        <button type="button" className="btn-primary w-full" onClick={onClose}>
          {t.dayComplete.continue}
        </button>
      </div>
    </div>
  )
}
