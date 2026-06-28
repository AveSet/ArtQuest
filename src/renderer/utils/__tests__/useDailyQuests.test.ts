import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useDailyQuests } from '../useDailyQuests'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { getLocalDateStr } from '../dailyQuests'
import { buildDailyPrefsKey } from '../dailyQuestGenerator'
import type { Quest } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'

function makeQuest(id: number, category: QuestCategory = 'drawing'): Quest {
  return {
    id,
    code: `Q-${id}`,
    title: { en: `Quest ${id}`, ru: `Квест ${id}`, zh: `Quest ${id}`, ja: `Quest ${id}`, ko: `Quest ${id}` },
    description: { en: '', ru: '', zh: '', ja: '', ko: '' },
    category,
    difficulty: 'novice',
    estimatedTime: 30,
    xp: 50,
    icon: '',
    color: '',
    min_level: 0,
    tags: [],
    prerequisites: [],
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 1,
    source: '',
    medium: 'digital',
  }
}

describe('useDailyQuests', () => {
  beforeEach(() => {
    useQuestStore.setState({
      quests: [],
      questsLoaded: false,
      dailyQuestsIds: [],
      completedToday: [],
      lastDailyQuestDate: '',
      lastFavCategories: '',
    })
    useUIStore.setState({ isLoaded: false })
  })

  it('shows daily quests after quest JSON loads (cold-start race)', async () => {
    const today = getLocalDateStr()
    const quests = [makeQuest(1, 'drawing'), makeQuest(2, 'animation'), makeQuest(3, 'anatomy')]
    const favorites = ['drawing', 'animation', 'anatomy'] as const
    const favKey = buildDailyPrefsKey({
      favoriteCategories: [...favorites],
      useRandomCategories: false,
      learningProfile: 'animation',
    })

    useUIStore.setState({
      isLoaded: true,
      settings: {
        ...useUIStore.getState().settings,
        favoriteCategories: [...favorites],
        useRandomCategories: false,
        learningProfile: 'animation',
      },
    })
    useQuestStore.setState({
      dailyQuestsIds: [1, 2, 3],
      lastDailyQuestDate: today,
      lastFavCategories: favKey,
      quests: [],
      questsLoaded: false,
    })

    const { result, rerender } = renderHook(() => useDailyQuests())
    expect(result.current).toEqual([])

    await act(async () => {
      useQuestStore.setState({ quests, questsLoaded: true })
      rerender()
    })

    await waitFor(() => {
      expect(result.current).toHaveLength(3)
      expect(result.current.map((q) => q.id).sort()).toEqual([1, 2, 3])
      expect(result.current.map((q) => q.category)).toEqual(['drawing', 'animation', 'anatomy'])
    })
  })
})
