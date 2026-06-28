import type { SkillNode } from '@/store/models'
import { ALL_CATEGORIES, type QuestCategory } from '@/data/skillTree'

export type CategorySkillStats = {
  category: QuestCategory
  nodeCount: number
  totalLevel: number
  avgLevel: number
  displayLevel: number
  totalXp: number
  totalMaxXp: number
}

function categoryDisplayLevel(nodes: SkillNode[]): number {
  const progressed = nodes.filter((n) => n.level > 0 || n.xp > 0)
  if (progressed.length === 0) return 0
  const avg = progressed.reduce((sum, n) => sum + n.level, 0) / progressed.length
  return Math.round(avg * 10) / 10
}

/** Per-category skill stats using average level among progressed nodes. */
export function computeCategorySkillStats(skillNodes: SkillNode[]): CategorySkillStats[] {
  return ALL_CATEGORIES.map((category) => {
    const nodes = skillNodes.filter((n) => n.category === category)
    const nodeCount = nodes.length
    const totalLevel = nodes.reduce((sum, n) => sum + n.level, 0)
    const activeNodes = nodes.filter((n) => n.xp > 0 || n.level > 0)
    const xpNodes = activeNodes.length > 0 ? activeNodes : nodes
    const totalXp = nodes.reduce((sum, n) => sum + n.xp, 0)
    const totalMaxXp = xpNodes.reduce((sum, n) => sum + n.maxXp, 0) || 1
    const avgLevel = nodeCount > 0 ? totalLevel / nodeCount : 0
    return {
      category,
      nodeCount,
      totalLevel,
      avgLevel,
      displayLevel: categoryDisplayLevel(nodes),
      totalXp,
      totalMaxXp,
    }
  })
}

export function pickWeakestCategoryByAverage(
  skillNodes: SkillNode[],
  categories: QuestCategory[] = ALL_CATEGORIES,
): QuestCategory {
  const visible = new Set(categories)
  const stats = computeCategorySkillStats(skillNodes).filter(
    (s) => s.nodeCount > 0 && visible.has(s.category),
  )
  if (stats.length === 0) return categories[0] ?? ALL_CATEGORIES[0]!
  let best = stats[0]!
  for (const row of stats) {
    if (row.displayLevel < best.displayLevel || (row.displayLevel === best.displayLevel && row.category < best.category)) {
      best = row
    }
  }
  return best.category
}

/** Deterministic 0..99 roll from YYYY-MM-DD (stable for the day). */
export function dailyCategoryRoll(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i += 1) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0
  }
  return hash % 100
}

/** 60% weakest, 30% mid-tier, 10% strongest visible category (by average level). */
export function pickWeightedRecommendationCategory(
  skillNodes: SkillNode[],
  categories: QuestCategory[] = ALL_CATEGORIES,
  dateStr = new Date().toISOString().slice(0, 10),
): QuestCategory {
  const visible = new Set(categories)
  const stats = computeCategorySkillStats(skillNodes)
    .filter((s) => s.nodeCount > 0 && visible.has(s.category))
    .sort((a, b) => a.displayLevel - b.displayLevel || a.category.localeCompare(b.category))

  if (stats.length === 0) return categories[0] ?? ALL_CATEGORIES[0]!
  if (stats.length === 1) return stats[0]!.category

  const roll = dailyCategoryRoll(dateStr)
  if (roll < 60) return stats[0]!.category
  if (roll < 90) return stats[Math.min(1, stats.length - 1)]!.category
  return stats[stats.length - 1]!.category
}
