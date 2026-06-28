import type { QuestCategory } from '@/data/skillTree'
import type { Language } from '@/i18n/translations'
import type { NodeYoutubeSearchInput } from '@/utils/nodeYoutubeSearchQueries'
import {
  buildContextualMaterialSearchQueries,
  buildContextualMaterialSearchQuery,
  type ContextualSearchTitle,
} from '@/utils/contextualMaterialSearch'

export type MaterialTagSearchContext = {
  node: NodeYoutubeSearchInput | null
  tag: string | null
  preferredTags: string[]
  search: string
  category: QuestCategory | 'all'
  lang?: Language
  /** Quest (or practice) title — drives contextual external search. */
  questTitle?: ContextualSearchTitle | null
}

/** Clip Studio / Sketchfab queries use English tags regardless of UI language. */
export const EXTERNAL_MATERIAL_SEARCH_LANG: Language = 'en'

export type ExternalMaterialSite = import('@/utils/contextualMaterialSearch').ContextualMaterialSite

function toContextualInput(ctx: MaterialTagSearchContext) {
  return {
    questTitle: ctx.questTitle,
    node: ctx.node,
    preferredTags: ctx.preferredTags ?? [],
    tag: ctx.tag,
    search: ctx.search ?? '',
    category: ctx.category,
    lang: ctx.lang,
  }
}

/** Best single combined query for external site search (contextual, short). */
export function buildCompositeMaterialSearchQuery(
  ctx: MaterialTagSearchContext,
  site?: ExternalMaterialSite,
): string {
  return buildContextualMaterialSearchQuery(toContextualInput(ctx), site)
}

/** Focused search phrases for external catalogs (max 3 variants). */
export function buildMaterialTagSearchQueries(
  ctx: MaterialTagSearchContext,
  site?: ExternalMaterialSite,
): string[] {
  return buildContextualMaterialSearchQueries(toContextualInput(ctx), site)
}

export function primaryMaterialSearchQuery(ctx: MaterialTagSearchContext): string {
  return buildCompositeMaterialSearchQuery(ctx)
}
