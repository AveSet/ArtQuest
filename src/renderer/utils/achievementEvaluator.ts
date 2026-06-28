import type { Achievement, Quest, QuestCompletionLog, CompletedWork, SkillNode, Skill } from '@/store/models'
import { SKILL_TREE_NODES } from '@/data/skillTree'
import { effectiveNodeLevel } from '@/utils/skillUnlocks'
import { countUniqueQuestsPerCategory } from '@/utils/questLogDerivedStats'
import achievementsData from '@/data/achievements.json'
import {
  computeQualityAchievementStats,
  mergeAchievementCatalog,
  shouldUnlockQualityAchievement,
} from '@/utils/qualityAchievements'
import { countConsecutiveCategoryDays } from '@/utils/dailyQuests'

export type AchievementEvaluationInput = {
  completedQuests: Quest[]
  completedWorks: CompletedWork[]
  streak: number
  questCompletionLogs: QuestCompletionLog[]
  materialEngagement: Record<string, 'viewed' | 'helpful' | 'applied'>
}

export type AchievementEvaluationState = {
  skillNodes: SkillNode[]
  legacySkills: Skill[]
  achievements: Achievement[]
}

/** Returns newly unlocked visible achievements (does not mutate store). */
export function evaluateVisibleAchievementUnlocks(
  opts: AchievementEvaluationInput,
  state: AchievementEvaluationState,
): Achievement[] {
  const newUnlocks: Achievement[] = []
  const { completedQuests: allQuests, completedWorks, streak, questCompletionLogs, materialEngagement } = opts
  const questsLookup = new Map(allQuests.map((q) => [q.id, q]))
  const questCount = questCompletionLogs.length
  const categoryQuestCount = countUniqueQuestsPerCategory(questCompletionLogs, questsLookup)

  const allCategories = ['drawing', 'anatomy', 'animation', 'effects', 'storytelling', 'character_design', 'environment']

  const nodeMaxLevel = (cat: string) => {
    const nodes = state.skillNodes.filter((n) => n.category === cat)
    return nodes.length > 0
      ? Math.max(...nodes.map(effectiveNodeLevel))
      : state.legacySkills.find((s) => s.category === cat)?.level ?? 0
  }

  const nodeTotalLevel = (cat: string) => {
    const nodes = state.skillNodes.filter((n) => n.category === cat)
    return nodes.length > 0
      ? nodes.reduce((sum, n) => sum + effectiveNodeLevel(n), 0)
      : state.legacySkills.find((s) => s.category === cat)?.level ?? 0
  }

  const unlockedNodes = state.skillNodes.filter((n) => n.isUnlocked).length

  const dateOnly = (d: string) => d.slice(0, 10)
  const questDates = questCompletionLogs.map((l) => dateOnly(l.completedAt))
  const dayCounts: Record<string, number> = {}
  for (const d of questDates) {
    dayCounts[d] = (dayCounts[d] || 0) + 1
  }

  const difficultiesCovered = new Set(
    questCompletionLogs
      .map((l) => {
        const q = questsLookup.get(l.questId)
        return q?.difficulty
      })
      .filter(Boolean),
  )

  const totalXpEarned = questCompletionLogs.reduce((sum, l) => sum + l.xpEarned, 0)
  const uniqueQuestIds = new Set(questCompletionLogs.map((l) => l.questId))

  const qualityStats = computeQualityAchievementStats(
    questCompletionLogs,
    completedWorks,
    state.skillNodes,
    materialEngagement,
  )

  const catalog = mergeAchievementCatalog(achievementsData as Achievement[])
  const allAchievements = catalog.map((a) => {
    const existing = state.achievements.find((ach) => ach.id === a.id)
    return existing ?? { ...a, unlocked: false }
  })

  for (const ach of allAchievements) {
    if (ach.unlocked) continue
    let shouldUnlock = false

    switch (ach.id) {
      case 'first_quest': shouldUnlock = questCount >= 1; break
      case 'two_quests': shouldUnlock = questCount >= 2; break
      case 'three_quests': shouldUnlock = questCount >= 3; break
      case 'five_quests': shouldUnlock = questCount >= 5; break
      case 'ten_quests': shouldUnlock = questCount >= 10; break
      case 'fifteen_quests': shouldUnlock = questCount >= 15; break
      case 'twentyfive_quests': shouldUnlock = questCount >= 25; break
      case 'thirty_quests': shouldUnlock = questCount >= 30; break
      case 'fifty_quests': shouldUnlock = questCount >= 50; break
      case 'seventyfive_quests': shouldUnlock = questCount >= 75; break
      case 'hundred_quests': shouldUnlock = questCount >= 100; break
      case 'onefifty_quests': shouldUnlock = questCount >= 150; break
      case 'twohundred_quests': shouldUnlock = questCount >= 200; break
      case 'threehundred_quests': shouldUnlock = questCount >= 300; break
      case 'fourhundred_quests': shouldUnlock = questCount >= 400; break
      case 'fivehundred_quests': shouldUnlock = questCount >= 500; break
      case 'sevenfifty_quests': shouldUnlock = questCount >= 750; break
      case 'thousand_quests': shouldUnlock = questCount >= 1000; break
      case 'first_practice': shouldUnlock = questCompletionLogs.some((l) => (l.practiceMinutes ?? 0) > 0); break
      case 'practice_regular': shouldUnlock = questCompletionLogs.filter((l) => (l.practiceMinutes ?? 0) > 0).length >= 10; break
      case 'practice_devoted': shouldUnlock = questCompletionLogs.filter((l) => (l.practiceMinutes ?? 0) > 0).length >= 25; break
      case 'practice_fifty': shouldUnlock = questCompletionLogs.filter((l) => (l.practiceMinutes ?? 0) > 0).length >= 50; break
      case 'practice_hundred': shouldUnlock = questCompletionLogs.filter((l) => (l.practiceMinutes ?? 0) > 0).length >= 100; break
      case 'practice_year': shouldUnlock = questCompletionLogs.filter((l) => (l.practiceMinutes ?? 0) > 0).length >= 365; break
      case 'node_unlocker': shouldUnlock = unlockedNodes >= 10; break
      case 'node_explorer': shouldUnlock = unlockedNodes >= 20; break
      case 'node_collector': shouldUnlock = unlockedNodes >= 30; break
      case 'node_39':
      case 'node_102': shouldUnlock = unlockedNodes >= SKILL_TREE_NODES.length; break
      case 'level_3': shouldUnlock = allCategories.some((cat) => nodeMaxLevel(cat) >= 3); break
      case 'level_5': shouldUnlock = allCategories.some((cat) => nodeMaxLevel(cat) >= 5); break
      case 'level_7': shouldUnlock = allCategories.some((cat) => nodeMaxLevel(cat) >= 7); break
      case 'level_10_two': shouldUnlock = allCategories.filter((cat) => nodeMaxLevel(cat) >= 10).length >= 2; break
      case 'master_level': shouldUnlock = allCategories.some((cat) => nodeMaxLevel(cat) >= 10); break
      case 'level_12': shouldUnlock = allCategories.some((cat) => nodeMaxLevel(cat) >= 12); break
      case 'level_15': shouldUnlock = allCategories.some((cat) => nodeMaxLevel(cat) >= 15); break
      case 'level_20': shouldUnlock = allCategories.some((cat) => nodeTotalLevel(cat) >= 20); break
      case 'level_25': shouldUnlock = allCategories.some((cat) => nodeTotalLevel(cat) >= 25); break
      case 'level_30': shouldUnlock = allCategories.some((cat) => nodeTotalLevel(cat) >= 30); break
      case 'all_level_10': shouldUnlock = allCategories.every((cat) => nodeMaxLevel(cat) >= 10); break
      case 'all_level_15': shouldUnlock = allCategories.every((cat) => nodeMaxLevel(cat) >= 15); break
      case 'all_level_20': shouldUnlock = allCategories.every((cat) => nodeMaxLevel(cat) >= 20); break
      case 'all_categories': shouldUnlock = allCategories.every((cat) => (categoryQuestCount[cat] || 0) > 0); break
      case 'category_5': shouldUnlock = allCategories.every((cat) => (categoryQuestCount[cat] || 0) >= 5); break
      case 'category_10': shouldUnlock = allCategories.every((cat) => (categoryQuestCount[cat] || 0) >= 10); break
      case 'category_25': shouldUnlock = allCategories.every((cat) => (categoryQuestCount[cat] || 0) >= 25); break
      case 'category_50': shouldUnlock = allCategories.every((cat) => (categoryQuestCount[cat] || 0) >= 50); break
      case 'category_100': shouldUnlock = allCategories.every((cat) => (categoryQuestCount[cat] || 0) >= 100); break
      case 'drawing_master': shouldUnlock = (categoryQuestCount['drawing'] || 0) >= 25; break
      case 'drawing_enforcer': shouldUnlock = (categoryQuestCount['drawing'] || 0) >= 50; break
      case 'drawing_century': shouldUnlock = (categoryQuestCount['drawing'] || 0) >= 100; break
      case 'drawing_bicentury': shouldUnlock = (categoryQuestCount['drawing'] || 0) >= 200; break
      case 'drawing_fivehund': shouldUnlock = (categoryQuestCount['drawing'] || 0) >= 500; break
      case 'anatomy_master': shouldUnlock = (categoryQuestCount['anatomy'] || 0) >= 25; break
      case 'anatomy_enforcer': shouldUnlock = (categoryQuestCount['anatomy'] || 0) >= 50; break
      case 'anatomy_century': shouldUnlock = (categoryQuestCount['anatomy'] || 0) >= 100; break
      case 'anatomy_bicentury': shouldUnlock = (categoryQuestCount['anatomy'] || 0) >= 200; break
      case 'animation_master': shouldUnlock = (categoryQuestCount['animation'] || 0) >= 15; break
      case 'animation_expert': shouldUnlock = (categoryQuestCount['animation'] || 0) >= 30; break
      case 'animation_century': shouldUnlock = (categoryQuestCount['animation'] || 0) >= 100; break
      case 'animation_bicentury': shouldUnlock = (categoryQuestCount['animation'] || 0) >= 200; break
      case 'effects_master': shouldUnlock = (categoryQuestCount['effects'] || 0) >= 15; break
      case 'effects_expert': shouldUnlock = (categoryQuestCount['effects'] || 0) >= 30; break
      case 'effects_century': shouldUnlock = (categoryQuestCount['effects'] || 0) >= 100; break
      case 'effects_bicentury': shouldUnlock = (categoryQuestCount['effects'] || 0) >= 200; break
      case 'storytelling_master': shouldUnlock = (categoryQuestCount['storytelling'] || 0) >= 15; break
      case 'storytelling_expert': shouldUnlock = (categoryQuestCount['storytelling'] || 0) >= 30; break
      case 'storytelling_century': shouldUnlock = (categoryQuestCount['storytelling'] || 0) >= 100; break
      case 'storytelling_bicentury': shouldUnlock = (categoryQuestCount['storytelling'] || 0) >= 200; break
      case 'streak_1': shouldUnlock = streak >= 1; break
      case 'streak_3': shouldUnlock = streak >= 3; break
      case 'streak_7': shouldUnlock = streak >= 7; break
      case 'streak_14': shouldUnlock = streak >= 14; break
      case 'streak_30': shouldUnlock = streak >= 30; break
      case 'streak_50': shouldUnlock = streak >= 50; break
      case 'streak_100': shouldUnlock = streak >= 100; break
      case 'streak_200': shouldUnlock = streak >= 200; break
      case 'streak_365': shouldUnlock = streak >= 365; break
      case 'digital_artist': {
        const digitalCount = questCompletionLogs.filter((log) => {
          const q = questsLookup.get(log.questId)
          return q?.medium === 'digital' || q?.medium === 'both'
        }).length
        shouldUnlock = digitalCount >= 20
        break
      }
      case 'traditional_artist': {
        const tradCount = questCompletionLogs.filter((log) => {
          const q = questsLookup.get(log.questId)
          return q?.medium === 'traditional' || q?.medium === 'both'
        }).length
        shouldUnlock = tradCount >= 20
        break
      }
      case 'collector': shouldUnlock = completedWorks.length >= 10; break
      case 'collector_plus': shouldUnlock = completedWorks.length >= 30; break
      case 'collector_elite': shouldUnlock = completedWorks.length >= 100; break
      case 'collector_master': shouldUnlock = completedWorks.length >= 500; break
      case 'early_bird': shouldUnlock = questCompletionLogs.some((log) => new Date(log.completedAt).getHours() < 8); break
      case 'night_owl': shouldUnlock = questCompletionLogs.some((log) => new Date(log.completedAt).getHours() >= 22); break
      case 'speed_runner': shouldUnlock = questCompletionLogs.some((log) => log.isSpeedRun === true); break
      case 'speed_demon_plus': shouldUnlock = questCompletionLogs.filter((l) => l.isSpeedRun === true).length >= 5; break
      case 'speed_elite': shouldUnlock = questCompletionLogs.filter((l) => l.isSpeedRun === true).length >= 10; break
      case 'speed_legend': shouldUnlock = questCompletionLogs.filter((l) => l.isSpeedRun === true).length >= 25; break
      case 'dedication': {
        const categories = new Set(questCompletionLogs.map((l) => l.category).filter(Boolean) as string[])
        shouldUnlock = [...categories].some((cat) => countConsecutiveCategoryDays(questCompletionLogs, cat) >= 5)
        break
      }
      case 'all_difficulties': shouldUnlock = difficultiesCovered.size >= 5; break
      case 'comeback':
        if (questCompletionLogs.length >= 2) {
          const sorted = [...questCompletionLogs].sort(
            (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
          )
          for (let i = 1; i < sorted.length; i++) {
            if (
              (new Date(sorted[i]!.completedAt).getTime() - new Date(sorted[i - 1]!.completedAt).getTime()) /
                86400000 >=
              14
            ) {
              shouldUnlock = true
              break
            }
          }
        }
        break
      case 'comeback_king':
        if (questCompletionLogs.length >= 2) {
          const sorted = [...questCompletionLogs].sort(
            (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
          )
          for (let i = 1; i < sorted.length; i++) {
            if (
              (new Date(sorted[i]!.completedAt).getTime() - new Date(sorted[i - 1]!.completedAt).getTime()) /
                86400000 >=
              30
            ) {
              shouldUnlock = true
              break
            }
          }
        }
        break
      case 'five_in_day': shouldUnlock = Object.values(dayCounts).some((c) => c >= 5); break
      case 'marathon_day': shouldUnlock = Object.values(dayCounts).some((c) => c >= 10); break
      case 'all_legendary':
        shouldUnlock =
          difficultiesCovered.size >= 5 && allCategories.every((cat) => (categoryQuestCount[cat] || 0) >= 5)
        break
      case 'night_owl_elite':
        shouldUnlock = questCompletionLogs.filter((log) => new Date(log.completedAt).getHours() < 4).length >= 10
        break
      case 'early_bird_elite':
        shouldUnlock = questCompletionLogs.filter((log) => new Date(log.completedAt).getHours() < 7).length >= 10
        break
      case 'week_warrior': {
        const categories = new Set(questCompletionLogs.map((l) => l.category).filter(Boolean) as string[])
        shouldUnlock = [...categories].some((cat) => countConsecutiveCategoryDays(questCompletionLogs, cat) >= 7)
        break
      }
      case 'prestige_1': shouldUnlock = state.skillNodes.some((n) => (n.prestige ?? 0) >= 1); break
      case 'prestige_5': shouldUnlock = state.skillNodes.some((n) => (n.prestige ?? 0) >= 5); break
      case 'prestige_10': shouldUnlock = state.skillNodes.some((n) => (n.prestige ?? 0) >= 10); break
      case 'xp_fifty_thousand': shouldUnlock = totalXpEarned >= 50000; break
      case 'xp_hundred_thousand': shouldUnlock = totalXpEarned >= 100000; break
      case 'xp_quarter_million': shouldUnlock = totalXpEarned >= 250000; break
      case 'xp_half_million': shouldUnlock = totalXpEarned >= 500000; break
      case 'xp_million': shouldUnlock = totalXpEarned >= 1000000; break
      case 'unique_50': shouldUnlock = uniqueQuestIds.size >= 50; break
      case 'unique_100': shouldUnlock = uniqueQuestIds.size >= 100; break
      case 'unique_250': shouldUnlock = uniqueQuestIds.size >= 250; break
      case 'unique_500': shouldUnlock = uniqueQuestIds.size >= 500; break
      case 'unique_750': shouldUnlock = uniqueQuestIds.size >= 750; break
      case 'unique_1000': shouldUnlock = uniqueQuestIds.size >= 1540; break
      case 'character_design_master': shouldUnlock = (categoryQuestCount['character_design'] || 0) >= 15; break
      case 'environment_master': shouldUnlock = (categoryQuestCount['environment'] || 0) >= 15; break
      default:
        shouldUnlock = shouldUnlockQualityAchievement(ach.id, qualityStats)
        break
    }

    if (shouldUnlock) {
      const now = new Date().toISOString()
      newUnlocks.push({ ...ach, unlocked: true, unlockedAt: now })
    }
  }

  return newUnlocks
}
