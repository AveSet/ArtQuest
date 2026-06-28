import SettingsSection from '@/components/settings/SettingsSection'
import { REFERENCE_SOURCES } from '@/utils/buildReferenceQuery'
import { settingsChoiceClass } from '@/utils/settingsUi'
import { playUiClick } from '@/utils/sound'
import type { ReferenceSource } from '@/store/models'
import type { Settings } from '@/store/models'
import type { Translations } from '@/i18n/translations'

type Props = {
  settings: Settings
  setSettings: (patch: Partial<Settings>) => void
  saveProgress: () => Promise<void>
  t: Translations
  googleConnected: boolean
  googleAccountEmail: string | null
  referenceSourceLabels: Record<ReferenceSource, string>
}

export default function SettingsReferencesSection({
  settings,
  setSettings,
  saveProgress,
  t,
  googleConnected,
  googleAccountEmail,
  referenceSourceLabels,
}: Props) {
  return (
    <div className="settings-block space-y-2">
      <h2 className="settings-group-heading">{t.settings.referencesSection ?? 'References & materials'}</h2>
      <SettingsSection
        title={`🔎 ${t.settings.referenceSourceTitle ?? 'Default reference source'}`}
        defaultOpen
      >
        <p className="text-xs text-[var(--text-muted)] mb-2">
          {t.settings.referenceSourceHint ??
            'The reference window opens with this source and remembers the last source you choose there.'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {REFERENCE_SOURCES.map((source) => {
            const selected = (settings.preferredReferenceSource ?? 'pinterest') === source
            return (
              <button
                key={source}
                type="button"
                onClick={() => {
                  playUiClick()
                  setSettings({ preferredReferenceSource: source })
                  void saveProgress()
                }}
                aria-pressed={selected}
                className={settingsChoiceClass(selected, true)}
              >
                {referenceSourceLabels[source]}
              </button>
            )
          })}
        </div>
      </SettingsSection>

      {googleConnected && googleAccountEmail ? (
        <SettingsSection
          title={`🔐 ${t.settings.useGoogleForReferenceLogin ?? 'Use Google account for reference sites'}`}
          defaultOpen={false}
        >
          <p className="text-xs text-[var(--text-muted)] mb-2">
            {(t.settings.useGoogleForReferenceLoginHint ?? '').replace('{email}', googleAccountEmail)}
          </p>
          <div className="settings-toggle-row">
            <span className="settings-row-label text-sm">{googleAccountEmail}</span>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(settings.useGoogleForReferenceLogin)}
              onClick={() => {
                playUiClick()
                setSettings({ useGoogleForReferenceLogin: !settings.useGoogleForReferenceLogin })
                void saveProgress()
              }}
              className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${
                settings.useGoogleForReferenceLogin ? 'bg-[var(--gold-primary)]' : 'bg-[var(--bg-secondary)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform ${
                  settings.useGoogleForReferenceLogin ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </SettingsSection>
      ) : null}
    </div>
  )
}
