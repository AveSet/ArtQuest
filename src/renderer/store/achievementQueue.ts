import type { Achievement } from '@/store/models'
import { useUIStore } from '@/store/useUIStore'

/** UI-only achievement toast queue — avoids routing through useQuestStore. */
export function pushAchievements(achList: Achievement[]): void {
  if (achList.length === 0) return
  useUIStore.getState().pushAchievements(achList)
}

export function shiftNextAchievement(): void {
  useUIStore.getState().shiftNextAchievement()
}

export function clearAchievementQueue(): void {
  useUIStore.getState().clearAchievementQueue()
}
