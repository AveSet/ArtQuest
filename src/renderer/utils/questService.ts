import type { Quest } from '@/store/models'
import type { QuestTitleOverrides } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import { useQuestStore } from '@/store/useQuestStore'
import { filterQuestsForPlayerLevel } from '@/utils/questLevelGate'
import { resolveQuestTitle } from '@/utils/questDisplay'

type PageResult<T> = { items: T[]; total: number; page: number; pageSize: number; totalPages: number }

function getQuests(): Quest[] {
  return useQuestStore.getState().quests
}

export const QuestService = {
  getAll(): Quest[] {
    return getQuests()
  },

  getById(id: number): Quest | undefined {
    return getQuests().find(q => q.id === id)
  },

  getByCategory(category: QuestCategory): Quest[] {
    return getQuests().filter(q => q.category === category)
  },

  getCategories(): QuestCategory[] {
    const cats = new Set(getQuests().map(q => q.category))
    return Array.from(cats)
  },

  getCategoryCounts(): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const q of getQuests()) {
      counts[q.category] = (counts[q.category] || 0) + 1
    }
    return counts
  },

  getFiltered(opts: {
    quests?: Quest[]
    questTitleOverrides?: QuestTitleOverrides
    category?: QuestCategory
    difficulty?: Quest['difficulty']
    search?: string
    minLevel?: number
    avgPlayerLevel?: number
    tags?: string[]
    allowedCategories?: QuestCategory[]
    page?: number
    pageSize?: number
  }): PageResult<Quest> {
    let items = opts.quests ?? getQuests()
    const titleOverrides = opts.questTitleOverrides ?? useQuestStore.getState().questTitleOverrides
    const { category, difficulty, search, minLevel, avgPlayerLevel, tags, allowedCategories, page = 1, pageSize = 50 } = opts

    if (avgPlayerLevel != null) {
      items = filterQuestsForPlayerLevel(items, avgPlayerLevel)
    }

    if (allowedCategories && allowedCategories.length > 0) {
      const allowed = new Set(allowedCategories)
      items = items.filter((q) => allowed.has(q.category))
    }

    if (category) items = items.filter(q => q.category === category)
    if (difficulty) items = items.filter(q => q.difficulty === difficulty)
    if (minLevel != null) items = items.filter(q => q.min_level <= minLevel)
    if (tags && tags.length > 0) {
      items = items.filter(q => tags.some(t => q.tags.includes(t)))
    }
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((item) => {
        const titles = [
          ...Object.values(item.title),
          resolveQuestTitle(item, 'en', titleOverrides),
          resolveQuestTitle(item, 'ru', titleOverrides),
        ]
        return titles.some((t) => t.toLowerCase().includes(q)) || item.tags.some((t) => t.toLowerCase().includes(q))
      })
    }

    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const offset = (page - 1) * pageSize
    return { items: items.slice(offset, offset + pageSize), total, page, pageSize, totalPages }
  },

  getEligibleForDaily(playerLevel: number): Quest[] {
    return filterQuestsForPlayerLevel(getQuests(), playerLevel)
  },
}
