import { describe, it, expect, beforeEach } from 'vitest'
import { QuestService } from '../questService'
import { useQuestStore } from '@/store/useQuestStore'
import type { Quest } from '@/store/models'

const makeQuest = (id: number, overrides: Partial<Quest> = {}): Quest => ({
  id,
  code: `Q-${id}`,
  title: { en: `Quest ${id}`, ru: `Квест ${id}`, zh: `Quest ${id}`, ja: `Quest ${id}`, ko: `Quest ${id}` },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: '', ru: '', zh: '', ja: '', ko: '' },
  xp: 100,
  estimatedTime: 30,
  source: 'test',
  icon: '',
  color: '',
  min_level: 0,
  tags: [],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: true,
  review_after_days: 0,
  streak_bonus: 1.0,
  ...overrides,
})

beforeEach(() => {
  useQuestStore.setState({ quests: [] })
})

describe('QuestService', () => {
  it('getAll returns all quests', () => {
    const quests = [makeQuest(1), makeQuest(2)]
    useQuestStore.setState({ quests })
    expect(QuestService.getAll()).toHaveLength(2)
  })

  it('getById finds quest by id', () => {
    useQuestStore.setState({ quests: [makeQuest(42)] })
    expect(QuestService.getById(42)?.id).toBe(42)
    expect(QuestService.getById(99)).toBeUndefined()
  })

  it('getByCategory filters by category', () => {
    useQuestStore.setState({
      quests: [
        makeQuest(1, { category: 'drawing' }),
        makeQuest(2, { category: 'animation' }),
        makeQuest(3, { category: 'drawing' }),
      ],
    })
    const drawing = QuestService.getByCategory('drawing')
    expect(drawing).toHaveLength(2)
    expect(drawing.every(q => q.category === 'drawing')).toBe(true)
  })

  it('getCategories returns unique categories', () => {
    useQuestStore.setState({
      quests: [
        makeQuest(1, { category: 'drawing' }),
        makeQuest(2, { category: 'animation' }),
        makeQuest(3, { category: 'drawing' }),
      ],
    })
    const cats = QuestService.getCategories()
    expect(cats.sort()).toEqual(['animation', 'drawing'])
  })

  it('getCategoryCounts returns correct counts', () => {
    useQuestStore.setState({
      quests: [
        makeQuest(1, { category: 'drawing' }),
        makeQuest(2, { category: 'animation' }),
        makeQuest(3, { category: 'drawing' }),
      ],
    })
    const counts = QuestService.getCategoryCounts()
    expect(counts.drawing).toBe(2)
    expect(counts.animation).toBe(1)
  })

  describe('getFiltered', () => {
    it('return all quests with no filters', () => {
      const quests = Array.from({ length: 5 }, (_, i) => makeQuest(i + 1))
      useQuestStore.setState({ quests })
      const result = QuestService.getFiltered({})
      expect(result.items).toHaveLength(5)
      expect(result.totalPages).toBe(1)
    })

    it('filters by difficulty', () => {
      useQuestStore.setState({
        quests: [
          makeQuest(1, { difficulty: 'novice' }),
          makeQuest(2, { difficulty: 'expert' }),
          makeQuest(3, { difficulty: 'novice' }),
        ],
      })
      const result = QuestService.getFiltered({ difficulty: 'novice' })
      expect(result.items).toHaveLength(2)
    })

    it('filters by category', () => {
      useQuestStore.setState({
        quests: [
          makeQuest(1, { category: 'drawing' }),
          makeQuest(2, { category: 'anatomy' }),
        ],
      })
      const result = QuestService.getFiltered({ category: 'anatomy' })
      expect(result.items).toHaveLength(1)
    })

    it('filters by tags', () => {
      useQuestStore.setState({
        quests: [
          makeQuest(1, { tags: ['perspective', 'lines'] }),
          makeQuest(2, { tags: ['color'] }),
        ],
      })
      const result = QuestService.getFiltered({ tags: ['perspective'] })
      expect(result.items).toHaveLength(1)
    })

    it('filters by search', () => {
      useQuestStore.setState({
        quests: [
          makeQuest(1, { title: { en: 'Perspective Basics', ru: '', zh: 'Perspective Basics', ja: 'Perspective Basics', ko: 'Perspective Basics' } }),
          makeQuest(2, { title: { en: 'Color Theory', ru: '', zh: 'Color Theory', ja: 'Color Theory', ko: 'Color Theory' } }),
        ],
      })
      const result = QuestService.getFiltered({ search: 'perspective' })
      expect(result.items).toHaveLength(1)
    })

    it('filters by search on tags regardless of case', () => {
      useQuestStore.setState({
        quests: [
          makeQuest(1, { tags: ['Perspective', 'lines'] }),
          makeQuest(2, { tags: ['color'] }),
        ],
      })
      const result = QuestService.getFiltered({ search: 'perspective' })
      expect(result.items).toHaveLength(1)
      expect(result.items[0]!.id).toBe(1)
    })

    it('accepts explicit quest catalog without reading the store', () => {
      const quests = [makeQuest(1), makeQuest(2)]
      useQuestStore.setState({ quests: [makeQuest(99)] })
      const result = QuestService.getFiltered({ quests })
      expect(result.items.map((q) => q.id)).toEqual([1, 2])
    })

    it('paginates results', () => {
      useQuestStore.setState({
        quests: Array.from({ length: 25 }, (_, i) => makeQuest(i + 1)),
      })
      const page1 = QuestService.getFiltered({ page: 1, pageSize: 10 })
      expect(page1.items).toHaveLength(10)
      expect(page1.totalPages).toBe(3)
      const page2 = QuestService.getFiltered({ page: 2, pageSize: 10 })
      expect(page2.items).toHaveLength(10)
    })
  })

  describe('getEligibleForDaily', () => {
    it('filters by player level + 2', () => {
      useQuestStore.setState({
        quests: [
          makeQuest(1, { min_level: 1 }),
          makeQuest(2, { min_level: 5 }),
          makeQuest(3, { min_level: 10 }),
        ],
      })
      const eligible = QuestService.getEligibleForDaily(3)
      expect(eligible.map(q => q.id).sort()).toEqual([1, 2])
    })
  })
})
