import type { Quest } from '@/store/models'
import type { VideoResource } from '@/data/videoResources'

export function pickQuestVideoResources(
  quest: Pick<Quest, 'tags' | 'category'>,
  catalog: readonly VideoResource[],
  limit = 3,
): VideoResource[] {
  const questTags = new Set(quest.tags.map((t) => t.toLowerCase()))
  const scored = catalog
    .map((v) => {
      const tags = [...(v.tags ?? []), ...(v.nodeIds ?? [])]
      const overlap = tags.filter((t) => questTags.has(t.toLowerCase())).length
      const categoryMatch = v.category === quest.category ? 2 : 0
      return { v, score: overlap * 3 + categoryMatch }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((x) => x.v)
}
