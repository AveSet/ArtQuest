import { WARMUP_QUESTS } from '@/data/warmupQuests'
import type { Quest } from '@/store/models'
import { generateDailySeed } from '@/utils/dailyQuests'

export function isWarmupCompletedToday(lastWarmupCompletedDate: string, today: string): boolean {
  return lastWarmupCompletedDate.length > 0 && lastWarmupCompletedDate === today
}

/** Same warmup drill for everyone on a given calendar day. */
export function getWarmupQuestForDate(dateStr: string): Quest {
  const seed = generateDailySeed(`warmup:${dateStr}`)
  const index = Math.abs(seed) % WARMUP_QUESTS.length
  return WARMUP_QUESTS[index]!
}
