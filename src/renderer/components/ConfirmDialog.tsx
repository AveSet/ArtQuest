import { useEffect, useRef } from 'react'
import { useI18n } from '@/i18n'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useHotkey } from '@/hooks/useHotkey'
import { AnimatedModal } from '@/components/ui/AnimatedOverlay'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { t } = useI18n()
  const confirmRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, panelRef)
  useHotkey('Escape', onCancel, { enabled: open })

  useEffect(() => {
    if (!open) return
    const focusTarget = variant === 'danger' ? cancelRef : confirmRef
    focusTarget.current?.focus()
  }, [open, variant])

  const confirmClass =
    variant === 'danger'
      ? 'btn-primary btn-danger flex-1 py-3'
      : 'btn-primary flex-1 py-3'

  return (
    <AnimatedModal
      open={open}
      onClose={onCancel}
      panelRef={panelRef}
      role="alertdialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      panelClassName="max-w-md w-full"
    >
      <h2 id="confirm-dialog-title" className="heading-2 mb-2">
        {title}
      </h2>
      <p id="confirm-dialog-desc" className="text-fantasy mb-6">
        {message}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          ref={confirmRef}
          onClick={onConfirm}
          className={confirmClass}
        >
          {confirmLabel ?? t.common.confirm}
        </button>
        <button
          type="button"
          ref={cancelRef}
          onClick={onCancel}
          className="btn-secondary flex-1 py-3"
        >
          {cancelLabel ?? t.common.cancel}
        </button>
      </div>
    </AnimatedModal>
  )
}

export default ConfirmDialog
