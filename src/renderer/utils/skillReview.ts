import type { SkillNode } from '@/store/models'

export interface ReviewableNode {
  nodeId: string
  category: string
  tags: string[]
  daysOverdue: number
}

export function getNodesDueForReview(
  skillNodes: SkillNode[],
  today: string
): ReviewableNode[] {
  const todayDate = new Date(today + 'T00:00:00')

  return skillNodes
    .filter((node) => {
      if (node.reviewIntervalDays <= 0 || !node.lastReviewDate) return false
      const lastReview = new Date(node.lastReviewDate + 'T00:00:00')
      const diffMs = todayDate.getTime() - lastReview.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      return diffDays >= node.reviewIntervalDays
    })
    .map((node) => {
      const lastReview = new Date(node.lastReviewDate! + 'T00:00:00')
      const diffMs = todayDate.getTime() - lastReview.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      return {
        nodeId: node.id,
        category: node.category,
        tags: node.tags,
        daysOverdue: diffDays - node.reviewIntervalDays,
      }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}

export function getReviewableQuestIds(
  nodesDueForReview: ReviewableNode[],
  allQuests: { id: number; category: string; tags: string[] }[]
): number[] {
  const matched = new Set<number>()

  for (const node of nodesDueForReview) {
    const categoryQuests = allQuests.filter(
      (q) => q.category === node.category
    )
    const tagMatched = categoryQuests.filter((q) =>
      q.tags.some((t) => node.tags.includes(t))
    )
    const matchedForNode = new Set<number>()
    for (const q of tagMatched) {
      matchedForNode.add(q.id)
    }
    if (matchedForNode.size === 0 && categoryQuests.length > 0) {
      matchedForNode.add(categoryQuests[0]!.id)
    }
    for (const id of matchedForNode) matched.add(id)
  }

  return Array.from(matched)
}
