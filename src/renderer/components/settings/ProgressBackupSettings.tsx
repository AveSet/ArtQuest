import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import { playUiClick } from '@/utils/sound'
import {
  buildExportEnvelope,
  downloadProgressJson,
  parseImportEnvelope,
  stripGalleryBinary,
} from '@/utils/progressExport'
import SettingsSection from '@/components/settings/SettingsSection'
import { SettingsIconBackup, SettingsSectionTitle } from '@/components/settings/SettingsIcons'

export default function ProgressBackupSettings() {
  const { t } = useI18n()
  const { setSettings, saveProgress, loadProgress, lastExportAt } = useUIStore(
    useShallow((s) => ({
      setSettings: s.setSettings,
      saveProgress: s.saveProgress,
      loadProgress: s.loadProgress,
      lastExportAt: s.lastExportAt,
    })),
  )
  const [backupMsg, setBackupMsg] = useState('')
  const [includeMediaExport, setIncludeMediaExport] = useState(false)

  const exportProgressBackup = async () => {
    playUiClick()
    setBackupMsg('')
    const progressData = useUIStore.getState().buildProgressData()
    const stripped = stripGalleryBinary(progressData, includeMediaExport)
    const envelope = buildExportEnvelope(stripped)
    const json = JSON.stringify(envelope, null, 2)
    if (window.electronAPI?.progress?.exportFile) {
      const result = await window.electronAPI.progress.exportFile(json)
      if (result.success) {
        setSettings({})
        useUIStore.setState({ lastExportAt: envelope.exportedAt })
        void saveProgress()
        setBackupMsg(t.settings.exportSuccess ?? 'Exported')
      } else if (result.error !== 'cancelled') {
        setBackupMsg(result.error ?? t.settings.exportFailed!)
      }
      return
    }
    downloadProgressJson(envelope)
    useUIStore.setState({ lastExportAt: envelope.exportedAt })
    void saveProgress()
    setBackupMsg(t.settings.exportSuccess ?? 'Exported')
  }

  const importProgressBackup = async () => {
    playUiClick()
    setBackupMsg('')
    if (window.electronAPI?.progress?.importFile) {
      const result = await window.electronAPI.progress.importFile()
      if (result.success) {
        await loadProgress()
        setBackupMsg(t.settings.importSuccess ?? 'Imported')
        return
      }
      if (result.error !== 'cancelled') {
        setBackupMsg(result.error ?? t.settings.importFailed ?? 'Import failed')
      }
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const normalized = parseImportEnvelope(JSON.parse(text) as unknown)
        if (!normalized) {
          setBackupMsg(t.settings.importFailed ?? 'Import failed')
          return
        }
        if (window.electronAPI?.progress?.save) {
          await window.electronAPI.progress.save(JSON.stringify(normalized))
        } else {
          const { saveProgressToBrowser } = await import('@/utils/browserProgress')
          if (!saveProgressToBrowser(normalized as Record<string, unknown>)) {
            setBackupMsg(t.settings.importFailed ?? 'Import failed')
            return
          }
        }
        await loadProgress()
        setBackupMsg(t.settings.importSuccess ?? 'Imported')
      } catch {
        setBackupMsg(t.settings.importFailed ?? 'Import failed')
      }
    }
    input.click()
  }

  return (
    <SettingsSection
      title={<SettingsSectionTitle icon={<SettingsIconBackup />}>{t.settings.backupSection ?? 'Backup'}</SettingsSectionTitle>}
      testId="backup-settings"
      defaultOpen={false}
    >
      <p className="text-xs text-[var(--text-muted)]">{t.settings.exportProgressHint}</p>
      {lastExportAt ? (
        <p className="text-xs text-[var(--text-muted)]">
          {t.settings.lastExportAt}: {new Date(lastExportAt).toLocaleString()}
        </p>
      ) : null}
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={includeMediaExport}
          onChange={(e) => setIncludeMediaExport(e.target.checked)}
        />
        {t.settings.includeMediaExport}
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" className="btn-secondary flex-1 text-sm" onClick={() => void exportProgressBackup()}>
          {t.settings.exportProgress}
        </button>
        <button type="button" className="btn-secondary flex-1 text-sm" onClick={() => void importProgressBackup()}>
          {t.settings.importProgress}
        </button>
      </div>
      {backupMsg ? <p className="text-xs text-[var(--text-muted)]">{backupMsg}</p> : null}
    </SettingsSection>
  )
}
