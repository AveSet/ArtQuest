import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  DEFAULT_QUEST_SESSION_SHORTCUTS,
  QUEST_SESSION_SHORTCUT_COMMANDS,
  type QuestSessionShortcutCommand,
  type QuestSessionShortcuts,
  normalizeQuestSessionShortcuts,
} from '../../../shared/questSessionShortcuts'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import { playUiClick } from '@/utils/sound'
import { pushDesktopIntegrationSync } from '@/utils/desktopIntegration'
import SettingsSection from '@/components/settings/SettingsSection'
import ShortcutCaptureButton from '@/components/settings/ShortcutCaptureButton'

const VISIBLE_SHORTCUT_COMMANDS = QUEST_SESSION_SHORTCUT_COMMANDS.filter(
  (cmd) => cmd !== 'showMainWindow',
)

const COMMAND_LABEL_KEYS: Record<
  Exclude<QuestSessionShortcutCommand, 'showMainWindow'>,
  'shortcutAdvance' | 'shortcutOverlay' | 'shortcutOpenReferences'
> = {
  advancePhase: 'shortcutAdvance',
  toggleOverlay: 'shortcutOverlay',
  openReferences: 'shortcutOpenReferences',
}

export default function QuestSessionShortcutsSettings() {
  const { t } = useI18n()
  const { settings, setSettings, saveProgress } = useUIStore(
    useShallow((s) => ({
      settings: s.settings,
      setSettings: s.setSettings,
      saveProgress: s.saveProgress,
    })),
  )
  const shortcuts = normalizeQuestSessionShortcuts(settings.questSessionShortcuts)

  const applyShortcuts = useCallback(
    (next: QuestSessionShortcuts) => {
      setSettings({ questSessionShortcuts: next })
      pushDesktopIntegrationSync({ ...settings, questSessionShortcuts: next })
      void saveProgress()
    },
    [saveProgress, setSettings, settings],
  )

  const captureShortcut = (cmd: QuestSessionShortcutCommand, accelerator: string) => {
    playUiClick()
    applyShortcuts(normalizeQuestSessionShortcuts({ ...shortcuts, [cmd]: accelerator }))
  }

  if (typeof window === 'undefined' || !window.electronAPI) return null

  const labels = t.settings

  return (
    <SettingsSection
      title={`⌨ ${labels.questShortcutsSection}`}
      defaultOpen={false}
      testId="quest-shortcuts-section"
    >
      <p className="text-xs text-[var(--text-muted)]">{labels.questShortcutsHint}</p>
      {VISIBLE_SHORTCUT_COMMANDS.map((cmd) => (
        <div key={cmd} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-sm font-medium text-[var(--text-secondary)] sm:w-44 shrink-0">
            {labels[COMMAND_LABEL_KEYS[cmd]] ?? cmd}
          </span>
          <ShortcutCaptureButton
            value={shortcuts[cmd]}
            listeningLabel={labels.shortcutCaptureListening ?? 'Press keys…'}
            captureLabel={labels.shortcutCaptureClick ?? 'Click to set'}
            onCapture={(accelerator) => captureShortcut(cmd, accelerator)}
          />
          <button
            type="button"
            className="btn-secondary text-xs px-2 py-1.5 shrink-0"
            onClick={() => {
              playUiClick()
              applyShortcuts({
                ...shortcuts,
                [cmd]: DEFAULT_QUEST_SESSION_SHORTCUTS[cmd],
              })
            }}
          >
            {labels.shortcutReset}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-secondary text-xs px-3 py-1.5 w-full sm:w-auto"
        onClick={() => {
          playUiClick()
          applyShortcuts({ ...DEFAULT_QUEST_SESSION_SHORTCUTS })
        }}
      >
        {labels.shortcutResetAll}
      </button>
    </SettingsSection>
  )
}
