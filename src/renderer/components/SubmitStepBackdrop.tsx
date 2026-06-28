import type { ReactNode } from 'react'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/i18n'
import { useFocusTrap } from '@/hooks/useFocusTrap'

type Props = {
  open: boolean
  onDismiss: () => void
  children: ReactNode
}

/** Full-screen dim layer centered in the viewport (portal avoids transform ancestors). */
export default function SubmitStepBackdrop({ open, onDismiss, children }: Props) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, panelRef)
  if (!open) return null

  return createPortal(
    <div className="submit-step-backdrop submit-step-backdrop--open fixed inset-0 z-[140] overflow-y-auto p-4">
      <button
        type="button"
        className="submit-step-backdrop__scrim fixed inset-0 bg-black/55 border-0 cursor-default"
        aria-label={t.common.back}
        onClick={onDismiss}
      />
      <div className="relative z-[141] flex min-h-full items-center justify-center py-6 pointer-events-none">
        <div
          ref={panelRef}
          className="submit-step-backdrop__panel submit-step-backdrop__panel--enter pointer-events-auto w-full max-w-4xl max-h-[min(92vh,880px)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
