import type { Quest } from '@/store/models'
import type { Language } from '@/i18n/translations'
import { translations } from '@/i18n/translations'
import { getCategoryLabel } from '@/i18n'
import { getMistakeTagLabel } from '@/utils/mistakeTags'
import { fmt } from '@/i18n/dashboardCopy'

function primarySkillTag(quest: Quest): string {
  const priority = ['line', 'perspective', 'proportion', 'gesture', 'timing', 'composition', 'value', 'color']
  for (const p of priority) {
    if (quest.tags.some((t) => t.toLowerCase() === p || t.toLowerCase().includes(p))) {
      return p
    }
  }
  return quest.tags[0] ?? quest.category
}

function truncateOutcome(description: string, maxLen: number): string {
  const oneLine = description.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLen) return oneLine
  const cut = oneLine.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…'
}

export type QuestLearningHint = {
  skillLabel: string
  outcome: string
  line: string
}

function matchingFocusTags(quest: Quest, focusTags: string[]): string[] {
  if (focusTags.length === 0) return []
  const questTags = new Set(quest.tags.map((t) => t.toLowerCase()))
  return focusTags.filter((tag) => {
    const lower = tag.toLowerCase()
    return questTags.has(lower) || [...questTags].some((qt) => qt.includes(lower) || lower.includes(qt))
  })
}

export function buildQuestLearningHint(
  quest: Quest,
  language: Language,
  description: string,
  focusTags: string[] = [],
): QuestLearningHint {
  const skillKey = primarySkillTag(quest)
  const skillLabel = getMistakeTagLabel(skillKey, language)
  const categoryLabel = getCategoryLabel(quest.category, language)
  const maxLen = language === 'ru' ? 72 : 88
  const outcome = truncateOutcome(description, maxLen)
  const template =
    translations[language]?.quests?.learningHintLine ??
    translations.en.quests.learningHintLine ??
    'Trains: {skill} · {category} · ~{minutes} min · {outcome}'
  let line = fmt(template, {
    skill: skillLabel,
    category: categoryLabel,
    minutes: quest.estimatedTime,
    outcome,
  })
  const matched = matchingFocusTags(quest, focusTags)
  if (matched.length > 0) {
    const focusSuffix =
      translations[language]?.quests?.learningHintFocusSuffix ??
      translations.en.quests.learningHintFocusSuffix ??
      ' · Focus: {tags}'
    const labels = matched.slice(0, 3).map((tag) => getMistakeTagLabel(tag, language))
    line += fmt(focusSuffix, { tags: labels.join(', ') })
  }
  return { skillLabel, outcome, line }
}
