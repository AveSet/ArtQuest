import type { Settings } from '@/store/models'
import {
  normalizeQuestSessionShortcuts,
  questSessionShortcutBindings,
} from '../../shared/questSessionShortcuts'

export type DesktopReminderCopy = {
  reminderTitle: string
  reminderBody: string
}

/** Payload for Electron main: tray / autostart / practice reminders */
export function buildDesktopIntegrationPayload(settings: Settings, copy?: DesktopReminderCopy) {
  return {
    minimizeToTray: settings.minimizeToTray,
    openAtLogin: settings.openAtLogin,
    remindersEnabled: settings.remindersEnabled,
    reminderHour: Math.min(23, Math.max(0, settings.reminderHour)),
    reminderMinute: Math.min(59, Math.max(0, settings.reminderMinute)),
    reminderTitle: copy?.reminderTitle?.trim() || 'ArtQuest',
    reminderBody: copy?.reminderBody?.trim() || '',
    questSessionShortcuts: questSessionShortcutBindings(normalizeQuestSessionShortcuts(settings.questSessionShortcuts)),
    activityTrackingEnabled: settings.activityTrackingEnabled !== false,
    trackedArtApps: settings.trackedArtApps ?? [],
    artIdleTimeoutSec: settings.artIdleTimeoutSec ?? 60,
  }
}

export function pushDesktopIntegrationSync(settings: Settings, copy?: DesktopReminderCopy): void {
  const api = window.electronAPI
  const payload = buildDesktopIntegrationPayload(settings, copy)
  if (api?.syncDesktopSettings) {
    void api.syncDesktopSettings(payload)
  }
}
