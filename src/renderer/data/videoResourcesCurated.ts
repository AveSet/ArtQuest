/**
 * Extended video catalog (auto-curated YouTube). Loaded on demand — see loadVideoCatalog.ts.
 */
import { CORE_VIDEO_RESOURCES, type VideoResource } from './videoResources'

const CORE_VIDEO_YOUTUBE_IDS_BY_NODE_ID = (() => {
  const m = new Map<string, Set<string>>()
  for (const v of CORE_VIDEO_RESOURCES) {
    for (const nid of v.nodeIds) {
      let s = m.get(nid)
      if (!s) {
        s = new Set<string>()
        m.set(nid, s)
      }
      s.add(v.youtubeId)
    }
  }
  return m
})()

function isAutoSupersededByCore(skillNodeId: string, youtubeId: string): boolean {
  return CORE_VIDEO_YOUTUBE_IDS_BY_NODE_ID.get(skillNodeId)?.has(youtubeId) ?? false
}

type AutoCuratedEntry = {
  skillNodeId: string
  youtubeId: string
  titleEn: string
  titleRu?: string
  category: VideoResource['category']
  tags: string[]
}

function expandCuratedSearchVideos(entries: AutoCuratedEntry[]): VideoResource[] {
  return entries
    .filter((e) => !isAutoSupersededByCore(e.skillNodeId, e.youtubeId))
    .map((e) => ({
      id: `auto-yt-${e.skillNodeId}-${e.youtubeId}`,
      youtubeId: e.youtubeId,
      titleEn: e.titleEn,
      titleRu: e.titleRu || e.titleEn,
      channelKey: 'youtube_curated_mix' as const,
      category: e.category,
      nodeIds: [e.skillNodeId],
      tags: [...new Set([...e.tags, 'curated-youtube-search'])].slice(0, 14),
      chapters: [{ labelEn: 'Full video', labelRu: 'Весь ролик', startSec: 0 }],
    }))
}

/** Auto-curated rows only (separate chunk from core catalog). */
export async function buildExtendedVideoCatalog(): Promise<VideoResource[]> {
  const { AUTO_CURATED_YOUTUBE_RESOURCES } = await import('./autoCuratedYoutubeResources')
  return expandCuratedSearchVideos(AUTO_CURATED_YOUTUBE_RESOURCES)
}

/** Full catalog (core + extended). */
export async function buildFullVideoCatalog(): Promise<VideoResource[]> {
  const extended = await buildExtendedVideoCatalog()
  return [...CORE_VIDEO_RESOURCES, ...extended]
}
