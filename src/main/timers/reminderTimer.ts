import { Notification } from 'electron'
import { appState } from '../app/appState'

export function tickReminder(): void {
  const { reminderCfg } = appState
  if (!reminderCfg.enabled || !Notification.isSupported()) return
  const now = new Date()
  if (now.getHours() !== reminderCfg.hour || now.getMinutes() !== reminderCfg.minute) return
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (appState.lastReminderDayKey === key) return
  appState.lastReminderDayKey = key

  try {
    const notification = new Notification({
      title: reminderCfg.title || 'ArtQuest',
      body: reminderCfg.body || '',
    })
    notification.show()
  } catch (e) {
    console.warn('Reminder notification failed:', e)
  }
}

export function startReminderTimer(): void {
  if (appState.reminderTimer) return
  appState.reminderTimer = setInterval(tickReminder, 15000)
}

export function stopReminderTimer(): void {
  if (appState.reminderTimer) {
    clearInterval(appState.reminderTimer)
    appState.reminderTimer = null
  }
}
