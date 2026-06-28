import type { LocalizedString } from '@/i18n/languages'
import { useUIStore } from '@/store/useUIStore'

export type LevelUpNotification = {
  nodeTitle: LocalizedString
  category: string
  newLevel: number
}

/** UI-only level-up toast — avoids routing through useSkillStore → useUIStore. */
export function notifyLevelUp(event: LevelUpNotification): void {
  useUIStore.getState().showLevelUp(event)
}
