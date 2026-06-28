import type { Quest } from '@/store/models'
import type { Language } from '@/i18n/translations'
import { buildCompositeMaterialSearchQuery } from '@/utils/materialTagSearchQueries'
import { pinterestSearchUrl } from '@/utils/materialExternalCatalog'
import type { QuestCategory } from '@/data/skillTree'
import { buildReferenceQuery } from '@/utils/buildReferenceQuery'

type QuestReferenceSearchInput = Pick<Quest, 'category' | 'tags' | 'referenceQuery'>

function questPinterestContext(
  tags: string[],
  category: QuestCategory,
  lang: Language,
  node: { category: QuestCategory; title: { en: string; ru?: string }; tags: string[] } | null,
) {
  return {
    node,
    tag: null,
    preferredTags: tags,
    search: '',
    category,
    lang,
    questTitle: null,
  }
}

/** Technical external reference query from quest metadata; never uses the display title. */
export function buildQuestReferenceSearchQuery(quest: QuestReferenceSearchInput): string {
  return buildReferenceQuery(quest, 'pinterest')
}

/** Pinterest search URL from quest reference metadata. */
export function buildQuestPinterestUrl(
  quest: QuestReferenceSearchInput,
  _language: Language = 'en',
): string {
  return pinterestSearchUrl(buildQuestReferenceSearchQuery(quest))
}

export function buildSkillNodePinterestUrl(
  node: { tags: string[]; title: { en: string; ru?: string }; category: QuestCategory },
  language: Language = 'en',
): string {
  const q = buildCompositeMaterialSearchQuery(
    questPinterestContext(node.tags, node.category, language, node),
    'pinterest',
  )
  return pinterestSearchUrl(q)
}
