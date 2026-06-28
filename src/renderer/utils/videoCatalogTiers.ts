import type { QuestCategory } from '@/data/skillTree'
import type { VideoResource } from '@/data/videoResources'
import { isCoreCatalogVideo } from '@/data/videoResources'

export type StartHereContext = {
  category: QuestCategory | 'all'
  nodeId: string | null
  /** Skill-node tags (from SKILL_TREE_NODES). */
  nodeTags: string[]
  /** Quest or deep-link tags — used for relevance, not hard filtering. */
  preferredTags: string[]
  /** Favorited catalog row ids — hoisted to top of the filtered list. */
  favoriteIds?: string[]
}

const BEGINNER_TITLE_SIGNALS = [
  'beginner',
  'beginners',
  'basics',
  'basic',
  'fundamental',
  'fundamentals',
  'introduction',
  'intro',
  'getting started',
  'start drawing',
  'learn to draw',
  'how to draw',
  'how to start',
  'roadmap',
  'step by step',
  'essential',
  'essentials',
  'first steps',
  'tutorial for',
  'for beginners',
  'master drawing',
  'simple steps',
  'начинающ',
  'основ',
  'введение',
  'урок для',
  'с нуля',
  'первые шаги',
]

const ADVANCED_TITLE_SIGNALS = [
  'advanced',
  'masterclass',
  'critique',
  'timelapse',
  'time lapse',
  'speedpaint',
  'speed paint',
  'process only',
  'portfolio review',
  'pro tips only',
  'interview',
  'podcast',
  'livestream',
  'профессионал',
  'разбор работ',
  'таймлапс',
]

const START_HERE_TARGET = 6
const START_HERE_MIN = 4
const START_HERE_MAX = 8

export function normTag(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

export function filterTagSuggestions(tags: string[], query: string, limit = 10): string[] {
  const q = query.trim()
  if (!q) return tags.slice(0, limit)
  return tags.filter((tag) => tagsMatchFuzzy(tag, q)).slice(0, limit)
}

function tagTokens(value: string): string[] {
  return normTag(value)
    .split(/[,;_+\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
}

export function tagsMatchFuzzy(a: string, b: string): boolean {
  const na = normTag(a)
  const nb = normTag(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  const ta = tagTokens(a)
  const tb = tagTokens(b)
  return ta.some((x) => tb.some((y) => x === y || x.includes(y) || y.includes(x)))
}

function titleBlob(r: VideoResource): string {
  return `${r.titleEn} ${r.titleRu}`.toLowerCase()
}

function countTagOverlap(videoTags: string[], contextTags: string[], title: string): number {
  let hits = 0
  for (const ctxTag of contextTags) {
    for (const vt of videoTags) {
      if (tagsMatchFuzzy(ctxTag, vt)) hits += 2
    }
    const n = normTag(ctxTag).replace(/_/g, ' ')
    if (n.length > 2 && title.includes(n)) hits += 3
  }
  return hits
}

/** Favorited videos first while preserving relative order within each group. */
export function sortCatalogFavoritesFirst(
  videos: VideoResource[],
  favoriteIds: string[],
): VideoResource[] {
  if (favoriteIds.length === 0) return videos
  const fav = new Set(favoriteIds)
  const starred: VideoResource[] = []
  const rest: VideoResource[] = []
  for (const r of videos) {
    if (fav.has(r.id)) starred.push(r)
    else rest.push(r)
  }
  return [...starred, ...rest]
}

/** Relevance score for “Start here” — higher = better intro/tutorial fit. */
export function scoreStartHereVideo(r: VideoResource, ctx: StartHereContext): number {
  let score = 0
  const title = titleBlob(r)

  if (ctx.favoriteIds?.includes(r.id)) score += 1000

  if (isCoreCatalogVideo(r)) score += 55
  if (ctx.nodeId && r.nodeIds.includes(ctx.nodeId)) score += 35
  if (ctx.category !== 'all' && r.category === ctx.category) score += 8

  const contextTags = [...new Set([...ctx.nodeTags, ...ctx.preferredTags])]
  score += countTagOverlap(r.tags, contextTags, title) * 4

  for (const kw of BEGINNER_TITLE_SIGNALS) {
    if (title.includes(kw)) score += 9
  }

  if (r.tags.some((t) => tagsMatchFuzzy(t, 'tutorial'))) score += 6
  if (r.tags.some((t) => tagsMatchFuzzy(t, 'fundamentals') || tagsMatchFuzzy(t, 'basics'))) score += 8
  if (r.tags.some((t) => tagsMatchFuzzy(t, 'roadmap'))) score += 10

  for (const kw of ADVANCED_TITLE_SIGNALS) {
    if (title.includes(kw)) score -= 14
  }

  if (r.tags.includes('curated-youtube-search') || r.tags.includes('youtube-prefetch')) score += 3

  return score
}

export function parsePreferredTagsFromSearchParams(params: URLSearchParams): string[] {
  const multi = params.get('tags')
  if (multi) {
    return [...new Set(multi.split(',').map((t) => t.trim()).filter(Boolean))]
  }
  const single = params.get('tag')
  return single?.trim() ? [single.trim()] : []
}

/** Split catalog into Start-here picks vs extended list when a skill node is selected. */
export function partitionStartHereCatalog(
  videos: VideoResource[],
  ctx: StartHereContext,
): { startHere: VideoResource[]; extended: VideoResource[] } {
  if (videos.length === 0) return { startHere: [], extended: [] }

  if (!ctx.nodeId) {
    const startHere: VideoResource[] = []
    const extended: VideoResource[] = []
    for (const r of videos) {
      if (isCoreCatalogVideo(r)) startHere.push(r)
      else extended.push(r)
    }
    return { startHere, extended }
  }

  const ranked = [...videos]
    .map((r) => ({ r, score: scoreStartHereVideo(r, ctx) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (isCoreCatalogVideo(a.r) !== isCoreCatalogVideo(b.r)) {
        return isCoreCatalogVideo(a.r) ? -1 : 1
      }
      return a.r.titleEn.localeCompare(b.r.titleEn)
    })

  const pickCount = Math.min(
    START_HERE_MAX,
    Math.max(START_HERE_MIN, Math.min(START_HERE_TARGET, ranked.length)),
  )
  const startHere = ranked.slice(0, pickCount).map((x) => x.r)
  const startIds = new Set(startHere.map((r) => r.id))
  const extended = ranked.slice(pickCount).map((x) => x.r).filter((r) => !startIds.has(r.id))

  return { startHere, extended }
}

export function videoTagMatchesPreferred(videoTags: string[], preferredTags: string[]): boolean {
  if (preferredTags.length === 0) return true
  return preferredTags.some((pt) => videoTags.some((vt) => tagsMatchFuzzy(pt, vt)))
}
