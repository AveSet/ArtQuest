import type { Quest, ReferenceSource } from '@/store/models'
import { resolveQuestReferenceInput } from '@/utils/resolveQuestReferenceInput'
import { buildContextualMaterialSearchQuery } from '@/utils/contextualMaterialSearch'
import {
  clipStudioTipsSearchUrl,
  sketchfabSearchUrl,
} from '@/utils/materialExternalCatalog'
import { youtubeLongSearchUrl, youtubeShortsSearchUrl } from '@/utils/youtubeLinks'
import { EXTERNAL_MATERIAL_SEARCH_LANG } from '@/utils/materialTagSearchQueries'

export const REFERENCE_SOURCES: ReferenceSource[] = [
  'pinterest',
  'youtube',
  'youtube_short',
  'sketchfab',
  'clipTips',
  'google',
]

const MAX_EXPLICIT_QUERY_WORDS = 8

export function normalizeReferenceSource(value: unknown): ReferenceSource {
  if (value === 'artstation') return 'sketchfab'
  if (typeof value === 'string' && (REFERENCE_SOURCES as string[]).includes(value)) {
    return value as ReferenceSource
  }
  return 'pinterest'
}

export function isReferenceSource(value: unknown): value is ReferenceSource | 'artstation' {
  return typeof value === 'string' && ((REFERENCE_SOURCES as string[]).includes(value) || value === 'artstation')
}

function contextualSite(source: ReferenceSource): 'pinterest' | 'youtube' | 'sketchfab' | 'clipTips' {
  if (source === 'sketchfab') return 'sketchfab'
  if (source === 'clipTips') return 'clipTips'
  if (source === 'youtube' || source === 'youtube_short') return 'youtube'
  return 'pinterest'
}

export function buildReferenceQuery(
  quest: Pick<Quest, 'category' | 'tags' | 'referenceQuery' | 'referenceQueries'> &
    Partial<Pick<Quest, 'id' | 'title'>>,
  source: ReferenceSource,
  phaseIndex?: number,
): string {
  const normalized = normalizeReferenceSource(source)
  const perSource = quest.referenceQueries?.[normalized]
  if (perSource?.trim()) return perSource.trim()

  const input = resolveQuestReferenceInput(
    { id: quest.id ?? 0, category: quest.category, tags: quest.tags, referenceQuery: quest.referenceQuery },
    phaseIndex,
  )
  const explicit = input.referenceQuery?.trim()
  if (explicit && explicit.split(/\s+/).filter(Boolean).length <= MAX_EXPLICIT_QUERY_WORDS) {
    return explicit
  }

  const site = contextualSite(normalized)
  const lang =
    site === 'clipTips' || site === 'sketchfab' ? EXTERNAL_MATERIAL_SEARCH_LANG : undefined

  let query = buildContextualMaterialSearchQuery(
    {
      questTitle: quest.title ?? null,
      node: null,
      preferredTags: input.tags,
      tag: null,
      search: '',
      category: input.category,
      lang,
    },
    site,
  )

  if (normalized === 'youtube_short') {
    query = query.split(/\s+/).slice(0, 3).join(' ')
  }

  if (normalized === 'google' && !/\breference\b/i.test(query)) {
    query = `${query} reference`.replace(/\s+/g, ' ').trim()
  }

  return query
}

export function buildReferenceSourceUrl(source: ReferenceSource, query: string): string {
  const normalized = normalizeReferenceSource(source)
  const trimmed = query.trim()
  switch (normalized) {
    case 'youtube':
      return youtubeLongSearchUrl(trimmed)
    case 'youtube_short':
      return youtubeShortsSearchUrl(trimmed)
    case 'sketchfab':
      return sketchfabSearchUrl(trimmed)
    case 'clipTips':
      return clipStudioTipsSearchUrl(trimmed)
    case 'google':
      return `https://images.google.com/search?tbm=isch&q=${encodeURIComponent(trimmed)}`
    case 'pinterest':
    default:
      return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(trimmed)}`
  }
}
