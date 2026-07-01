import { app, session } from 'electron'
import {
  getStorageMode,
  requeuePendingGalleryUploads,
} from '../localDb'
import { usesCloudStorage } from '../../shared/storageMode'
import {
  setActivityTrackerConfig,
  setCustomArtAppExecutablePath,
} from '../activityTracker'
import {
  getGoogleDriveStatus,
  processGoogleUploadQueue,
  setUploadQueueIdleHandler,
} from '../googleDrive'
import { appState } from './appState'
import { flushProgressBeforeQuit, shutdownApplicationResources } from './shutdown'
import { applyNonElectronUserAgent, applyYoutubeReferrerForEmbeds } from './sessionSecurity'
import { createWindow, showMainWindow } from '../windows/mainWindow'
import { startActivityTimer, stopActivityPolling } from '../timers/activityPoll'
import { startReminderTimer } from '../timers/reminderTimer'
import { applyInitialQuestGlobalShortcuts } from '../shortcuts/questShortcuts'
import { sendQuestSessionCommand } from './sessionCommands'
import { installCrashReporter } from './crashReporter'

function notifyGallerySyncUpdated(): void {
  if (appState.mainWindow && !appState.mainWindow.isDestroyed()) {
    appState.mainWindow.webContents.send('artquest:v1:gallery:syncUpdated')
  }
}

export function registerAppLifecycleHandlers(): void {
  appState.singleInstanceLockAcquired = app.requestSingleInstanceLock()
  if (!appState.singleInstanceLockAcquired) {
    app.quit()
    return
  }

  app.on('second-instance', () => {
    showMainWindow()
  })

  app.on('before-quit', (event) => {
    if (appState.quitFlushAcknowledged) return
    event.preventDefault()
    appState.isQuitting = true
    flushProgressBeforeQuit()
  })

  app.on('will-quit', () => {
    shutdownApplicationResources()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.whenReady().then(() => {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.artquest.app')
    }

    createWindow()

    installCrashReporter()

    setImmediate(() => {
      session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
        const p = permission as string
        if (p === 'fullscreen' || p === 'media' || p === 'encrypted-media') {
          callback(true)
          return
        }
        callback(false)
      })

      applyYoutubeReferrerForEmbeds()
      applyNonElectronUserAgent()
      applyInitialQuestGlobalShortcuts(sendQuestSessionCommand)
      startActivityTimer()
      startReminderTimer()
      setUploadQueueIdleHandler(notifyGallerySyncUpdated)
      if (getGoogleDriveStatus().connected && usesCloudStorage(getStorageMode())) {
        requeuePendingGalleryUploads()
        void processGoogleUploadQueue()
      }
    })

    app.on('activate', () => {
      if (!appState.mainWindow || appState.mainWindow.isDestroyed()) {
        createWindow()
      }
    })
  })
}

export function registerDesktopSettingsCallbacks(): {
  setActivityTrackingEnabled: (enabled: boolean) => void
} {
  return {
    setActivityTrackingEnabled: (enabled: boolean) => {
      setActivityTrackerConfig({ enabled })
      if (enabled) {
        startActivityTimer()
      } else {
        stopActivityPolling()
      }
    },
  }
}

export {
  setCustomArtAppExecutablePath,
  setActivityTrackerConfig,
}
