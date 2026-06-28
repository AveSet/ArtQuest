import type { Quest } from '@/store/models'

const DIFFICULTY_RANK: Record<Quest['difficulty'], number> = {
  novice: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
  master: 5,
}

const RANK_TO_DIFFICULTY: Quest['difficulty'][] = ['novice', 'intermediate', 'advanced', 'expert', 'master']

/** Highest difficulty rank unlocked for the player's average skill level. */
export function maxDifficultyRankForAvgLevel(avgLevel: number): number {
  if (avgLevel <= 3) return 1
  if (avgLevel <= 6) return 2
  if (avgLevel <= 9) return 3
  if (avgLevel <= 12) return 3
  if (avgLevel <= 15) return 4
  if (avgLevel <= 20) return 4
  return 5
}

export function isQuestUnlockedForPlayerLevel(quest: Quest, avgLevel: number): boolean {
  if (quest.min_level > avgLevel + 2) return false
  return DIFFICULTY_RANK[quest.difficulty] <= maxDifficultyRankForAvgLevel(avgLevel)
}

export function filterQuestsForPlayerLevel(quests: Quest[], avgLevel: number): Quest[] {
  return quests.filter((q) => isQuestUnlockedForPlayerLevel(q, avgLevel))
}

/** Easiest quests first when comparing candidates within the same tier. */
export function sortQuestsByDailyAccessibility(a: Quest, b: Quest): number {
  const minLevelDiff = a.min_level - b.min_level
  if (minLevelDiff !== 0) return minLevelDiff
  return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
}

function questsAtDifficultyRank(quests: Quest[], rank: number): Quest[] {
  const difficulty = RANK_TO_DIFFICULTY[rank - 1]
  if (!difficulty) return []
  return quests.filter((q) => q.difficulty === difficulty)
}

function lowestMinLevelBand(pool: Quest[]): Quest[] {
  if (pool.length === 0) return []
  const sorted = [...pool].sort(sortQuestsByDailyAccessibility)
  const lowestMin = sorted[0]!.min_level
  return pool.filter((q) => q.min_level === lowestMin).sort(sortQuestsByDailyAccessibility)
}

/**
 * Daily quest pool: strict level gate first, then the easiest allowed difficulty tier.
 * Never falls back to shuffling an entire category (which could surface advanced quests for beginners).
 */
export function getDailyQuestPool(quests: Quest[], avgLevel: number): Quest[] {
  if (quests.length === 0) return []

  const strict = filterQuestsForPlayerLevel(quests, avgLevel)
  if (strict.length > 0) return strict

  const maxRank = maxDifficultyRankForAvgLevel(avgLevel)

  for (let rank = 1; rank <= maxRank; rank += 1) {
    const atRank = questsAtDifficultyRank(quests, rank)
    if (atRank.length === 0) continue

    const withinMinGate = atRank.filter((q) => q.min_level <= avgLevel + 2)
    if (withinMinGate.length > 0) {
      return [...withinMinGate].sort(sortQuestsByDailyAccessibility)
    }

    const band = lowestMinLevelBand(atRank)
    if (band.length > 0) return band
  }

  // Category has no quests at the player's cap (e.g. animation has no novice). Use the easiest tier only.
  const minTierRank = Math.min(...quests.map((q) => DIFFICULTY_RANK[q.difficulty]))
  if (minTierRank > maxRank && maxRank <= 2) {
    return lowestMinLevelBand(questsAtDifficultyRank(quests, minTierRank))
  }

  return []
}
