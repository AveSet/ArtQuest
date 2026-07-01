import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('electron', () => ({
  app: {
    isReady: () => true,
    quit: vi.fn(),
  },
}))

vi.mock('../../activityTracker', () => ({
  pauseActivityTracking: vi.fn(),
}))

vi.mock('../../timers/activityPoll', () => ({
  stopActivityPolling: vi.fn(),
}))

vi.mock('../../timers/sessionTickTimer', () => ({
  stopSessionTickTimer: vi.fn(),
}))

vi.mock('../../timers/reminderTimer', () => ({
  stopReminderTimer: vi.fn(),
}))

vi.mock('../../shortcuts/questShortcuts', () => ({
  unregisterQuestGlobalShortcuts: vi.fn(),
}))

vi.mock('../../tray/trayManager', () => ({
  destroyTraySafely: vi.fn(),
}))

import { app } from 'electron'
import { pauseActivityTracking } from '../../activityTracker'
import { stopActivityPolling } from '../../timers/activityPoll'
import { stopSessionTickTimer } from '../../timers/sessionTickTimer'
import { stopReminderTimer } from '../../timers/reminderTimer'
import { unregisterQuestGlobalShortcuts } from '../../shortcuts/questShortcuts'
import { destroyTraySafely } from '../../tray/trayManager'
import { appState } from '../appState'
import {
  completeQuitAfterFlush,
  flushProgressBeforeQuit,
  shutdownApplicationResources,
} from '../shutdown'

describe('shutdown', () => {
  beforeEach(() => {
    appState.isQuitting = false
    appState.quitFlushAcknowledged = false
    appState.quitFlushTimeout = null
    appState.mainWindow = null
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (appState.quitFlushTimeout) {
      clearTimeout(appState.quitFlushTimeout)
      appState.quitFlushTimeout = null
    }
  })

  it('shutdownApplicationResources stops timers and destroys tray', () => {
    shutdownApplicationResources()
    expect(stopActivityPolling).toHaveBeenCalled()
    expect(stopSessionTickTimer).toHaveBeenCalled()
    expect(stopReminderTimer).toHaveBeenCalled()
    expect(pauseActivityTracking).toHaveBeenCalled()
    expect(unregisterQuestGlobalShortcuts).toHaveBeenCalled()
    expect(destroyTraySafely).toHaveBeenCalled()
  })

  it('completeQuitAfterFlush clears timeout and quits', () => {
    appState.quitFlushTimeout = setTimeout(() => {}, 60_000)
    completeQuitAfterFlush()
    expect(appState.quitFlushAcknowledged).toBe(true)
    expect(appState.quitFlushTimeout).toBeNull()
    expect(app.quit).toHaveBeenCalled()
  })

  it('flushProgressBeforeQuit completes immediately when main window missing', () => {
    flushProgressBeforeQuit()
    expect(appState.quitFlushAcknowledged).toBe(true)
    expect(app.quit).toHaveBeenCalled()
  })

  it('flushProgressBeforeQuit sends before-quit to renderer', () => {
    const send = vi.fn()
    appState.mainWindow = {
      isDestroyed: () => false,
      webContents: { send },
    } as unknown as typeof appState.mainWindow

    flushProgressBeforeQuit()
    expect(send).toHaveBeenCalledWith('app-before-quit')
    expect(appState.quitFlushAcknowledged).toBe(false)
  })
})
