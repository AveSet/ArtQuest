import type { Quest } from '../store/models'
import type { QuestCategory } from '@/data/skillTree'
import { useUIStore } from '@/store/useUIStore'

const ALL_CATEGORIES: QuestCategory[] = [
  'drawing',
  'animation',
  'anatomy',
  'effects',
  'storytelling',
  'character_design',
  'environment',
]

const CATEGORY_LOADERS: Record<QuestCategory, () => Promise<Quest[]>> = {
  effects: () => import('./quests_effects.json').then((m) => (m.default as Quest[]) || []),
  animation: () => import('./quests_animation.json').then((m) => (m.default as Quest[]) || []),
  anatomy: () => import('./quests_anatomy.json').then((m) => (m.default as Quest[]) || []),
  storytelling: () => import('./quests_storytelling.json').then((m) => (m.default as Quest[]) || []),
  drawing: () => import('./quests_drawing.json').then((m) => (m.default as Quest[]) || []),
  character_design: () => import('./quests_character_design.json').then((m) => (m.default as Quest[]) || []),
  environment: () => import('./quests_environment.json').then((m) => (m.default as Quest[]) || []),
}

let cached: Quest[] | null = null
let loadPromise: Promise<Quest[]> | null = null

function dedupeQuests(allQuests: Quest[]): Quest[] {
  const seen = new Set<number>()
  return allQuests.filter((q) => {
    if (seen.has(q.id)) {
      console.warn(`[quests_data] Duplicate quest ID ${q.id} removed`)
      return false
    }
    seen.add(q.id)
    return true
  })
}

export async function loadQuestCategories(categories: QuestCategory[]): Promise<Quest[]> {
  const unique = [...new Set(categories)]
  const modules = await Promise.all(unique.map((c) => CATEGORY_LOADERS[c]()))
  return dedupeQuests(modules.flat())
}

function priorityCategories(): QuestCategory[] {
  const favorites = useUIStore.getState().settings.favoriteCategories ?? []
  const base = favorites.length > 0 ? favorites : (['drawing', 'animation', 'anatomy'] as QuestCategory[])
  return [...new Set([...base, 'drawing'])] as QuestCategory[]
}

export async function loadAllQuests(): Promise<Quest[]> {
  if (cached) return cached
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const priority = priorityCategories()
    const rest = ALL_CATEGORIES.filter((c) => !priority.includes(c))
    const first = await loadQuestCategories(priority)
    cached = first
    if (rest.length > 0) {
      const remaining = await loadQuestCategories(rest)
      cached = dedupeQuests([...first, ...remaining])
    }
    return cached
  })()

  try {
    return await loadPromise
  } finally {
    loadPromise = null
  }
}

/** Load priority categories first, then merge the rest in the background. */
export async function loadQuestsProgressive(
  onPartial?: (quests: Quest[]) => void,
): Promise<Quest[]> {
  if (cached) return cached

  const priority = priorityCategories()
  const rest = ALL_CATEGORIES.filter((c) => !priority.includes(c))
  const first = await loadQuestCategories(priority)
  cached = first
  onPartial?.(first)

  if (rest.length === 0) return cached

  void loadQuestCategories(rest).then((remaining) => {
    cached = dedupeQuests([...first, ...remaining])
    onPartial?.(cached)
  })

  return cached
}

export default null as unknown as Quest[]
