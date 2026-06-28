import type { Quest, AdaptiveWeights, FlowMetrics } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import type { LearningProfile } from '@/utils/learningProfile'
import {
  getVisibleCategories,
  getDefaultFavoriteCategories,
  resolveProfileFavoriteCategories,
} from '@/utils/learningProfile'
import { getLocalDateStr, generateDailySeed, seededShuffle, createSeededRandom } from '@/utils/dailyQuests'
import { filterQuestsForPlayerLevel, getDailyQuestPool } from '@/utils/questLevelGate'
import { getDifficultyMultipliers } from '@/utils/adaptiveDifficulty'
import {
  getDailyRotationWeight,
  pickLeastCompletedFallback,
} from '@/utils/dailyQuestRotation'
import { getQuestUnlockState, getSatisfiedQuestIds } from '@/utils/questPrerequisites'
import type { QuestCompletionLog } from '@/store/models'



export interface GenerateDailyQuestsParams {
  allQuests: Quest[]
  count?: number
  avgLevel: number
  completedQuests: number[]
  favoriteCategories?: QuestCategory[]
  useRandomCategories?: boolean
  learningProfile?: LearningProfile
  dateStr?: string
  reviewQuestIds?: number[]
  adaptiveWeights?: AdaptiveWeights
  flowMetrics?: FlowMetrics
  questCompletionLogs?: QuestCompletionLog[]
}

function resolveAllowedCategories(
  favoriteCategories: QuestCategory[] | undefined,
  useRandomCategories: boolean | undefined,
  learningProfile: LearningProfile,
): Set<QuestCategory> {
  const visible = getVisibleCategories(learningProfile)

  if (useRandomCategories) {
    return new Set(visible)
  }

  const effectiveFavorites = resolveProfileFavoriteCategories(
    favoriteCategories ?? [],
    learningProfile,
  )
  if (effectiveFavorites.length >= 3) {
    return new Set(effectiveFavorites.slice(0, 3))
  }
  if (effectiveFavorites.length === 2) {
    return new Set(visible)
  }
  if (effectiveFavorites.length === 1) {
    return new Set([effectiveFavorites[0]!])
  }

  return new Set(getDefaultFavoriteCategories(learningProfile))
}

/** Category slot plan for daily picks (may repeat when fewer than 3 favorites). */
export function planDailyCategorySlots(
  count: number,
  options: {
    favoriteCategories?: QuestCategory[]
    useRandomCategories?: boolean
    learningProfile: LearningProfile
    seed: number
    skipCategories?: Set<QuestCategory>
  },
): QuestCategory[] {
  const visible = getVisibleCategories(options.learningProfile)
  const skip = options.skipCategories ?? new Set<QuestCategory>()
  const seed = options.seed >>> 0 || 1

  if (options.useRandomCategories) {
    const order = seededShuffle(visible, seed)
    const plan: QuestCategory[] = []
    for (const cat of order) {
      if (plan.length >= count) break
      if (skip.has(cat)) continue
      plan.push(cat)
    }
    let i = 0
    while (plan.length < count && order.length > 0) {
      plan.push(order[i % order.length]!)
      i += 1
    }
    return plan
  }

  let favorites = resolveProfileFavoriteCategories(
    options.favoriteCategories ?? [],
    options.learningProfile,
  )
  if (favorites.length === 0) {
    favorites = getDefaultFavoriteCategories(options.learningProfile)
  }

  if (favorites.length >= 3) {
    const order = seededShuffle(favorites.slice(0, 3), seed)
    const plan: QuestCategory[] = []
    for (const cat of order) {
      if (plan.length >= count) break
      if (skip.has(cat)) continue
      plan.push(cat)
    }
    let i = 0
    while (plan.length < count) {
      plan.push(order[i % order.length]!)
      i += 1
    }
    return plan
  }

  if (favorites.length === 2) {
    const plan: QuestCategory[] = [...favorites]
    const extraPool = seededShuffle(visible, (seed * 41) >>> 0 || 1)
    let i = 0
    while (plan.length < count && extraPool.length > 0) {
      plan.push(extraPool[i % extraPool.length]!)
      i += 1
    }
    return plan
  }

  return Array.from({ length: count }, () => favorites[0]!) as QuestCategory[]
}

