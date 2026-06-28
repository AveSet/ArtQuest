import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/store/useUIStore'
import { useI18n, getCategoryLabel } from '@/i18n'
import { ToastDismissButton, ToastDismissWrap } from './ToastDismissButton'

export default function LevelUpToast() {
  const { event, clear } = useUIStore(
    useShallow((s) => ({ event: s.lastLevelUp, clear: s.clearLevelUp })),
  )
  const { t, language } = useI18n()

  useEffect(() => {
    if (!event) return
    const id = window.setTimeout(() => clear(), 4500)
    return () => window.clearTimeout(id)
  }, [event, clear])

  if (!event) return null

  const title = event.nodeTitle[language] ?? event.nodeTitle.en
  const catLabel = getCategoryLabel(event.category, language)

  return (
    <div className="toast-anchor-bottom-left toast-anchor-bottom-left-stacked max-w-xs animate-fade-in-up level-up-toast">
      <ToastDismissWrap>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="card-fantasy border border-[var(--gold-dark)] shadow-lg px-4 py-3 text-left level-up-toast-inner pr-10"
        >
          <ToastDismissButton onDismiss={clear} label={t.common.close} />
        <div className="text-xs font-semibold text-[var(--gold-primary)] mb-1">{t.levelUp.title}</div>
        <div className="text-sm font-bold text-[var(--text-heading)]">{title}</div>
        <div className="text-xs text-[var(--text-secondary)] mt-1">
          {t.levelUp.reachedLevel.replace('{level}', String(event.newLevel))}
          {catLabel ? <span className="text-[var(--text-muted)]"> · {catLabel}</span> : null}
        </div>
        </div>
      </ToastDismissWrap>
    </div>
  )
}
