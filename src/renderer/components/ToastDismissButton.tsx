import type { ReactNode } from 'react'

type ToastDismissButtonProps = {
  onDismiss: () => void
  label: string
  className?: string
}

export function ToastDismissButton({ onDismiss, label, className = '' }: ToastDismissButtonProps) {
  return (
    <button
      type="button"
      className={`absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] text-sm leading-none ${className}`}
      aria-label={label}
      onClick={onDismiss}
    >
      ×
    </button>
  )
}

export function ToastDismissWrap({ children }: { children: ReactNode }) {
  return <div className="relative">{children}</div>
}
