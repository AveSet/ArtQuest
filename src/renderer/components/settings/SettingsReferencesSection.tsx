import SettingsSection from '@/components/settings/SettingsSection'
import { SettingsIconSearch, SettingsSectionTitle } from '@/components/settings/SettingsIcons'
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
  referenceSourceLabels: Record<ReferenceSource, string>
}

export default function SettingsReferencesSection({
  settings,
  setSettings,
  saveProgress,
  t,
  referenceSourceLabels,
}: Props) {
  return (
    <div className="settings-block space-y-2">
      <h2 className="settings-group-heading">{t.settings.referencesSection ?? 'References & materials'}</h2>
      <SettingsSection
        title={
          <SettingsSectionTitle icon={<SettingsIconSearch />}>
            {t.settings.referenceSourceTitle ?? 'Default reference source'}
          </SettingsSectionTitle>
        }
        defaultOpen={false}
      >
        <p className="text-xs text-[var(--text-muted)] mb-2">
          {t.settings.referenceSourceHint ??
            'The reference window opens with this source and remembers the last source you choose there.'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
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
    </div>
  )
}
