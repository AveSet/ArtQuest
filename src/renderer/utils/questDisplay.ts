import type { Quest, QuestTitleOverrides } from '@/store/models'
import type { Language } from '@/i18n/translations'
import { getQuestTitle } from '@/i18n'

export function resolveQuestTitle(
  quest: Pick<Quest, 'id' | 'title'>,
  lang: Language,
  overrides?: QuestTitleOverrides,
): string {
  const custom = overrides?.[quest.id]?.[lang]?.trim()
  if (custom) return custom
  return getQuestTitle(quest.title, lang)
}
