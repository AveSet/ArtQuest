import type { VideoResource } from '@/data/videoResources'
import type { QuestCategory } from '@/data/skillTree'
import { buildNodeYoutubeSearchQueries, type NodeYoutubeSearchInput } from '@/utils/nodeYoutubeSearchQueries'

const SHORTS_CHAPTER = [{ labelEn: 'Shorts', labelRu: 'Shorts', startSec: 0 }]

export type SkillNodeForShortsSearch = NodeYoutubeSearchInput & { id: string }

export function isShortsTaggedResource(r: VideoResource): boolean {
  return (
    r.tags?.includes('shorts') ||
    /(^|\s)#shorts(\s|$)/i.test(r.titleEn) ||
    /(^|\s)#shorts(\s|$)/i.test(r.titleRu)
  )
}

export function isShortsQueryResource(r: VideoResource): boolean {
  return r.id.startsWith('shorts-query-')
}

/** Search query stored on shorts discovery rows (channelLabelOverride). */
export function shortsSearchQueryForResource(r: VideoResource): string | null {
  if (!isShortsQueryResource(r)) return null
  return r.channelLabelOverride?.trim() || null
}

/**
 * Synthetic catalog rows for Shorts mode: one card per node search query,
 * opens YouTube results filtered to Shorts (same filters as long-form catalog).
 */
export function buildShortsQueryResources(nodes: SkillNodeForShortsSearch[]): VideoResource[] {
  const rows: VideoResource[] = []
  for (const node of nodes) {
    for (const [qi, q] of buildNodeYoutubeSearchQueries(node).entries()) {
      const searchQ = `${q} #shorts`
      rows.push({
        id: `shorts-query-${node.id}-${qi}`,
        youtubeId: '',
        titleEn: `Shorts · ${q}`,
        titleRu: `Shorts · ${q}`,
        channelKey: 'youtube_curated_mix',
        category: node.category as QuestCategory,
        nodeIds: [node.id],
        tags: ['shorts', 'shorts-search', ...node.tags.slice(0, 3)],
        chapters: SHORTS_CHAPTER,
        channelLabelOverride: searchQ,
      })
    }
  }
  return rows
}
