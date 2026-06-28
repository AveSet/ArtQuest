import type { Quest } from '@/store/models'
import type { Language } from '@/i18n/translations'
import type { QuestCategory } from '@/data/skillTree'
import type { NodeYoutubeSearchInput } from '@/utils/nodeYoutubeSearchQueries'
import {
  buildCompositeMaterialSearchQuery,
  EXTERNAL_MATERIAL_SEARCH_LANG,
  type ExternalMaterialSite,
} from '@/utils/materialTagSearchQueries'
import { clipStudioTipsSearchUrl, sketchfabSearchUrl } from '@/utils/materialExternalCatalog'
import { buildQuestPinterestUrl, buildSkillNodePinterestUrl } from '@/utils/questPinterestUrl'
import type { ContextualSearchTitle } from '@/utils/contextualMaterialSearch'

function materialQuery(
  tags: string[],
  node: NodeYoutubeSearchInput | null,
  category: QuestCategory,
  lang: Language,
  site: ExternalMaterialSite,
  questTitle?: ContextualSearchTitle | null,
): string {
  return buildCompositeMaterialSearchQuery(
    {
      node,
      tag: null,
      preferredTags: tags,
      search: '',
      category,
      lang,
      questTitle: questTitle ?? null,
    },
    site,
  )
}

export function buildQuestClipTipsUrl(quest: Pick<Quest, 'category' | 'tags' | 'title'>, _lang: Language): string {
  return clipStudioTipsSearchUrl(
    materialQuery(quest.tags, null, quest.category, EXTERNAL_MATERIAL_SEARCH_LANG, 'clipTips', quest.title),
  )
}

export function buildQuestSketchfabUrl(
  quest: Pick<Quest, 'category' | 'tags' | 'title'>,
  _lang: Language = 'en',
): string {
  return sketchfabSearchUrl(
    materialQuery(quest.tags, null, quest.category, EXTERNAL_MATERIAL_SEARCH_LANG, 'sketchfab', quest.title),
  )
}

export function buildSkillNodeClipTipsUrl(
  node: NodeYoutubeSearchInput & { tags: string[] },
  _lang: Language,
): string {
  return clipStudioTipsSearchUrl(
    materialQuery(node.tags, node, node.category, EXTERNAL_MATERIAL_SEARCH_LANG, 'clipTips'),
  )
}

export function buildSkillNodeSketchfabUrl(
  node: NodeYoutubeSearchInput & { tags: string[] },
  _lang: Language = 'en',
): string {
  return sketchfabSearchUrl(
    materialQuery(node.tags, node, node.category, EXTERNAL_MATERIAL_SEARCH_LANG, 'sketchfab'),
  )
}

export { buildQuestPinterestUrl, buildSkillNodePinterestUrl }
