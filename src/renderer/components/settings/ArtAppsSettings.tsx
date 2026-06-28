import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import { playUiClick } from '@/utils/sound'
import { pushDesktopIntegrationSync } from '@/utils/desktopIntegration'
import SettingsSection from '@/components/settings/SettingsSection'
import ArtAppPicker from '@/components/settings/ArtAppPicker'

export default function ArtAppsSettings() {
  const { t } = useI18n()
  const { settings, setSettings, saveProgress } = useUIStore(
    useShallow((s) => ({
      settings: s.settings,
      setSettings: s.setSettings,
      saveProgress: s.saveProgress,
    })),
  )

  const labels = t.settings
  const tracked = new Set(settings.trackedArtApps ?? [])
  const enabled = settings.activityTrackingEnabled !== false
  const idleSec = settings.artIdleTimeoutSec ?? 60

  const apply = useCallback(
    (patch: Partial<typeof settings>) => {
      const next = { ...settings, ...patch }
      setSettings(patch)
      pushDesktopIntegrationSync(next)
      void saveProgress()
    },
    [saveProgress, setSettings, settings],
  )

  if (typeof window === 'undefined' || !window.electronAPI) return null

  return (
    <SettingsSection
      title={`🎨 ${labels.artAppsSection}`}
      defaultOpen={false}
      testId="art-apps-section"
    >
      <p className="text-xs text-[var(--text-muted)]">{enabled ? labels.artAppsHint : labels.artAppsHintOff}</p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => {
            playUiClick()
            apply({ activityTrackingEnabled: !enabled })
          }}
        />
        <span>{labels.artAppsEnabled}</span>
      </label>
      <ArtAppPicker
        tracked={tracked}
        disabled={!enabled}
        onChange={(ids) => {
          playUiClick()
          apply({ trackedArtApps: ids })
        }}
      />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <label
          htmlFor="art-idle-timeout-select"
          className="text-sm font-medium text-[var(--text-secondary)] sm:w-44 shrink-0"
        >
          {labels.artIdleTimeout}
        </label>
        <select
          id="art-idle-timeout-select"
          className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
          value={idleSec}
          disabled={!enabled}
          onChange={(e) => {
            playUiClick()
            apply({ artIdleTimeoutSec: Number(e.target.value) })
          }}
        >
          {[30, 60, 90, 120, 180].map((sec) => (
            <option key={sec} value={sec}>
              {sec} {labels.artIdleSecondsUnit ?? t.common.secondsAbbr}
            </option>
          ))}
        </select>
      </div>
    </SettingsSection>
  )
}
