import type { SkillNode } from '@/store/models'
import { ALL_CATEGORIES, type QuestCategory } from '@/data/skillTree'
import { NODE_MAX_LEVEL } from '@/utils/progressionBalance'
import { computeCategorySkillStats } from '@/utils/categorySkillBalance'

export type CategoryMasteryPoint = {
  category: QuestCategory
  percent: number
  avgLevel: number
  displayLevel: number
  levelToNextRank: number
}

/** 0–100 mastery per category for radar / insight charts. */
export function computeCategoryMastery(skillNodes: SkillNode[]): CategoryMasteryPoint[] {
  const stats = computeCategorySkillStats(skillNodes)
  return ALL_CATEGORIES.map((category) => {
    const row = stats.find((s) => s.category === category)!
    const levelPct = row.nodeCount > 0 ? (row.avgLevel / NODE_MAX_LEVEL) * 100 : 0
    const xpPct = row.totalMaxXp > 0 ? (row.totalXp / row.totalMaxXp) * 100 : 0
    const percent = Math.min(100, Math.round(levelPct * 0.75 + xpPct * 0.25))
    const avgLevel = Math.round(row.avgLevel * 10) / 10
    const displayLevel = row.displayLevel
    const nextLevel = Math.min(NODE_MAX_LEVEL, Math.floor(displayLevel) + 1)
    const levelToNextRank = Math.max(0, nextLevel - displayLevel)
    return { category, percent, avgLevel, displayLevel, levelToNextRank }
  })
}
