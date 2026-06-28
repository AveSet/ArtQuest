import type { Quest } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import { computeSkillXpFromQuest } from '@/utils/progressionBalance'
import {
  assessTitleComplexity,
  clampDifficultyAtLeast,
  clampDifficultyAtMost,
  metricsFromComplexityProfile,
} from '@/utils/questTitleComplexity'
import {
  applyQuantityToRewards,
  extractTitleWorkScale,
  isFundamentalDrill,
  normalizeTitleForCatalogMatch,
} from '@/utils/questTitleScale'
import {
  DIFFICULTY_ORDER,
  harmonizeXpTime,
  roundRewardMinutes,
  roundRewardXp,
  typicalMinutesPerXp,
  type Difficulty,
} from '@/utils/questCatalogCalibration'
import { resolveSkillNodeIdFromTitle } from '@/utils/resolveSkillFromTitle'
import { tokenizeTitleForTags } from '@/utils/tokenizeTitleForTags'
import { expandTitleTokens } from '@/utils/questTitleSynonyms'

export const USER_QUEST_ID_MIN = 1_000_000

const MIN_MATCH_SCORE = 0.1
const MAX_NEIGHBORS = 8

export type EstimateConfidence = 'high' | 'medium' | 'low' | 'semantic'

export type QuestRewardBreakdown = {
  complexityScore: number
  semanticXp: number
  semanticMinutes: number
  catalogXp: number | null
  catalogMinutes: number | null
  catalogWeight: number
  quantityMultiplier: number
  catalogNeighborCount: number
}

export type QuestMetricsEstimate = Pick<Quest, 'difficulty' | 'xp' | 'estimatedTime'> & {
  skillNodeId: string
  referenceQuestId?: number
  referenceQuestTitle?: string
  matchScore?: number
  quantityMultiplier?: number
  /** Skill tree XP if the player spends the full estimated session. */
  skillXpAtEstimate: number
  confidence: EstimateConfidence
  breakdown: QuestRewardBreakdown
}

function titleTokenSet(text: string): Set<string> {
  const base = tokenizeTitleForTags(normalizeTitleForCatalogMatch(text), 14)
  return expandTitleTokens(base)
}

function tokenSimilarity(a: string, b: string): number {
  const ta = titleTokenSet(a)
  const tb = titleTokenSet(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const t of ta) {
    if (tb.has(t)) inter++
  }
  return inter / Math.sqrt(ta.size * tb.size)
}

