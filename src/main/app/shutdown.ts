import { app } from 'electron'
import { pauseActivityTracking } from '../activityTracker'
import { persistWindowBoundsInProgress } from '../progress/persistWindowBounds'
import { appState } from './appState'
import { stopActivityPolling } from '../timers/activityPoll'
import { stopSessionTickTimer } from '../timers/sessionTickTimer'
import { stopReminderTimer } from '../timers/reminderTimer'
import { unregisterQuestGlobalShortcuts } from '../shortcuts/questShortcuts'
import { destroyTraySafely } from '../tray/trayManager'

export function stopBackgroundTimers(): void {
  stopActivityPolling()
  stopSessionTickTimer()
  stopReminderTimer()
  pauseActivityTracking()
}

export function destroyAuxiliaryWindows(): void {
  appState.sessionMinimizeToOverlay = false
  for (const win of [appState.overlayWindow, appState.referenceWindow, appState.trayMenuAnchor]) {
    if (!win || win.isDestroyed()) continue
    try {
      win.destroy()
    } catch {
      /* ignore */
    }
  }
  appState.overlayWindow = null
  appState.referenceWindow = null
  appState.trayMenuAnchor = null
}

export function shutdownApplicationResources(): void {
  stopBackgroundTimers()
  destroyAuxiliaryWindows()
  destroyTraySafely()
  if (app.isReady()) {
    try {
      unregisterQuestGlobalShortcuts()
    } catch {
      /* ignore */
    }
  }
}

export function completeQuitAfterFlush(): void {
  appState.quitFlushAcknowledged = true
  if (appState.quitFlushTimeout) {
    clearTimeout(appState.quitFlushTimeout)
    appState.quitFlushTimeout = null
  }
  shutdownApplicationResources()
  app.quit()
}

export function flushProgressBeforeQuit(): void {
  appState.quitFlushAcknowledged = false
  try {
    try {
      persistWindowBoundsInProgress()
    } catch (err) {
      console.warn('[quit] Failed to persist window bounds from main:', err)
    }
    if (!appState.mainWindow || appState.mainWindow.isDestroyed()) {
      completeQuitAfterFlush()
      return
    }
    appState.mainWindow.webContents.send('app-before-quit')
    if (appState.quitFlushTimeout) clearTimeout(appState.quitFlushTimeout)
    appState.quitFlushTimeout = setTimeout(() => {
      console.warn('[quit] progress flush timed out — quitting anyway')
      completeQuitAfterFlush()
    }, 10_000)
  } catch (e) {
    console.warn('[quit] Failed to notify renderer before quit:', e)
    completeQuitAfterFlush()
  }
}
