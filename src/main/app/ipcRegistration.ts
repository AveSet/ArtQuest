import { ipcMain } from 'electron'
import {
  setActivityTrackerConfig,
  setCustomArtAppExecutablePath,
} from '../activityTracker'
import { registerProgressIpcHandlers } from '../progress/progressIpc'
import { registerGalleryIpcHandlers } from '../ipc/galleryHandlers'
import { registerSessionTickIpcHandlers } from '../ipc/sessionTickHandlers'
import { registerTaskbarProgressIpcHandlers } from '../ipc/taskbarProgressHandlers'
import {
  registerWindowBoundsIpcHandlers,
  mergePersistedWindowBounds,
} from '../ipc/windowBoundsHandlers'
import { registerOverlayIpcHandlers } from '../ipc/overlayHandlers'
import { registerReferenceWindowIpcHandlers } from '../ipc/referenceWindowHandlers'
import {
  applyOpenAtLogin,
  registerDesktopSettingsIpcHandlers,
} from '../ipc/desktopSettingsHandlers'
import { registerShellIpcHandlers } from '../ipc/shellHandlers'
import { registerStorageCloudIpcHandlers } from '../ipc/storageCloudHandlers'
import { registerQuestSessionCommandIpcHandlers } from '../ipc/questSessionCommandHandlers'
import { appState } from './appState'
import { completeQuitAfterFlush } from './shutdown'
import { sendQuestSessionCommand } from './sessionCommands'
import {
  appendDebugLog,
  getProgressBackupPath,
  getProgressPath,
  getQuestBackupDir,
  getDebugLogPath,
} from './progressPaths'
import { registerDesktopSettingsCallbacks } from './bootstrap'
import {
  DEFAULT_QUEST_SHORTCUT_BINDINGS,
  registerQuestGlobalShortcuts,
} from '../shortcuts/questShortcuts'
import { startSessionTickTimer, stopSessionTickTimer } from '../timers/sessionTickTimer'
import { applyPersistedWindowBounds } from '../windows/windowBoundsState'
import {
  applyOverlayWindowLayout,
  hideSessionOverlayWindow,
  pushOverlayPayloadToWindow,
  showOverlayWindow,
  toggleOverlayWindow,
} from '../windows/overlayWindow'
import { createReferenceWindow, openUrlInReferenceWebview } from '../windows/referenceWindow'
import { expandSessionFromOverlay } from './sessionCommands'

export function registerAllIpcHandlers(): void {
  ipcMain.on('app-before-quit-done', () => {
    if (!appState.isQuitting || appState.quitFlushAcknowledged) return
    completeQuitAfterFlush()
  })

  registerProgressIpcHandlers({
    getProgressPath,
    getProgressBackupPath,
    getQuestBackupDir,
    getDebugLogPath,
    appendDebugLog,
  })

  registerGalleryIpcHandlers({ getMainWindow: () => appState.mainWindow })

  registerSessionTickIpcHandlers({
    startSessionTickTimer,
    stopSessionTickTimer,
  })

  registerTaskbarProgressIpcHandlers({
    getMainWindow: () => appState.mainWindow,
  })

  registerWindowBoundsIpcHandlers({
    getMainWindow: () => appState.mainWindow,
    getPersistedBounds: () => appState.persistedWindowBounds,
    setPersistedBounds: (partial) => {
      appState.persistedWindowBounds = mergePersistedWindowBounds(
        appState.persistedWindowBounds,
        partial,
      )
    },
    applyPersistedBounds: applyPersistedWindowBounds,
  })

  registerOverlayIpcHandlers({
    getMainWindow: () => appState.mainWindow,
    getOverlayWindow: () => appState.overlayWindow,
    getCachedPayload: () => appState.cachedOverlayPayload,
    setCachedPayload: (payload) => {
      appState.cachedOverlayPayload = payload
    },
    patchCachedPayload: (patch) => {
      appState.cachedOverlayPayload = { ...appState.cachedOverlayPayload, ...patch }
    },
    pushPayload: pushOverlayPayloadToWindow,
    applyLayout: applyOverlayWindowLayout,
    setSessionMinimizeToOverlay: (active) => {
      appState.sessionMinimizeToOverlay = active
    },
    showOverlay: showOverlayWindow,
    hideOverlay: hideSessionOverlayWindow,
    toggleOverlay: toggleOverlayWindow,
    expandFromOverlay: expandSessionFromOverlay,
    cancelQuestSession: () => sendQuestSessionCommand('cancelQuestSession'),
  })

  registerReferenceWindowIpcHandlers({
    openReferenceWindow: (params) => {
      createReferenceWindow(params)
    },
    navigateReferenceWindow: openUrlInReferenceWebview,
  })

  const desktopCallbacks = registerDesktopSettingsCallbacks()

  registerDesktopSettingsIpcHandlers({
    getReminderCfg: () => appState.reminderCfg,
    setMinimizeToTray: (value) => {
      appState.minimizeToTraySetting = value
    },
    setReminderCfg: (cfg) => {
      appState.reminderCfg = cfg
    },
    setOpenAtLogin: applyOpenAtLogin,
    setActivityTrackingEnabled: desktopCallbacks.setActivityTrackingEnabled,
    setTrackedArtApps: (apps) => {
      setActivityTrackerConfig({ trackedArtApps: apps })
    },
    setCustomArtAppExecutablePath: (exePath) => {
      setCustomArtAppExecutablePath(exePath)
    },
    setArtIdleTimeoutSec: (sec) => {
      setActivityTrackerConfig({ idleTimeoutSec: sec })
    },
    registerQuestGlobalShortcuts: (bindings) =>
      registerQuestGlobalShortcuts(bindings, sendQuestSessionCommand),
    defaultQuestShortcutBindings: DEFAULT_QUEST_SHORTCUT_BINDINGS,
  })

  registerQuestSessionCommandIpcHandlers({ sendCommand: sendQuestSessionCommand })
  registerShellIpcHandlers()
  registerStorageCloudIpcHandlers()
}
