import type { Quest, ReferenceSource } from '@/store/models'
import { resolveQuestReferenceInput } from '@/utils/resolveQuestReferenceInput'

export const REFERENCE_SOURCES: ReferenceSource[] = ['pinterest', 'youtube', 'artstation', 'google']

export function isReferenceSource(value: unknown): value is ReferenceSource {
  return typeof value === 'string' && (REFERENCE_SOURCES as string[]).includes(value)
}

function normalizeQuery(parts: string[]): string {
  return parts.map((p) => p.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

function baseQuestTerms(quest: Pick<Quest, 'category' | 'tags' | 'referenceQuery'>): string {
  const explicit = quest.referenceQuery?.trim()
  if (explicit) return explicit
  return normalizeQuery([quest.category.replace(/_/g, ' '), ...quest.tags])
}

function stripReferenceIntent(query: string): string {
  return query
    .replace(/\bart references?\b/gi, ' ')
    .replace(/\breferences?\b/gi, ' ')
    .replace(/\btutorials?\b/gi, ' ')
    .replace(/\bstep by step\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildReferenceQuery(
  quest: Pick<Quest, 'id' | 'category' | 'tags' | 'referenceQuery'>,
  source: ReferenceSource,
  phaseIndex?: number,
): string {
  const input = resolveQuestReferenceInput(quest, phaseIndex)
  const base = baseQuestTerms(input)
  const subject = stripReferenceIntent(base) || base

  switch (source) {
    case 'youtube':
      return normalizeQuery([subject, 'tutorial step by step'])
    case 'artstation':
      return normalizeQuery([subject, 'concept art illustration'])
    case 'google':
      return input.referenceQuery?.trim() || normalizeQuery([subject, 'art reference'])
    case 'pinterest':
    default:
      return input.referenceQuery?.trim() || normalizeQuery([subject, 'reference'])
  }
}

export function buildReferenceSourceUrl(source: ReferenceSource, query: string): string {
  const q = encodeURIComponent(query.trim())
  switch (source) {
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${q}`
    case 'artstation':
      return `https://www.artstation.com/search?query=${q}`
    case 'google':
      return `https://images.google.com/search?tbm=isch&q=${q}`
    case 'pinterest':
    default:
      return `https://www.pinterest.com/search/pins/?q=${q}`
  }
}
