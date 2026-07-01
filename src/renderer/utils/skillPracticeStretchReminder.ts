import { translations } from '@/i18n/translations'
import { useUIStore } from '@/store/useUIStore'
import type { Language } from '@/i18n/languages'

const STRETCH_INTERVAL_SEC = 2 * 60 * 60

let lastStretchBucket = 0

export function resetStretchReminder(): void {
  lastStretchBucket = 0
}

export function syncStretchBucketFromElapsed(activeElapsedSec: number): void {
  lastStretchBucket = Math.floor(activeElapsedSec / STRETCH_INTERVAL_SEC)
}

export function onSkillPracticeSecondTick(activeElapsedSec: number): void {
  const bucket = Math.floor(activeElapsedSec / STRETCH_INTERVAL_SEC)
  if (bucket <= 0 || bucket <= lastStretchBucket) return
  lastStretchBucket = bucket
  const { title, body } = stretchCopy(useUIStore.getState().settings.language)
  notifyStretchReminder(title, body)
}

function stretchCopy(lang: Language | undefined): { title: string; body: string } {
  const pack = translations[lang ?? 'en'] ?? translations.en
  const fallback = translations.en.skills
  return {
    title: pack.skills.stretchReminderTitle ?? fallback.stretchReminderTitle ?? 'You\'re doing great!',
    body: pack.skills.stretchReminderBody ?? fallback.stretchReminderBody ?? 'Time to stand up and stretch a bit.',
  }
}

function notifyStretchReminder(title: string, body: string): void {
  const api = window.electronAPI
  if (api?.desktop?.showTestNotification) {
    void api.desktop.showTestNotification({ title, body })
    return
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}
