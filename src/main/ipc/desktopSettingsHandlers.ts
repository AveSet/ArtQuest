import { app, ipcMain, Notification } from 'electron'
import { normalizeTrackedArtApps, normalizeCustomArtAppExecutablePath, type ArtAppId } from '../../shared/artApps'
import {
  parseQuestSessionShortcutBindings,
  type QuestSessionCommand,
} from './questSessionCommands'

export type ReminderCfg = {
  enabled: boolean
  hour: number
  minute: number
  title: string
  body: string
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export type DesktopSettingsSyncDeps = {
  getReminderCfg: () => ReminderCfg
  setMinimizeToTray: (value: boolean) => void
  setReminderCfg: (cfg: ReminderCfg) => void
  setOpenAtLogin: (value: boolean) => void
  setActivityTrackingEnabled: (enabled: boolean) => void
  setTrackedArtApps: (apps: ArtAppId[]) => void
  setCustomArtAppExecutablePath: (path: string | undefined) => void
  setArtIdleTimeoutSec: (sec: number) => void
  registerQuestGlobalShortcuts: (bindings: Array<[string, QuestSessionCommand]>) => void
  defaultQuestShortcutBindings: Array<[string, QuestSessionCommand]>
}

export function applyDesktopSettingsSync(raw: unknown, deps: DesktopSettingsSyncDeps): void {
  try {
    if (!raw || typeof raw !== 'object' || raw === null) return
    const o = raw as Record<string, unknown>

    if (typeof o.minimizeToTray === 'boolean') {
      deps.setMinimizeToTray(o.minimizeToTray)
    }

    if (typeof o.openAtLogin === 'boolean') {
      deps.setOpenAtLogin(o.openAtLogin)
    }

    const prevReminder = deps.getReminderCfg()
    deps.setReminderCfg({
      enabled: o.remindersEnabled === true,
      hour: typeof o.reminderHour === 'number' ? clamp(o.reminderHour, 0, 23) : prevReminder.hour,
      minute:
        typeof o.reminderMinute === 'number' ? clamp(o.reminderMinute, 0, 59) : prevReminder.minute,
      title: typeof o.reminderTitle === 'string' ? o.reminderTitle : prevReminder.title,
      body: typeof o.reminderBody === 'string' ? o.reminderBody : prevReminder.body,
    })

    if (typeof o.activityTrackingEnabled === 'boolean') {
      deps.setActivityTrackingEnabled(o.activityTrackingEnabled)
    }
    if (Array.isArray(o.trackedArtApps)) {
      deps.setTrackedArtApps(normalizeTrackedArtApps(o.trackedArtApps) as ArtAppId[])
    }
    if ('customArtAppExecutablePath' in o) {
      deps.setCustomArtAppExecutablePath(
        normalizeCustomArtAppExecutablePath(o.customArtAppExecutablePath),
      )
    }
    if (typeof o.artIdleTimeoutSec === 'number') {
      deps.setArtIdleTimeoutSec(o.artIdleTimeoutSec)
    }

    const bindings = parseQuestSessionShortcutBindings(o.questSessionShortcuts)
    if (bindings) {
      deps.registerQuestGlobalShortcuts(bindings)
    } else if (Array.isArray(o.questSessionShortcuts)) {
      deps.registerQuestGlobalShortcuts(deps.defaultQuestShortcutBindings)
    }
  } catch (e) {
    console.warn('sync-desktop-settings failed:', e)
  }
}

export function registerDesktopSettingsIpcHandlers(deps: DesktopSettingsSyncDeps): void {
  ipcMain.handle('sync-desktop-settings', async (_, raw: unknown) => {
    applyDesktopSettingsSync(raw, deps)
  })

  ipcMain.handle('show-test-notification', async (_, raw: unknown) => {
    try {
      if (!Notification.isSupported()) return { success: false }
      const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
      const title = typeof o.title === 'string' ? o.title : 'ArtQuest'
      const body = typeof o.body === 'string' ? o.body : ''
      const n = new Notification({ title, body })
      n.show()
      return { success: true }
    } catch {
      return { success: false }
    }
  })
}

/** @internal test hook */
export function parseOpenAtLoginFromSync(raw: unknown): boolean | undefined {
  if (!raw || typeof raw !== 'object' || raw === null) return undefined
  const v = (raw as Record<string, unknown>).openAtLogin
  return typeof v === 'boolean' ? v : undefined
}

export function applyOpenAtLogin(value: boolean): void {
  app.setLoginItemSettings({ openAtLogin: value })
}
