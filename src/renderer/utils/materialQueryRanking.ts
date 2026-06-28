import type { VideoResource } from '@/data/videoResources'

/** Score external query cards by overlap with preferred tags and active tag. */
export function scoreExternalResourceRelevance(
  resource: VideoResource,
  preferredTags: string[],
  activeTag: string | null,
): number {
  const blob = `${resource.titleEn} ${resource.titleRu} ${(resource.tags ?? []).join(' ')} ${resource.channelLabelOverride ?? ''}`.toLowerCase()
  let score = 0
  const tags = [...preferredTags, ...(activeTag ? [activeTag] : [])]
  for (const t of tags) {
    const norm = t.trim().toLowerCase()
    if (!norm) continue
    if (blob.includes(norm)) score += 3
    const words = norm.split(/\s+/)
    for (const w of words) {
      if (w.length >= 3 && blob.includes(w)) score += 1
    }
  }
  return score
}

export function sortByExternalRelevance(
  rows: VideoResource[],
  preferredTags: string[],
  activeTag: string | null,
): VideoResource[] {
  return [...rows].sort(
    (a, b) =>
      scoreExternalResourceRelevance(b, preferredTags, activeTag) -
      scoreExternalResourceRelevance(a, preferredTags, activeTag),
  )
}