/** Compares saved prefs keys; ignores legacy `path` from removed campaign mode. */
export function dailyPrefsKeysEquivalent(savedKey: string, currentKey: string): boolean {
  if (savedKey === currentKey) return true
  try {
    const stripLegacy = (raw: Record<string, unknown>) => {
      const { path: _path, ...rest } = raw
      return rest
    }
    const saved = stripLegacy(JSON.parse(savedKey) as Record<string, unknown>)
    const current = stripLegacy(JSON.parse(currentKey) as Record<string, unknown>)
    return JSON.stringify(saved) === JSON.stringify(current)
  } catch {
    return false
  }
}

export function buildDailyPrefsKey(params: {
  favoriteCategories?: QuestCategory[]
  useRandomCategories?: boolean
  learningProfile?: LearningProfile
}): string {
  return JSON.stringify({
    favorites: params.favoriteCategories ?? [],
    random: Boolean(params.useRandomCategories),
    profile: params.learningProfile ?? 'animation',
  })
}

export function resolveAllowedCategoriesForPrefs(params: {
  favoriteCategories?: QuestCategory[]
  useRandomCategories?: boolean
  learningProfile?: LearningProfile
  dateStr?: string
}): Set<QuestCategory> {
  void params.dateStr
  return resolveAllowedCategories(
    params.favoriteCategories,
    params.useRandomCategories,
    params.learningProfile ?? 'animation',
  )
}

/** Whether saved daily roster reflects the user's favorite-category selection. */
export function dailyQuestCategoriesMatchFavorites(
  dailyQuests: Quest[],
  params: {
    favoriteCategories?: QuestCategory[]
    useRandomCategories?: boolean
    learningProfile?: LearningProfile
  },
): boolean {
  if (params.useRandomCategories || dailyQuests.length === 0) return true

  let favorites = resolveProfileFavoriteCategories(
    params.favoriteCategories ?? [],
    params.learningProfile ?? 'animation',
  )
  if (favorites.length === 0) {
    favorites = getDefaultFavoriteCategories(params.learningProfile ?? 'animation')
  }

  const categories = dailyQuests.map((q) => q.category)

  if (favorites.length >= 3) {
    const chosen = favorites.slice(0, 3)
    const chosenSet = new Set(chosen)
    if (!categories.every((cat) => chosenSet.has(cat))) return false
    if (!chosen.every((cat) => categories.includes(cat))) return false
    if (dailyQuests.length === 3 && new Set(categories).size !== 3) return false
    return true
  }

  if (favorites.length === 2) {
    return favorites.every((cat) => categories.includes(cat))
  }

  if (favorites.length === 1) {
    return categories.every((cat) => cat === favorites[0])
  }

  return true
}

export function sortDailyQuestsByFavoriteOrder(
  quests: Quest[],
  orderedIds: number[],
  params: {
    favoriteCategories?: QuestCategory[]
    useRandomCategories?: boolean
    learningProfile?: LearningProfile
  },
): Quest[] {
  if (params.useRandomCategories) {
    return orderedIds
      .map((id) => quests.find((q) => q.id === id))
      .filter((q): q is Quest => q != null)
  }

  let favorites = resolveProfileFavoriteCategories(
    params.favoriteCategories ?? [],
    params.learningProfile ?? 'animation',
  )
  if (favorites.length === 0) {
    favorites = getDefaultFavoriteCategories(params.learningProfile ?? 'animation')
  }

  const rank = new Map(favorites.map((cat, index) => [cat, index]))
  const dailies = orderedIds
    .map((id) => quests.find((q) => q.id === id))
    .filter((q): q is Quest => q != null)

  return [...dailies].sort((a, b) => {
    const rankA = rank.get(a.category) ?? 100
    const rankB = rank.get(b.category) ?? 100
    if (rankA !== rankB) return rankA - rankB
    return orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
  })
}

export function dailyQuestIdsMatchPrefs(
  dailyQuestIds: number[],
  allQuests: Quest[],
  params: {
    favoriteCategories?: QuestCategory[]
    useRandomCategories?: boolean
    learningProfile?: LearningProfile
    dateStr?: string
  },
): boolean {
  if (dailyQuestIds.length === 0) return true
  const allowed = resolveAllowedCategoriesForPrefs(params)
  const dailyQuests = allQuests.filter((q) => dailyQuestIds.includes(q.id))
  if (dailyQuests.length !== dailyQuestIds.length) return false
  if (!dailyQuests.every((q) => allowed.has(q.category))) return false
  return dailyQuestCategoriesMatchFavorites(dailyQuests, params)
}

