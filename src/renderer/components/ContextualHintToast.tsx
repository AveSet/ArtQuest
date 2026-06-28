import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'
import { getPendingHints, markHintShown, type ContextualHint } from '@/utils/contextualHints'

export default function ContextualHintToast() {
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const [current, setCurrent] = useState<ContextualHint | null>(null)

  useEffect(() => {
    const hints = getPendingHints()
    if (hints.length > 0) {
      setCurrent(hints[0]!)
    }
  }, [])

  const dismiss = useCallback(() => {
    if (current) markHintShown(current.id)
    setCurrent(null)
  }, [current])

  if (!current) return null

  const lang = language
  const hasAction = current.action && current.action.label[lang]

  return (
    <div
      className="toast-anchor-bottom-left-hint max-w-xs animate-fade-in-up"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="card-fantasy border border-[var(--accent)]/30 shadow-lg px-4 py-3 text-sm">
        <p className="text-[var(--text-primary)] mb-2">{current.content[lang]}</p>
        <div className="flex gap-2">
          {hasAction && (
            <button
              type="button"
              className="btn-primary text-xs py-1 px-3"
              onClick={() => {
                markHintShown(current.id)
                navigate(current.action!.route)
                setCurrent(null)
              }}
            >
              {current.action!.label[lang]}
            </button>
          )}
          {current.dismissible && (
            <button
              type="button"
              className="btn-secondary text-xs py-1 px-3"
              onClick={dismiss}
            >
              {t.common.gotIt ?? 'Got it'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
