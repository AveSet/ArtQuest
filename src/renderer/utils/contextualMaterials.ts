import type { Quest } from '@/store/models'
import type { VideoResource } from '@/data/videoResources'
import { filterVideoResources } from '@/data/videoResources'
import { relatedQuestTagsForMistakes } from '@/utils/mistakeTags'

export type ContextualMaterialPack = {
  primary: VideoResource | null
  shortDemo: VideoResource | null
  reference: VideoResource | null
}

function engagementBoost(
  resourceId: string,
  engagement?: Record<string, 'viewed' | 'helpful' | 'applied'>,
): number {
  const status = engagement?.[resourceId]
  if (status === 'applied') return 8
  if (status === 'helpful') return 5
  if (status === 'viewed') return -2
  return 0
}

function scoreResource(
  r: VideoResource,
  tags: string[],
  nodeIds: string[],
  engagement?: Record<string, 'viewed' | 'helpful' | 'applied'>,
): number {
  let score = engagementBoost(r.id, engagement)
  for (const tag of tags) {
    if (r.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) score += 3
    if (r.tags.some((t) => t.includes(tag) || tag.includes(t))) score += 1
  }
  for (const nodeId of nodeIds) {
    if (r.nodeIds.includes(nodeId)) score += 5
  }
  return score
}

/** Up to 3 curated videos for a quest or weak-focus tag (theory, short, reference). */
export function pickContextualMaterials(
  catalog: VideoResource[],
  opts: {
    quest?: Quest
    preferredTags?: string[]
    category?: Quest['category'] | 'all'
    nodeId?: string | null
    maxEach?: number
    materialEngagement?: Record<string, 'viewed' | 'helpful' | 'applied'>
  },
): ContextualMaterialPack {
  const quest = opts.quest
  const tags = [
    ...(opts.preferredTags ?? []),
    ...(quest?.tags ?? []),
    ...relatedQuestTagsForMistakes(opts.preferredTags ?? []),
  ]
  const nodeIds = opts.nodeId ? [opts.nodeId] : []
  const category = opts.category ?? quest?.category ?? 'all'

  const filtered = filterVideoResources(catalog, {
    category: category === 'all' ? 'all' : category,
    nodeId: opts.nodeId ?? null,
    tag: null,
    search: '',
  })

  const ranked = [...filtered]
    .map((r) => ({ r, score: scoreResource(r, tags, nodeIds, opts.materialEngagement) }))
    .filter((x) => x.score > 0 || tags.length === 0)
    .sort((a, b) => b.score - a.score || a.r.titleEn.localeCompare(b.r.titleEn))

  const used = new Set<string>()
  const take = (predicate: (r: VideoResource) => boolean): VideoResource | null => {
    for (const { r } of ranked) {
      if (used.has(r.id)) continue
      if (predicate(r)) {
        used.add(r.id)
        return r
      }
    }
    for (const { r } of ranked) {
      if (used.has(r.id)) continue
      used.add(r.id)
      return r
    }
    return null
  }

  const primary = take((r) => r.chapters.length > 0 || r.tags.includes('fundamentals') || r.tags.includes('roadmap'))
  const shortDemo = take((r) =>
    r.tags.some((t) => ['short', 'demo', 'quick', 'tips'].includes(t)) ||
    r.titleEn.toLowerCase().includes('short'),
  )
  const reference = take((r) =>
    r.tags.some((t) => ['reference', 'study', 'copy'].includes(t)),
  )

  return { primary, shortDemo, reference }
}
