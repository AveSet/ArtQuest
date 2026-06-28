import { ART_APP_DEFINITIONS, type ArtAppId } from '../../../shared/artApps'
import { useI18n } from '@/i18n'
import { playUiClick } from '@/utils/sound'

type Props = {
  tracked: Set<ArtAppId>
  onChange: (next: ArtAppId[]) => void
  disabled?: boolean
}

export default function ArtAppPicker({ tracked, onChange, disabled = false }: Props) {
  const { language } = useI18n()

  const toggleApp = (id: ArtAppId) => {
    if (disabled) return
    playUiClick()
    const next = new Set(tracked)
    if (next.has(id)) {
      if (next.size <= 1) return
      next.delete(id)
    } else {
      next.add(id)
    }
    onChange([...next])
  }

  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {ART_APP_DEFINITIONS.map((app) => {
        const active = tracked.has(app.id)
        return (
          <button
            key={app.id}
            type="button"
            disabled={disabled}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent-hover)]'
                : 'border-[var(--border-secondary)] text-[var(--text-muted)]'
            } disabled:opacity-50`}
            onClick={() => toggleApp(app.id)}
          >
            {language === 'ru' ? app.labelRu : app.labelEn}
          </button>
        )
      })}
    </div>
  )
}
