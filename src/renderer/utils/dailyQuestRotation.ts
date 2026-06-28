import type { Quest, QuestCompletionLog } from '@/store/models'

export function bucketKey(quest: Pick<Quest, 'category' | 'difficulty'>): string {
  return `${quest.category}:${quest.difficulty}`
}

export function getBucketQuestIds(quests: Quest[], key: string): number[] {
  return quests.filter((q) => bucketKey(q) === key).map((q) => q.id)
}

export function getCompletedIdsInBucket(
  logs: QuestCompletionLog[],
  quests: Quest[],
  key: string,
): Set<number> {
  const bucketIds = new Set(getBucketQuestIds(quests, key))
  const done = new Set<number>()
  for (const log of logs) {
    if (log.status === 'timeout') continue
    if (bucketIds.has(log.questId)) done.add(log.questId)
  }
  return done
}

export function isBucketSaturated(
  logs: QuestCompletionLog[],
  quests: Quest[],
  key: string,
): boolean {
  const bucketIds = getBucketQuestIds(quests, key)
  if (bucketIds.length === 0) return true
  const done = getCompletedIdsInBucket(logs, quests, key)
  return bucketIds.every((id) => done.has(id))
}

export function countQuestCompletions(questId: number, logs: QuestCompletionLog[]): number {
  let n = 0
  for (const log of logs) {
    if (log.status === 'timeout') continue
    if (log.questId === questId) n += 1
  }
  return n
}

/**
 * Rotation weight for daily picks: deprioritize repeats until the category×difficulty bucket is fully explored.
 */
export function getDailyRotationWeight(
  quest: Quest,
  logs: QuestCompletionLog[],
  allQuests: Quest[],
): number {
  const key = bucketKey(quest)
  const completions = countQuestCompletions(quest.id, logs)
  if (completions === 0) return 1
  if (isBucketSaturated(logs, allQuests, key)) return 1
  return 0
}

/** When all rotation weights are zero, pick among least-completed quests in the pool. */
export function pickLeastCompletedFallback(pool: Quest[], logs: QuestCompletionLog[], seed: number): Quest | null {
  if (pool.length === 0) return null
  let minCount = Infinity
  for (const q of pool) {
    const c = countQuestCompletions(q.id, logs)
    if (c < minCount) minCount = c
  }
  const candidates = pool.filter((q) => countQuestCompletions(q.id, logs) === minCount)
  const idx = Math.abs(seed) % candidates.length
  return candidates[idx] ?? null
}
