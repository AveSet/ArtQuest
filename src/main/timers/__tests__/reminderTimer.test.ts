import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const notificationShow = vi.fn()

vi.mock('electron', () => ({
  Notification: class MockNotification {
    show = notificationShow
    constructor(_opts: unknown) {}
    static isSupported = () => true
  },
}))

import { appState } from '../../app/appState'
import { startReminderTimer, stopReminderTimer, tickReminder } from '../reminderTimer'

describe('reminderTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    appState.reminderCfg = {
      enabled: true,
      hour: 18,
      minute: 0,
      title: 'ArtQuest',
      body: 'Time to draw',
    }
    appState.lastReminderDayKey = ''
    appState.reminderTimer = null
    notificationShow.mockClear()
  })

  afterEach(() => {
    stopReminderTimer()
    vi.useRealTimers()
  })

  it('tickReminder shows notification once per day at configured time', () => {
    vi.setSystemTime(new Date(2026, 6, 1, 18, 0, 0))
    tickReminder()
    expect(notificationShow).toHaveBeenCalledTimes(1)
    tickReminder()
    expect(notificationShow).toHaveBeenCalledTimes(1)
  })

  it('tickReminder skips when disabled', () => {
    appState.reminderCfg.enabled = false
    vi.setSystemTime(new Date(2026, 6, 1, 18, 0, 0))
    tickReminder()
    expect(notificationShow).not.toHaveBeenCalled()
  })

  it('startReminderTimer registers interval once', () => {
    startReminderTimer()
    expect(appState.reminderTimer).not.toBeNull()
    const first = appState.reminderTimer
    startReminderTimer()
    expect(appState.reminderTimer).toBe(first)
    stopReminderTimer()
    expect(appState.reminderTimer).toBeNull()
  })
})