function pickWeightedQuest(
  pool: Quest[],
  seed: number,
  multipliers: Record<Quest['difficulty'], number>,
  adaptiveWeights: AdaptiveWeights | undefined,
  logs: QuestCompletionLog[],
  allQuests: Quest[],
): Quest | null {
  if (pool.length === 0) return null
  const tagMultiplier = (q: Quest) => {
    if (!adaptiveWeights) return 1
    const matches = q.tags
      .map((tag) => adaptiveWeights[tag])
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
    if (matches.length === 0) return 1
    return Math.max(0.5, Math.min(1.8, matches.reduce((a, b) => a + b, 0) / matches.length))
  }
  const weights = pool.map(
    (q) => (multipliers[q.difficulty] ?? 1) * tagMultiplier(q) * getDailyRotationWeight(q, logs, allQuests),
  )
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (totalWeight <= 0) {
    return pickLeastCompletedFallback(pool, logs, seed) ?? pool[Math.abs(seed) % pool.length] ?? null
  }

  const random = createSeededRandom(seed * 997 + 1)()
  let cumulative = 0
  for (let i = 0; i < pool.length; i++) {
    cumulative += (weights[i] ?? 1) / totalWeight
    if (random <= cumulative) return pool[i]!
  }
  return pool[pool.length - 1]!
}

export function pickDailyQuestReplacement(params: {
  allQuests: Quest[]
  failedQuest: Quest
  excludeIds: number[]
  avgLevel: number
  completedQuests: number[]
  questCompletionLogs?: QuestCompletionLog[]
  dateStr?: string
}): number | null {
  const {
    allQuests,
    failedQuest,
    excludeIds,
    avgLevel,
    completedQuests,
    questCompletionLogs = [],
    dateStr,
  } = params
  const satisfiedIds = getSatisfiedQuestIds(questCompletionLogs)
  const completedNonRepeatable = new Set(
    allQuests.filter((q) => !q.is_repeatable && completedQuests.includes(q.id)).map((q) => q.id),
  )
  const exclude = new Set(excludeIds)
  const isEligibleReplacement = (q: Quest): boolean => {
    if (exclude.has(q.id)) return false
    if (completedNonRepeatable.has(q.id)) return false
    return getQuestUnlockState(q, completedQuests, satisfiedIds).unlocked
  }
  const sameBucketPool = allQuests.filter(
    (q) =>
      q.category === failedQuest.category &&
      q.difficulty === failedQuest.difficulty &&
      isEligibleReplacement(q),
  )
  const pool = sameBucketPool.length > 0 ? sameBucketPool : allQuests.filter(isEligibleReplacement)
  const eligible = filterQuestsForPlayerLevel(pool, avgLevel)
  if (eligible.length === 0) return null
  const seed =
    ((generateDailySeed(dateStr ?? getLocalDateStr()) * 31) ^ (failedQuest.id * 997)) >>> 0 || 1
  return pickLeastCompletedFallback(eligible, questCompletionLogs, seed)?.id ?? eligible[0]?.id ?? null
}

export function generateDailyQuests(params: GenerateDailyQuestsParams): number[] {
  if (import.meta.env.DEV) {
    console.time('[Perf] generateDailyQuests')
    try {
      return generateDailyQuestsImpl(params)
    } finally {
      console.timeEnd('[Perf] generateDailyQuests')
    }
  }

  return generateDailyQuestsImpl(params)
}