function questTitleSimilarity(userTitle: string, quest: Quest): number {
  const normalized = normalizeTitleForCatalogMatch(userTitle)
  const en = tokenSimilarity(normalized, quest.title.en)
  const ru = tokenSimilarity(normalized, quest.title.ru)
  let score = Math.max(en, ru)
  const lowerUser = normalized.toLowerCase()
  for (const raw of [quest.title.en, quest.title.ru]) {
    const lower = normalizeTitleForCatalogMatch(raw).toLowerCase()
    if (lower.length >= 8 && (lowerUser.includes(lower) || lower.includes(lowerUser))) {
      score = Math.max(score, 0.82)
    }
  }
  return score
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function round(n: number): number {
  return Math.round(n)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

function weightedMedian(pairs: { value: number; weight: number }[]): number {
  if (pairs.length === 0) return 0
  const sorted = [...pairs].sort((a, b) => a.value - b.value)
  const total = sorted.reduce((s, p) => s + p.weight, 0)
  if (total <= 0) return median(sorted.map((p) => p.value))
  let acc = 0
  for (const p of sorted) {
    acc += p.weight
    if (acc >= total * 0.5) return p.value
  }
  return sorted[sorted.length - 1]!.value
}

function weightedMean(pairs: { value: number; weight: number }[]): number {
  const total = pairs.reduce((s, p) => s + p.weight, 0)
  if (total <= 0) return 0
  return pairs.reduce((s, p) => s + p.value * p.weight, 0) / total
}

function difficultyFromOrder(order: number): Difficulty {
  const rounded = clamp(Math.round(order), 1, 5)
  return (
    (Object.entries(DIFFICULTY_ORDER).find(([, v]) => v === rounded)?.[0] as Difficulty) ??
    'intermediate'
  )
}

function categoryMedianMetrics(
  catalog: Quest[],
  category: QuestCategory,
): Pick<Quest, 'difficulty' | 'xp' | 'estimatedTime'> {
  const pool = catalog.filter((q) => q.category === category && q.id < USER_QUEST_ID_MIN)
  if (pool.length === 0) {
    return { difficulty: 'novice', xp: 55, estimatedTime: 27 }
  }
  const xp = round(median(pool.map((q) => q.xp)))
  const estimatedTime = round(median(pool.map((q) => q.estimatedTime)))
  const diffs = pool.map((q) => DIFFICULTY_ORDER[q.difficulty])
  const difficulty = difficultyFromOrder(median(diffs))
  return { difficulty, xp, estimatedTime }
}

function catalogTrust(bestScore: number, neighborCount: number, semanticWeight: number): number {
  const match = clamp(bestScore * 1.35, 0, 1)
  const coverage = clamp(neighborCount / 3, 0.2, 1)
  // Strong title match keeps catalog weight even for semantically rich titles.
  const semanticDamp = 1 - semanticWeight * (1 - match) * 0.42
  return match * coverage * semanticDamp
}

function estimateConfidenceFrom(
  bestScore: number,
  neighborCount: number,
  trust: number,
): EstimateConfidence {
  if (neighborCount === 0 || bestScore < MIN_MATCH_SCORE) return 'semantic'
  if (bestScore >= 0.42 && trust >= 0.45) return 'high'
  if (bestScore >= 0.18 && trust >= 0.2) return 'medium'
  return 'low'
}

function finalizeRewards(
  xp: number,
  estimatedTime: number,
  difficulty: Difficulty,
  category: QuestCategory,
): Pick<Quest, 'difficulty' | 'xp' | 'estimatedTime'> {
  const aligned = harmonizeXpTime(xp, estimatedTime, category, difficulty)
  return {
    difficulty,
    xp: roundRewardXp(aligned.xp),
    estimatedTime: roundRewardMinutes(aligned.estimatedTime),
  }
}

function buildEstimate(
  base: Pick<Quest, 'difficulty' | 'xp' | 'estimatedTime'>,
  category: QuestCategory,
  skillNodeId: string,
  breakdown: QuestRewardBreakdown,
  opts: {
    referenceQuestId?: number
    referenceQuestTitle?: string
    matchScore?: number
    confidence: EstimateConfidence
  },
): QuestMetricsEstimate {
  const finalized = finalizeRewards(base.xp, base.estimatedTime, base.difficulty, category)
  return {
    ...finalized,
    skillNodeId,
    referenceQuestId: opts.referenceQuestId,
    referenceQuestTitle: opts.referenceQuestTitle,
    matchScore: opts.matchScore,
    quantityMultiplier: breakdown.quantityMultiplier,
    skillXpAtEstimate: computeSkillXpFromQuest(finalized.xp, finalized.estimatedTime),
    confidence: opts.confidence,
    breakdown,
  }
}

function fallbackFromTitle(
  title: string,
  category: QuestCategory,
  catalog: Quest[],
): QuestMetricsEstimate {
  const scale = extractTitleWorkScale(title)
  const complexity = assessTitleComplexity(title, category)
  const medians = categoryMedianMetrics(catalog, category)
  const semantic = metricsFromComplexityProfile(
    complexity,
    category,
    scale.quantityMultiplier,
    medians,
    title,
  )
  const breakdown: QuestRewardBreakdown = {
    complexityScore: complexity.score,
    semanticXp: semantic.xp,
    semanticMinutes: semantic.estimatedTime,
    catalogXp: null,
    catalogMinutes: null,
    catalogWeight: 0,
    quantityMultiplier: scale.quantityMultiplier,
    catalogNeighborCount: 0,
  }
  return buildEstimate(semantic, category, resolveSkillNodeIdFromTitle(title, category), breakdown, {
    confidence: 'semantic',
  })
}

type Neighbor = { quest: Quest; score: number }

function pickNeighbors(userTitle: string, catalog: Quest[], category: QuestCategory): Neighbor[] {
  const pool = catalog.filter((q) => q.id < USER_QUEST_ID_MIN && q.category === category)
  return pool
    .map((quest) => ({ quest, score: questTitleSimilarity(userTitle, quest) }))
    .filter((n) => n.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_NEIGHBORS)
}

function neighborEffectiveWeight(neighbor: Neighbor, semanticDifficultyOrder: number): number {
  const neighborOrder = DIFFICULTY_ORDER[neighbor.quest.difficulty]
  const dist = Math.abs(neighborOrder - semanticDifficultyOrder)
  const affinity = dist === 0 ? 1 : dist === 1 ? 0.78 : dist === 2 ? 0.52 : 0.32
  return neighbor.score * affinity
}

function coupledCatalogRewards(
  neighbors: Neighbor[],
  semanticDifficultyOrder: number,
  category: QuestCategory,
  fallbackDifficulty: Difficulty,
): { xp: number; minutes: number; difficulty: Difficulty } {
  const pairs = neighbors
    .map((n) => ({
      weight: neighborEffectiveWeight(n, semanticDifficultyOrder),
      xp: n.quest.xp,
      minutes: n.quest.estimatedTime,
      diff: DIFFICULTY_ORDER[n.quest.difficulty],
    }))
    .filter((p) => p.weight > 0.02)

  if (pairs.length === 0) {
    return { xp: 0, minutes: 0, difficulty: fallbackDifficulty }
  }

  const xp = round(weightedMedian(pairs.map((p) => ({ value: p.xp, weight: p.weight }))))
  const ratioPairs = pairs
    .filter((p) => p.xp > 0)
    .map((p) => ({ value: p.minutes / p.xp, weight: p.weight }))
  const targetRatio = typicalMinutesPerXp(category, fallbackDifficulty)
  const ratio =
    ratioPairs.length > 0 ? weightedMedian(ratioPairs) : targetRatio > 0 ? targetRatio : 0.45
  const minutes = round(xp * ratio)
  const difficulty = difficultyFromOrder(
    weightedMean(pairs.map((p) => ({ value: p.diff, weight: p.weight }))),
  )

  return { xp, minutes, difficulty }
}

function blendFromNeighbors(
  neighbors: Neighbor[],
  title: string,
  category: QuestCategory,
  catalog: Quest[],
): QuestMetricsEstimate {
  const scale = extractTitleWorkScale(title)
  const complexity = assessTitleComplexity(title, category)
  const medians = categoryMedianMetrics(catalog, category)
  const semantic = metricsFromComplexityProfile(complexity, category, 1, medians)

  const bestMatch = neighbors[0]?.score ?? 0
  const trust = catalogTrust(bestMatch, neighbors.length, complexity.semanticWeight)
  const confidence = estimateConfidenceFrom(bestMatch, neighbors.length, trust)

  const semanticOrder = DIFFICULTY_ORDER[semantic.difficulty]
  const catalogRaw = coupledCatalogRewards(
    neighbors,
    semanticOrder,
    category,
    semantic.difficulty,
  )

  const catalogXp = catalogRaw.xp || semantic.xp
  const catalogMinutes = catalogRaw.minutes || semantic.estimatedTime
  const catalogDifficulty = catalogRaw.difficulty

  const w = trust
  let xp = round(semantic.xp * (1 - w) + catalogXp * w)
  let estimatedTime = round(semantic.estimatedTime * (1 - w) + catalogMinutes * w)

  let difficulty: Difficulty
  if (w >= 0.55) {
    difficulty = catalogDifficulty
  } else if (w >= 0.25) {
    const blendedOrder =
      DIFFICULTY_ORDER[semantic.difficulty] * (1 - w) +
      DIFFICULTY_ORDER[catalogDifficulty] * w
    difficulty = difficultyFromOrder(blendedOrder)
  } else {
    difficulty = semantic.difficulty
  }

  difficulty = clampDifficultyAtLeast(difficulty, complexity.minDifficulty)

  const refQuest = neighbors[0]?.quest
  if (refQuest && bestMatch >= 0.45) {
    const refOrder = DIFFICULTY_ORDER[refQuest.difficulty]
    if (refOrder <= DIFFICULTY_ORDER.intermediate) {
      const ceiling: Difficulty =
        refQuest.difficulty === 'novice' ? 'intermediate' : 'advanced'
      difficulty = clampDifficultyAtMost(difficulty, ceiling)
    }
  }
  if (isFundamentalDrill(title)) {
    difficulty = clampDifficultyAtMost(difficulty, 'intermediate')
    if (refQuest?.difficulty === 'novice' && bestMatch >= 0.4) {
      difficulty = 'novice'
    }
  }

  const timeHeavy =
    isFundamentalDrill(title) ||
    (scale.primaryNumber != null && scale.primaryNumber >= 10)
  const scaled = applyQuantityToRewards(xp, estimatedTime, scale.quantityMultiplier, {
    timeHeavy,
  })
  xp = scaled.xp
  estimatedTime = scaled.estimatedTime

  const breakdown: QuestRewardBreakdown = {
    complexityScore: complexity.score,
    semanticXp: semantic.xp,
    semanticMinutes: semantic.estimatedTime,
    catalogXp: neighbors.length > 0 ? catalogXp : null,
    catalogMinutes: neighbors.length > 0 ? catalogMinutes : null,
    catalogWeight: Math.round(w * 100) / 100,
    quantityMultiplier: scale.quantityMultiplier,
    catalogNeighborCount: neighbors.length,
  }

  const best = neighbors[0]
  return buildEstimate(
    { difficulty, xp, estimatedTime },
    category,
    resolveSkillNodeIdFromTitle(title, category),
    breakdown,
    {
      referenceQuestId: best?.quest.id,
      referenceQuestTitle: best ? best.quest.title.ru || best.quest.title.en : undefined,
      matchScore: best ? Math.round(best.score * 100) / 100 : undefined,
      confidence,
    },
  )
}

/**
 * Estimates XP, time, difficulty, and skill node from the quest title (catalog calibration + quantity scale).
 */
export function estimateQuestMetrics(
  title: string,
  catalog: Quest[],
  category: QuestCategory,
  description?: string,
): QuestMetricsEstimate {
  const trimmedTitle = title.trim()
  const skillNodeId = resolveSkillNodeIdFromTitle(trimmedTitle, category)

  if (!trimmedTitle) {
    const base = categoryMedianMetrics(catalog, category)
    const breakdown: QuestRewardBreakdown = {
      complexityScore: 0,
      semanticXp: base.xp,
      semanticMinutes: base.estimatedTime,
      catalogXp: null,
      catalogMinutes: null,
      catalogWeight: 0,
      quantityMultiplier: 1,
      catalogNeighborCount: 0,
    }
    return buildEstimate(base, category, skillNodeId, breakdown, { confidence: 'semantic' })
  }

  let neighbors = pickNeighbors(trimmedTitle, catalog, category)

  if (description?.trim()) {
    const descNeighbors = pickNeighbors(description.trim(), catalog, category)
    const merged = new Map<number, Neighbor>()
    for (const n of neighbors) merged.set(n.quest.id, n)
    for (const n of descNeighbors) {
      const prev = merged.get(n.quest.id)
      merged.set(
        n.quest.id,
        prev
          ? { quest: n.quest, score: Math.max(prev.score, n.score * 0.3) }
          : { quest: n.quest, score: n.score * 0.3 },
      )
    }
    neighbors = [...merged.values()].sort((a, b) => b.score - a.score).slice(0, MAX_NEIGHBORS)
  }

  if (neighbors.length === 0) {
    return fallbackFromTitle(trimmedTitle, category, catalog)
  }

  return blendFromNeighbors(neighbors, trimmedTitle, category, catalog)
}

export function nextUserQuestId(existingIds: Iterable<number>): number {
  let max = USER_QUEST_ID_MIN - 1
  for (const id of existingIds) {
    if (id >= USER_QUEST_ID_MIN && id > max) max = id
  }
  return max + 1
}
