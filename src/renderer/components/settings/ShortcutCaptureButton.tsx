import { useCallback, useEffect, useRef, useState } from 'react'
import {
  formatShortcutDisplay,
  keyboardEventToAccelerator,
} from '@/utils/questSessionShortcutCapture'

type Props = {
  value: string
  listeningLabel: string
  captureLabel: string
  onCapture: (accelerator: string) => void
  onCancel?: () => void
}

export default function ShortcutCaptureButton({
  value,
  listeningLabel,
  captureLabel,
  onCapture,
  onCancel,
}: Props) {
  const [listening, setListening] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const stopListening = useCallback(() => {
    setListening(false)
  }, [])

  useEffect(() => {
    if (!listening) return

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        stopListening()
        onCancel?.()
        return
      }

      const accelerator = keyboardEventToAccelerator(event)
      if (!accelerator) return

      onCapture(accelerator)
      stopListening()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [listening, onCapture, onCancel, stopListening])

  useEffect(() => {
    if (listening) buttonRef.current?.focus()
  }, [listening])

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`min-w-[8rem] rounded-lg border px-3 py-2 text-sm font-mono text-left transition-colors ${
        listening
          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-hover)] ring-2 ring-[var(--accent)]/40'
          : 'border-[var(--border-secondary)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent)]/50'
      }`}
      aria-pressed={listening}
      onClick={() => setListening((v) => !v)}
      onBlur={() => {
        window.setTimeout(() => stopListening(), 120)
      }}
    >
      {listening ? listeningLabel : value ? formatShortcutDisplay(value) : captureLabel}
    </button>
  )
}
