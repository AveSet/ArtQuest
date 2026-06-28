import { SKILL_TREE_NODES, type QuestCategory } from '@/data/skillTree'
import type { Quest } from '@/store/models'

function categoryFundamentalsId(category: QuestCategory): string {
  return `${category}_fundamentals`
}

/** Best-matching skill node for Materials / YouTube filters for this quest. */
export function resolveQuestSkillNodeId(quest: Pick<Quest, 'category' | 'tags'>): string {
  const candidates = SKILL_TREE_NODES.filter((n) => n.category === quest.category)
  if (candidates.length === 0) return categoryFundamentalsId(quest.category)

  const questTags = quest.tags.map((t) => t.toLowerCase())
  const questTagSet = new Set(questTags)

  let bestId = candidates[0]!.id
  let bestScore = -1

  for (const node of candidates) {
    let score = 0
    for (const tag of node.tags) {
      const lower = tag.toLowerCase()
      if (questTagSet.has(lower)) score += 3
      for (const qt of questTags) {
        if (qt === lower) continue
        if (qt.includes(lower) || lower.includes(qt)) score += 1
      }
    }
    if (node.prerequisites.length === 0) score += 0.5
    if (score > bestScore) {
      bestScore = score
      bestId = node.id
    }
  }

  if (bestScore <= 0) {
    const fundamentals =
      candidates.find((n) => n.id === categoryFundamentalsId(quest.category)) ??
      candidates.find((n) => n.prerequisites.length === 0)
    if (fundamentals) return fundamentals.id
  }

  return bestId
}
