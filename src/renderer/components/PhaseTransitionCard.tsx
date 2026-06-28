import { useEffect } from 'react'
import { useSessionRitualStore } from '@/store/useSessionRitualStore'
import { phaseLabelForKey } from '@/utils/phaseTransitionLabels'
import { useI18n } from '@/i18n'
import { getSessionRitual } from '@/i18n/sessionRitualCopy'
import { playSessionSound } from '@/utils/sound'

const DISPLAY_MS = 4000

export default function PhaseTransitionCard() {
  const { t } = useI18n()
  const show = useSessionRitualStore((s) => s.showPhaseTransition)
  const key = useSessionRitualStore((s) => s.phaseTransitionKey)
  const hide = useSessionRitualStore((s) => s.hidePhaseTransitionBanner)

  const label = key ? phaseLabelForKey(key, getSessionRitual(t) as Record<string, string>) : ''

  useEffect(() => {
    if (!show) return
    playSessionSound('phaseComplete')
    const timer = window.setTimeout(() => hide(), DISPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [show, hide])

  if (!show || !label) return null

  return (
    <div
      className="phase-transition-card fixed inset-x-0 top-20 z-[250] flex justify-center pointer-events-none px-4"
      role="status"
      aria-live="polite"
    >
      <div className="phase-transition-card__panel phase-transition-card__panel--enter card-fantasy px-6 py-4 max-w-md text-center shadow-lg">
        <p className="phase-transition-card__check text-sm mb-1" aria-hidden="true">
          ✓
        </p>
        <p className="font-semibold text-[var(--text-primary)]">{label}</p>
      </div>
    </div>
  )
}
