import type { Quest } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import { tokenizeTitleForTags } from '@/utils/tokenizeTitleForTags'
import { assessTitleComplexity } from '@/utils/questTitleComplexity'

/** Tags aligned with built-in quests: skill, category, difficulty, digital, title keywords. */
export function buildUserQuestTags(
  title: string,
  category: QuestCategory,
  difficulty: Quest['difficulty'],
  skillNodeTags: string[],
): string[] {
  const tags = new Set<string>()
  for (const t of skillNodeTags) tags.add(t.toLowerCase())
  tags.add(category)
  tags.add(difficulty)
  tags.add('digital')
  tags.add('custom')
  for (const t of tokenizeTitleForTags(title, 6)) tags.add(t)
  for (const t of assessTitleComplexity(title, category).inferredTags) tags.add(t)
  return [...tags]
}
