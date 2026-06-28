import type { Language } from '@/i18n/languages'
import type { Achievement, CompletedWork, QuestCompletionLog, SkillNode } from '@/store/models'
import { NODE_MAX_LEVEL } from '@/utils/progressionBalance'
import { effectiveNodeLevel } from '@/utils/skillUnlocks'

function loc(ru: string, en: string): Record<Language, string> {
  return { ru, en, zh: en, 'zh-tw': en, ja: en, ko: en }
}

/** Milestones tied to reflection, portfolio growth, and deliberate practice — not raw log count. */
export const QUALITY_ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  {
    id: 'quality_reflection_5',
    title: loc('Осознанная практика', 'Mindful practice'),
    description: loc('Завершите 5 квестов с самооценкой после работы', 'Complete 5 quests with post-session self-feedback'),
    icon: '🪞',
  },
  {
    id: 'quality_reflection_strong_10',
    title: loc('Честная самооценка', 'Honest self-review'),
    description: loc('10 сессий со средней оценкой критериев ≥ 3.5', '10 sessions with average criterion rating ≥ 3.5'),
    icon: '⭐',
  },
  {
    id: 'portfolio_self_review_5',
    title: loc('Заметки роста', 'Growth notes'),
    description: loc('Добавьте заметки «что улучшить» к 5 работам в галерее', 'Add “what to improve” notes on 5 gallery works'),
    icon: '📝',
  },
  {
    id: 'portfolio_tagged_8',
    title: loc('Разбор ошибок', 'Mistake mapping'),
    description: loc('Отметьте 8 работ тегами ошибок или фокуса', 'Tag 8 works with mistake or focus tags'),
    icon: '🏷️',
  },
  {
    id: 'growth_before_after_3',
    title: loc('До и после', 'Before & after'),
    description: loc('Сохраните 2+ версии работы для 3 разных квестов', 'Save 2+ versions for 3 different quests'),
    icon: '🔄',
  },
  {
    id: 'growth_before_after_10',
    title: loc('Итерации мастера', 'Iteration master'),
    description: loc('10 квестов с несколькими сохранёнными работами', '10 quests with multiple saved works'),
    icon: '📈',
  },
  {
    id: 'deliberate_practice_10',
    title: loc('Глубокая сессия', 'Deep session'),
    description: loc('10 квестов с ≥10 минут практики в таймере', '10 quests with ≥10 minutes logged practice time'),
    icon: '⏱️',
  },
  {
    id: 'material_helpful_3',
    title: loc('Полезный ресурс', 'Helpful resource'),
    description: loc('Отметьте 3 материала как «помогло»', 'Mark 3 learning materials as helpful'),
    icon: '📚',
  },
  {
    id: 'material_applied_5',
    title: loc('В деле', 'Applied learning'),
    description: loc('Отметьте 5 материалов как «применил»', 'Mark 5 materials as applied in practice'),
    icon: '✅',
  },
  {
    id: 'mistake_tags_used_8',
    title: loc('Паттерны ошибок', 'Error patterns'),
    description: loc('Используйте 8 разных тегов ошибок в обратной связи', 'Use 8 distinct mistake tags in feedback'),
    icon: '🎯',
  },
  {
    id: 'node_mastered_3',
    title: loc('Ветка закрыта', 'Branch closed'),
    description: loc('Доведите 3 узла навыков до максимального уровня', 'Max out 3 skill tree nodes'),
    icon: '🌳',
  },
  {
    id: 'category_depth_10',
    title: loc('Глубина направления', 'Track depth'),
    description: loc('10 разных квестов в одной категории (без фарма повторов)', '10 unique quests in one category'),
    icon: '🎨',
  },
  {
    id: 'reviewer_revisit_3',
    title: loc('Повтор с паузой', 'Spaced revisit'),
    description: loc('Вернитесь к 3 квестам через ≥7 дней между завершениями', 'Re-complete 3 quests with ≥7 days between runs'),
    icon: '🔁',
  },
  {
    id: 'unique_quest_20',
    title: loc('Исследователь', 'Explorer'),
    description: loc('Завершите 20 разных квестов', 'Complete 20 different quests'),
    icon: '🧭',
  },
]

export interface QualityAchievementStats {
  logsWithFeedback: number
  logsWithStrongCriteria: number
  worksWithImprovementNotes: number
  worksWithTags: number
  questsWithMultipleWorks: number
  deepPracticeLogs: number
  materialHelpful: number
  materialApplied: number
  uniqueMistakeTags: number
  masteredNodes: number
  maxUniqueQuestsInCategory: number
  spacedRevisitQuests: number
  uniqueQuestCount: number
}

function avgCriterionRating(log: QuestCompletionLog): number | null {
  const criteria = log.feedback?.criteria
  if (!criteria?.length) return null
  const sum = criteria.reduce((s, c) => s + c.rating, 0)
  return sum / criteria.length
}

