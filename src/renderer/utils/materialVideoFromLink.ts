import { SKILL_TREE_NODES } from '@/data/skillTree'
import type { VideoResource } from '@/data/videoResources'
import type { MaterialCustomLink } from '@/store/models'
import { tokenizeTitleForTags } from '@/utils/tokenizeTitleForTags'

/** Build tags: stored list, else skill-node tags + keywords from title + marker. */
export function buildMaterialVideoTags(
  skillNodeId: string,
  displayTitle: string,
  storedTags?: string[],
): string[] {
  if (storedTags && storedTags.length > 0) {
    return [...new Set(storedTags.map((t) => t.toLowerCase()))].slice(0, 14)
  }
  const node = SKILL_TREE_NODES.find((n) => n.id === skillNodeId)
  const fromTitle = tokenizeTitleForTags(displayTitle)
  const base = [...(node?.tags ?? []), ...fromTitle, 'user-video']
  return [...new Set(base.map((t) => t.toLowerCase()))].slice(0, 14)
}

/** Map a saved Materials link to a catalog row (only when tied to a skill node + YouTube id). */
export function materialYouTubeLinkToVideoResource(link: MaterialCustomLink): VideoResource | null {
  if (!link.youtubeId || !link.skillNodeId) return null
  const node = SKILL_TREE_NODES.find((n) => n.id === link.skillNodeId)
  if (!node) return null
  const tags = buildMaterialVideoTags(link.skillNodeId, link.title, link.tags)
  const isShorts = /(^|\/)shorts\//i.test(link.url)
  return {
    id: link.id,
    youtubeId: link.youtubeId,
    titleEn: link.title,
    titleRu: link.titleRu ?? link.title,
    channelKey: 'youtube_curated_mix',
    category: node.category,
    nodeIds: [link.skillNodeId],
    tags: isShorts ? [...new Set([...tags, 'shorts'])] : tags,
    chapters: [{ labelEn: 'Full video', labelRu: 'Весь ролик', startSec: 0 }],
    channelLabelOverride: link.channelName,
  }
}
