import { ART_APP_DEFINITIONS, type ArtAppId } from '../../../shared/artApps'
import { useI18n } from '@/i18n'
import { playUiClick } from '@/utils/sound'

type Props = {
  tracked: Set<ArtAppId>
  onChange: (next: ArtAppId[]) => void
  onPickCustom?: () => void
  disabled?: boolean
}

export default function ArtAppPicker({ tracked, onChange, onPickCustom, disabled = false }: Props) {
  const { language, t } = useI18n()
  const customLabel = t.settings.artAppsCustom ?? (language === 'ru' ? 'Другое' : 'Other')

  const toggleApp = (id: ArtAppId) => {
    if (disabled) return
    if (id === 'custom') {
      if (tracked.has('custom')) {
        if (tracked.size <= 1) return
        playUiClick()
        const next = new Set(tracked)
        next.delete('custom')
        onChange([...next])
      } else {
        onPickCustom?.()
      }
      return
    }
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
      <button
        type="button"
        disabled={disabled}
        data-testid="art-app-custom"
        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
          tracked.has('custom')
            ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent-hover)]'
            : 'border-[var(--border-secondary)] text-[var(--text-muted)]'
        } disabled:opacity-50`}
        onClick={() => toggleApp('custom')}
      >
        {customLabel}
      </button>
    </div>
  )
}
