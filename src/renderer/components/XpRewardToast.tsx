import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore } from '@/store/useQuestStore'
import { useI18n, getCategoryLabel } from '@/i18n'
import { useToastStack } from './toastStackContext'
import { ToastDismissButton, ToastDismissWrap } from './ToastDismissButton'

export default function XpRewardToast() {
  const { reward, clear } = useQuestStore(
    useShallow((s) => ({
      reward: s.lastCompletionReward,
      clear: s.clearLastCompletionReward,
    })),
  )
  const { t, language } = useI18n()
  const toastStack = useToastStack()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!reward) return
    const id = window.setTimeout(() => clear(), 7000)
    return () => window.clearTimeout(id)
  }, [reward, clear])

  useEffect(() => {
    const setXpReserve = toastStack?.setXpReserve
    if (!setXpReserve) return

    if (!reward) {
      setXpReserve(0)
      return
    }

    const el = rootRef.current
    if (!el) {
      setXpReserve(0)
      return
    }

    const update = () => setXpReserve(el.offsetHeight)
    update()

    if (typeof ResizeObserver === 'undefined') {
      return () => setXpReserve(0)
    }

    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      setXpReserve(0)
    }
  }, [reward, toastStack])

  if (!reward) return null

  const catLabel =
    reward.category != null && reward.category !== ''
      ? getCategoryLabel(reward.category, language)
      : null

  return (
    <div ref={rootRef} className="toast-anchor-xp max-w-xs animate-fade-in-up toast-xp-reward" style={{ zIndex: 'var(--z-toast)' }}>
      <ToastDismissWrap>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="card-fantasy border border-[var(--border-primary)] shadow-lg px-3 py-2 text-left pr-8"
        >
          <ToastDismissButton onDismiss={clear} label={t.common.close} />
        <div className="text-xs font-semibold text-[var(--text-heading)] mb-1">{t.rewards.title}</div>
        <div className="space-y-0.5 text-xs">
          {reward.questXp > 0 && (
            <div className="text-[var(--text-secondary)]">
              <span className="text-[var(--accent-hover)] font-bold">+{reward.questXp}</span> {t.rewards.questXp}
            </div>
          )}
          {reward.skillXp > 0 && (
            <div className="text-[var(--text-secondary)]">
              <span className="text-status-success font-bold">+{reward.skillXp}</span> {t.rewards.skillXp}
              {catLabel && <span className="text-[var(--text-muted)]"> ({catLabel})</span>}
            </div>
          )}
          {reward.bonusDailyXp != null && reward.bonusDailyXp > 0 && (
            <div className="text-[var(--text-secondary)]">
              <span className="text-status-success font-bold">+{reward.bonusDailyXp}</span> {t.rewards.dailyBonusLine}
            </div>
          )}
          {reward.bonusWeeklyXp != null && reward.bonusWeeklyXp > 0 && (
            <div className="text-[var(--text-secondary)]">
              <span className="text-amber-400 font-bold">+{reward.bonusWeeklyXp}</span> {t.rewards.weeklyBonusLine}
            </div>
          )}
        </div>
        </div>
      </ToastDismissWrap>
    </div>
  )
}
