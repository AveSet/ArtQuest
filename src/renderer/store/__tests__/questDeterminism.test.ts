import { describe, it, expect, beforeEach } from 'vitest'
import { generateDailyQuests } from '@/utils/dailyQuestGenerator'
import { useSkillStore } from '../useSkillStore'
import { useQuestStore } from '../useQuestStore'
import type { Quest } from '../models'

const makeQuest = (id: number, category = 'drawing', difficulty = 'novice', minLevel = 0): Quest => ({
  id,
  code: `Q-${id}`,
  title: { en: `Quest ${id}`, ru: `Квест ${id}`, zh: `Quest ${id}`, ja: `Quest ${id}`, ko: `Quest ${id}` },
  category: category as any,
  difficulty: difficulty as any,
  description: { en: '', ru: '', zh: '', ja: '', ko: '' },
  xp: 100,
  estimatedTime: 30,
  source: 'test',
  icon: '',
  color: '',
  min_level: minLevel,
  tags: [],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: false,
  review_after_days: 0,
  streak_bonus: 0,
})

const makePlayerLevel = (level: number) => {
  useSkillStore.setState({
    skillNodes: [{ id: 'test', parentId: null, category: 'drawing', title: { en: '', ru: '', zh: '', ja: '', ko: '' }, description: { en: '', ru: '', zh: '', ja: '', ko: '' }, level, xp: 0, maxXp: 100, prerequisites: [], tags: [], reviewIntervalDays: 0, lastReviewDate: null, isUnlocked: true, order: 0, prestige: 0 }],
    legacySkills: [],
  })
}

const getAvgLevel = (): number => {
  const skillState = useSkillStore.getState()
  const nodeSum = skillState.skillNodes.reduce((sum, n) => sum + n.level, 0)
  const nodeCount = skillState.skillNodes.length
  if (nodeCount > 0) return Math.max(1, Math.round(nodeSum / nodeCount))
  return 1
}

beforeEach(() => {
  useQuestStore.setState({ dailyQuestsIds: [], completedToday: [], lastDailyQuestDate: '' })
})

describe('generateDailyQuests determinism', () => {
  const quests = Array.from({ length: 20 }, (_, i) => makeQuest(i + 1, i < 7 ? 'drawing' : i < 14 ? 'animation' : 'anatomy', 'novice', 0))

  it('returns same results for same player level and same quest pool', () => {
    makePlayerLevel(1)
    const avgLevel = getAvgLevel()
    const result1 = generateDailyQuests({ allQuests: quests, count: 3, avgLevel, completedQuests: useQuestStore.getState().completedQuests })
    const result2 = generateDailyQuests({ allQuests: quests, count: 3, avgLevel, completedQuests: useQuestStore.getState().completedQuests })
    expect(result1).toEqual(result2)
  })

  it('returns different results for different player levels', () => {
    makePlayerLevel(1)
    const result1 = generateDailyQuests({ allQuests: quests, count: 3, avgLevel: getAvgLevel(), completedQuests: useQuestStore.getState().completedQuests })
    makePlayerLevel(5)
    const result2 = generateDailyQuests({ allQuests: quests, count: 3, avgLevel: getAvgLevel(), completedQuests: useQuestStore.getState().completedQuests })
    expect(result1.length).toBe(3)
    expect(result2.length).toBe(3)
  })

  it('returns requested number of quests', () => {
    makePlayerLevel(3)
    const result = generateDailyQuests({ allQuests: quests, count: 4, avgLevel: getAvgLevel(), completedQuests: useQuestStore.getState().completedQuests })
    expect(result.length).toBe(4)
  })

  it('all returned IDs exist in the pool', () => {
    makePlayerLevel(2)
    const poolIds = new Set(quests.map(q => q.id))
    const result = generateDailyQuests({ allQuests: quests, count: 3, avgLevel: getAvgLevel(), completedQuests: useQuestStore.getState().completedQuests })
    result.forEach(id => expect(poolIds.has(id)).toBe(true))
  })
})
