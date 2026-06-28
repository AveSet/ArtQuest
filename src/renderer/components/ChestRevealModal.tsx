import { useCallback, useRef, useEffect } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useAnimatedPresence } from '@/hooks/useAnimatedPresence'
import { useI18n } from '@/i18n'
import { getSessionRitual } from '@/i18n/sessionRitualCopy'
import { playSessionSound } from '@/utils/sound'
import { DAILY_CHEST_STREAK_DAYS } from '@/utils/portraitChestProgress'

type Props = {
  open: boolean
  onClose: () => void
}

export default function ChestRevealModal({ open, onClose }: Props) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const { mounted, visible } = useAnimatedPresence(open)
  useFocusTrap(open, panelRef)

  useEffect(() => {
    if (open) playSessionSound('chestReveal')
  }, [open])

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  if (!mounted) return null

  const ritual = getSessionRitual(t)

  return (
    <div
      className={`chest-reveal-overlay motion-overlay ${visible ? 'motion-overlay--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chest-reveal-title"
      onClick={handleBackdrop}
    >
      <div className="chest-reveal-overlay__burst" aria-hidden />
      <div
        ref={panelRef}
        className={`chest-reveal-modal motion-panel card-fantasy max-w-sm w-full mx-4 p-6 text-center space-y-4 ${visible ? 'motion-panel--visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl animate-celebrate" aria-hidden>
          ✦
        </div>
        <h2 id="chest-reveal-title" className="heading-3">
          {ritual.chestTitle}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {ritual.chestBody.replace('{days}', String(DAILY_CHEST_STREAK_DAYS))}
        </p>
        <button type="button" onClick={onClose} className="btn-primary w-full py-2">
          {ritual.chestClaim}
        </button>
      </div>
    </div>
  )
}
