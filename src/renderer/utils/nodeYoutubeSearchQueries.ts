import type { QuestCategory } from '../data/skillTree'
import type { Language } from '../i18n/translations'
import { buildContextualMaterialSearchQuery } from '@/utils/contextualMaterialSearch'
import type { ContextualSearchTitle } from '@/utils/contextualMaterialSearch'

/** Skill node subset needed to build Global YouTube Search queries (matches Resources.tsx behavior). */
export type NodeYoutubeSearchInput = Pick<
  { category: QuestCategory; title: { en: string; ru?: string }; tags: string[] },
  'category' | 'title' | 'tags'
>

export type YoutubeSearchContext = {
  preferredTags?: string[]
  activeTag?: string | null
  search?: string
  lang?: Language
  questTitle?: ContextualSearchTitle | null
}

/**
 * Web-search queries for Materials → YouTube search buttons and the curation script.
 * Biased toward beginner-friendly tutorials; respects preferred tags when provided.
 */
export function buildNodeYoutubeSearchQueries(
  node: NodeYoutubeSearchInput,
  ctx: YoutubeSearchContext = {},
): string[] {
  const primary = buildContextualMaterialSearchQuery(
    {
      questTitle: ctx.questTitle,
      node,
      preferredTags: ctx.preferredTags ?? [],
      tag: ctx.activeTag ?? null,
      search: ctx.search ?? '',
      category: node.category,
      lang: ctx.lang,
    },
    'youtube',
  )
  const title = node.title.en
  const fallback = `${title} tutorial`.replace(/\s+/g, ' ').trim()
  return [...new Set([primary, fallback].filter(Boolean))].slice(0, 3)
}