export function computeQualityAchievementStats(
  questCompletionLogs: QuestCompletionLog[],
  completedWorks: CompletedWork[],
  skillNodes: SkillNode[],
  materialEngagement: Record<string, 'viewed' | 'helpful' | 'applied'> = {},
): QualityAchievementStats {
  let logsWithFeedback = 0
  let logsWithStrongCriteria = 0
  const mistakeTagSet = new Set<string>()

  for (const log of questCompletionLogs) {
    if (log.feedback) {
      logsWithFeedback++
      const avg = avgCriterionRating(log)
      if (avg != null && avg >= 3.5) logsWithStrongCriteria++
      for (const tag of log.feedback.mistakeTags ?? []) {
        if (tag.trim()) mistakeTagSet.add(tag)
      }
    }
  }

  const worksWithImprovementNotes = completedWorks.filter(
    (w) => (w.improvementNotes?.trim().length ?? 0) > 0,
  ).length
  const worksWithTags = completedWorks.filter((w) => (w.tags?.length ?? 0) > 0).length

  const worksByQuest = new Map<number, number>()
  for (const w of completedWorks) {
    worksByQuest.set(w.questId, (worksByQuest.get(w.questId) ?? 0) + 1)
  }
  const questsWithMultipleWorks = [...worksByQuest.values()].filter((n) => n >= 2).length

  const deepPracticeLogs = questCompletionLogs.filter((l) => (l.practiceMinutes ?? 0) >= 10).length

  let materialHelpful = 0
  let materialApplied = 0
  for (const status of Object.values(materialEngagement)) {
    if (status === 'helpful') materialHelpful++
    if (status === 'applied') materialApplied++
  }

  const masteredNodes = skillNodes.filter(
    (n) => n.isUnlocked && effectiveNodeLevel(n) >= NODE_MAX_LEVEL,
  ).length

  const uniqueByCategory = new Map<string, Set<number>>()
  for (const log of questCompletionLogs) {
    const cat = log.category
    if (!cat) continue
    if (!uniqueByCategory.has(cat)) uniqueByCategory.set(cat, new Set())
    uniqueByCategory.get(cat)!.add(log.questId)
  }
  const maxUniqueQuestsInCategory = [...uniqueByCategory.values()].reduce(
    (max, set) => Math.max(max, set.size),
    0,
  )

  const logsByQuest = new Map<number, string[]>()
  for (const log of questCompletionLogs) {
    const list = logsByQuest.get(log.questId) ?? []
    list.push(log.completedAt)
    logsByQuest.set(log.questId, list)
  }
  let spacedRevisitQuests = 0
  for (const dates of logsByQuest.values()) {
    if (dates.length < 2) continue
    const sorted = [...dates].sort()
    for (let i = 1; i < sorted.length; i++) {
      const gap =
        (new Date(sorted[i]!).getTime() - new Date(sorted[i - 1]!).getTime()) / 86400000
      if (gap >= 7) {
        spacedRevisitQuests++
        break
      }
    }
  }

  const uniqueQuestCount = new Set(questCompletionLogs.map((l) => l.questId)).size

  return {
    logsWithFeedback,
    logsWithStrongCriteria,
    worksWithImprovementNotes,
    worksWithTags,
    questsWithMultipleWorks,
    deepPracticeLogs,
    materialHelpful,
    materialApplied,
    uniqueMistakeTags: mistakeTagSet.size,
    masteredNodes,
    maxUniqueQuestsInCategory,
    spacedRevisitQuests,
    uniqueQuestCount,
  }
}

export function shouldUnlockQualityAchievement(
  id: string,
  stats: QualityAchievementStats,
): boolean {
  switch (id) {
    case 'quality_reflection_5':
      return stats.logsWithFeedback >= 5
    case 'quality_reflection_strong_10':
      return stats.logsWithStrongCriteria >= 10
    case 'portfolio_self_review_5':
      return stats.worksWithImprovementNotes >= 5
    case 'portfolio_tagged_8':
      return stats.worksWithTags >= 8
    case 'growth_before_after_3':
      return stats.questsWithMultipleWorks >= 3
    case 'growth_before_after_10':
      return stats.questsWithMultipleWorks >= 10
    case 'deliberate_practice_10':
      return stats.deepPracticeLogs >= 10
    case 'material_helpful_3':
      return stats.materialHelpful >= 3
    case 'material_applied_5':
      return stats.materialApplied >= 5
    case 'mistake_tags_used_8':
      return stats.uniqueMistakeTags >= 8
    case 'node_mastered_3':
      return stats.masteredNodes >= 3
    case 'category_depth_10':
      return stats.maxUniqueQuestsInCategory >= 10
    case 'reviewer_revisit_3':
      return stats.spacedRevisitQuests >= 3
    case 'unique_quest_20':
      return stats.uniqueQuestCount >= 20
    default:
      return false
  }
}

export function mergeAchievementCatalog(base: Achievement[]): Achievement[] {
  const ids = new Set(base.map((a) => a.id))
  const extra = QUALITY_ACHIEVEMENT_DEFINITIONS.filter((a) => !ids.has(a.id))
  return [...base, ...extra]
}
