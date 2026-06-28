import { describe, expect, it, vi } from 'vitest'
import { applyDesktopSettingsSync } from '../ipc/desktopSettingsHandlers'
import type { QuestSessionCommand } from '../ipc/questSessionCommands'

const defaultBindings: Array<[string, QuestSessionCommand]> = [['Ctrl+1', 'advancePhase']]

function makeDeps() {
  return {
    getReminderCfg: () => ({
      enabled: false,
      hour: 18,
      minute: 0,
      title: 'ArtQuest',
      body: '',
    }),
    setMinimizeToTray: vi.fn(),
    setReminderCfg: vi.fn(),
    setOpenAtLogin: vi.fn(),
    setActivityTrackingEnabled: vi.fn(),
    setTrackedArtApps: vi.fn(),
    setCustomArtAppExecutablePath: vi.fn(),
    setArtIdleTimeoutSec: vi.fn(),
    registerQuestGlobalShortcuts: vi.fn(),
    defaultQuestShortcutBindings: defaultBindings,
  }
}

describe('applyDesktopSettingsSync', () => {
  it('applies tray, login, reminder, and activity settings', () => {
    const deps = makeDeps()
    applyDesktopSettingsSync(
      {
        minimizeToTray: true,
        openAtLogin: true,
        remindersEnabled: true,
        reminderHour: 9,
        reminderMinute: 30,
        reminderTitle: 'Practice',
        reminderBody: 'Draw today',
        activityTrackingEnabled: true,
        trackedArtApps: ['clipstudio', 'custom'],
        customArtAppExecutablePath: 'C:\\Apps\\Krita\\krita.exe',
        artIdleTimeoutSec: 120,
      },
      deps,
    )
    expect(deps.setMinimizeToTray).toHaveBeenCalledWith(true)
    expect(deps.setOpenAtLogin).toHaveBeenCalledWith(true)
    expect(deps.setReminderCfg).toHaveBeenCalledWith({
      enabled: true,
      hour: 9,
      minute: 30,
      title: 'Practice',
      body: 'Draw today',
    })
    expect(deps.setActivityTrackingEnabled).toHaveBeenCalledWith(true)
    expect(deps.setTrackedArtApps).toHaveBeenCalled()
    expect(deps.setCustomArtAppExecutablePath).toHaveBeenCalledWith('C:\\Apps\\Krita\\krita.exe')
    expect(deps.setArtIdleTimeoutSec).toHaveBeenCalledWith(120)
  })

  it('registers parsed quest shortcuts or falls back to defaults', () => {
    const deps = makeDeps()
    applyDesktopSettingsSync(
      { questSessionShortcuts: [['Ctrl+Shift+O', 'toggleOverlay']] },
      deps,
    )
    expect(deps.registerQuestGlobalShortcuts).toHaveBeenCalledWith([
      ['Ctrl+Shift+O', 'toggleOverlay'],
    ])

    deps.registerQuestGlobalShortcuts.mockClear()
    applyDesktopSettingsSync({ questSessionShortcuts: [['Ctrl+1', 'bad-command']] }, deps)
    expect(deps.registerQuestGlobalShortcuts).toHaveBeenCalledWith(defaultBindings)
  })

  it('ignores invalid payloads', () => {
    const deps = makeDeps()
    applyDesktopSettingsSync(null, deps)
    expect(deps.setMinimizeToTray).not.toHaveBeenCalled()
  })
})