function generateDailyQuestsImpl(params: GenerateDailyQuestsParams): number[] {
  const {
    allQuests,
    count = 3,
    avgLevel,
    completedQuests,
    favoriteCategories,
    useRandomCategories,
    learningProfile = 'animation',
    dateStr,
    reviewQuestIds,
    adaptiveWeights,
    flowMetrics,
    questCompletionLogs = [],
  } = params

  const dateSeed = generateDailySeed(dateStr ?? getLocalDateStr())
  const seed = ((dateSeed * 33) ^ (avgLevel * 997)) >>> 0 || 1
  const allowedCategories = resolveAllowedCategories(
    favoriteCategories,
    useRandomCategories,
    learningProfile,
  )

  const difficultyMultipliers = adaptiveWeights && flowMetrics
    ? getDifficultyMultipliers(adaptiveWeights, flowMetrics)
    : { novice: 1, intermediate: 1, advanced: 1, expert: 1, master: 1 } as Record<Quest['difficulty'], number>

  const satisfiedIds = getSatisfiedQuestIds(questCompletionLogs)
  const completedNonRepeatable = new Set(
    allQuests.filter((q) => !q.is_repeatable && completedQuests.includes(q.id)).map((q) => q.id),
  )
  const unlockedQuests = allQuests.filter((q) => {
    if (completedNonRepeatable.has(q.id)) return false
    return getQuestUnlockState(q, completedQuests, satisfiedIds).unlocked
  })
  const inAllowedCategory = unlockedQuests.filter((q) => allowedCategories.has(q.category))
  const eligibleQuests = filterQuestsForPlayerLevel(inAllowedCategory, avgLevel)

  const reviewPool = reviewQuestIds
    ? seededShuffle(
        eligibleQuests.filter((q) => reviewQuestIds.includes(q.id)),
        (seed * 97) >>> 0 || 1,
      )
    : []
  const reviewPicked: Quest[] = []
  const usedQuestIds = new Set<number>()
  const usedCategories = new Set<QuestCategory>()

  for (const q of reviewPool) {
    if (reviewPicked.length >= Math.min(reviewPool.length, Math.ceil(count / 2))) break
    reviewPicked.push(q)
    usedQuestIds.add(q.id)
    usedCategories.add(q.category)
  }

  const adjustedCount = count - reviewPicked.length
  if (adjustedCount <= 0) {
    return reviewPicked.map((q) => q.id)
  }

  const categoryPlan = planDailyCategorySlots(adjustedCount, {
    favoriteCategories,
    useRandomCategories,
    learningProfile,
    seed,
    skipCategories: usedCategories,
  })

  const picked: Quest[] = []
  for (const cat of categoryPlan) {
    if (picked.length >= adjustedCount) break
    const pool = getDailyQuestPool(
      inAllowedCategory.filter((q) => q.category === cat && !usedQuestIds.has(q.id)),
      avgLevel,
    )
    if (pool.length === 0) continue
    const seedKey = (seed * 17 + cat.charCodeAt(0)) >>> 0 || 1
    const choice = pickWeightedQuest(pool, seedKey, difficultyMultipliers, adaptiveWeights, questCompletionLogs, allQuests)
    if (choice) {
      picked.push(choice)
      usedQuestIds.add(choice.id)
    }
  }

  if (picked.length < adjustedCount) {
    const represented = new Set([
      ...reviewPicked.map((q) => q.category),
      ...picked.map((q) => q.category),
    ])
    const missingCategories = categoryPlan.filter((cat) => !represented.has(cat))
    for (const cat of [...new Set(missingCategories), ...categoryPlan]) {
      if (picked.length >= adjustedCount) break
      if (represented.has(cat) && !missingCategories.includes(cat)) continue
      const pool = getDailyQuestPool(
        inAllowedCategory.filter((q) => q.category === cat && !usedQuestIds.has(q.id)),
        avgLevel,
      )
      if (pool.length === 0) continue
      const seedKey = (seed * 29 + cat.charCodeAt(0)) >>> 0 || 1
      const choice = pickWeightedQuest(pool, seedKey, difficultyMultipliers, adaptiveWeights, questCompletionLogs, allQuests)
      if (choice) {
        picked.push(choice)
        usedQuestIds.add(choice.id)
        represented.add(choice.category)
      }
    }
  }

  if (picked.length < adjustedCount) {
    const fillPool = getDailyQuestPool(
      inAllowedCategory.filter((q) => !usedQuestIds.has(q.id)),
      avgLevel,
    )
    const seedKey = (seed * 23) >>> 0 || 1
    const remaining = seededShuffle(fillPool, seedKey)
    for (const q of remaining) {
      if (picked.length >= adjustedCount) break
      picked.push(q)
      usedQuestIds.add(q.id)
    }
  }

  return [...reviewPicked, ...picked].map((q) => q.id)
}
