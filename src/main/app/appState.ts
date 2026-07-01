import type { BrowserWindow, Tray } from 'electron'
import type { ReminderCfg } from '../ipc/desktopSettingsHandlers'
import type { PersistedWindowBounds } from '../ipc/windowBoundsHandlers'

export type OverlayLayoutOpts = {
  sessionType?: 'quest' | 'practice'
  refsOpen?: boolean
  contentHeight?: number
}

export const appState = {
  mainWindow: null as BrowserWindow | null,
  overlayWindow: null as BrowserWindow | null,
  referenceWindow: null as BrowserWindow | null,
  tray: null as Tray | null,
  trayMenuAnchor: null as BrowserWindow | null,
  isQuitting: false,
  quitFlushAcknowledged: false,
  quitFlushTimeout: null as ReturnType<typeof setTimeout> | null,
  minimizeToTraySetting: false,
  sessionMinimizeToOverlay: false,
  singleInstanceLockAcquired: false,
  activityTimer: null as ReturnType<typeof setInterval> | null,
  activityRefreshTimer: null as ReturnType<typeof setInterval> | null,
  sessionTickTimer: null as ReturnType<typeof setInterval> | null,
  reminderCfg: {
    enabled: false,
    hour: 18,
    minute: 0,
    title: 'ArtQuest',
    body: '',
  } as ReminderCfg,
  lastReminderDayKey: '',
  reminderTimer: null as ReturnType<typeof setInterval> | null,
  persistedWindowBounds: {} as PersistedWindowBounds,
  suppressWindowBoundsReport: false,
  cachedOverlayPayload: { hasSession: false } as Record<string, unknown>,
  overlayLayoutState: { refsOpen: false } as OverlayLayoutOpts,
}
