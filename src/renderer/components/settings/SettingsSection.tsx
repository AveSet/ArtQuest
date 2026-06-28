import { useState, type ReactNode } from 'react'
import { playUiClick } from '@/utils/sound'

export default function SettingsSection({
  title,
  defaultOpen = true,
  collapsible = true,
  children,
  testId,
}: {
  title: string
  defaultOpen?: boolean
  collapsible?: boolean
  children: ReactNode
  testId?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (!collapsible) {
    return (
      <div className="settings-section card-fantasy" data-testid={testId}>
        <h2 className="settings-section-title mb-2">{title}</h2>
        <div className="space-y-2">{children}</div>
      </div>
    )
  }
  return (
    <div className="settings-section card-fantasy" data-testid={testId}>
      <button
        type="button"
        className="settings-section-header"
        aria-expanded={open}
        onClick={() => {
          playUiClick()
          setOpen((value) => !value)
        }}
      >
        <h2 className="settings-section-title">{title}</h2>
        <span
          className={`settings-section-chevron text-xs text-[var(--text-muted)] shrink-0 ${open ? 'settings-section-chevron--open' : 'settings-section-chevron--closed'}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      <div className={`settings-collapse ${open ? 'settings-collapse--open' : ''}`}>
        <div className="settings-collapse__inner">
          <div className="settings-collapse__content space-y-2">{children}</div>
        </div>
      </div>
    </div>
  )
}
