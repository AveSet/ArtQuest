import type { Quest } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import { applyQuantityToRewards } from '@/utils/questTitleScale'

export type Difficulty = Quest['difficulty']

/** Median XP/time from built-in catalog (1422 quests, May 2026). */
export type DifficultyBand = {
  xpP50: number
  xpP75: number
  timeP50: number
  timeP75: number
}

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  novice: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
  master: 5,
}

/** Per-category difficulty bands — drives XP/time after semantic score. */
export const CATALOG_CALIBRATION: Record<QuestCategory, Partial<Record<Difficulty, DifficultyBand>>> = {
  drawing: {
    novice: { xpP50: 54, xpP75: 56, timeP50: 27, timeP75: 28 },
    intermediate: { xpP50: 88, xpP75: 95, timeP50: 40, timeP75: 43 },
    advanced: { xpP50: 149, xpP75: 170, timeP50: 55, timeP75: 63 },
    expert: { xpP50: 326, xpP75: 326, timeP50: 105, timeP75: 105 },
    master: { xpP50: 363, xpP75: 436, timeP50: 110, timeP75: 132 },
  },
  anatomy: {
    novice: { xpP50: 54, xpP75: 60, timeP50: 27, timeP75: 30 },
    intermediate: { xpP50: 84, xpP75: 101, timeP50: 38, timeP75: 46 },
    advanced: { xpP50: 157, xpP75: 184, timeP50: 58, timeP75: 68 },
    expert: { xpP50: 264, xpP75: 264, timeP50: 85, timeP75: 85 },
    master: { xpP50: 363, xpP75: 446, timeP50: 110, timeP75: 135 },
  },
  animation: {
    novice: { xpP50: 62, xpP75: 72, timeP50: 30, timeP75: 34 },
    intermediate: { xpP50: 86, xpP75: 101, timeP50: 39, timeP75: 46 },
    advanced: { xpP50: 178, xpP75: 211, timeP50: 66, timeP75: 78 },
    expert: { xpP50: 264, xpP75: 264, timeP50: 85, timeP75: 85 },
    master: { xpP50: 363, xpP75: 439, timeP50: 110, timeP75: 133 },
  },
  effects: {
    novice: { xpP50: 62, xpP75: 64, timeP50: 31, timeP75: 32 },
    intermediate: { xpP50: 81, xpP75: 92, timeP50: 37, timeP75: 42 },
    advanced: { xpP50: 165, xpP75: 167, timeP50: 61, timeP75: 62 },
    expert: { xpP50: 264, xpP75: 264, timeP50: 85, timeP75: 85 },
    master: { xpP50: 363, xpP75: 422, timeP50: 110, timeP75: 128 },
  },
  storytelling: {
    novice: { xpP50: 54, xpP75: 58, timeP50: 27, timeP75: 29 },
    intermediate: { xpP50: 92, xpP75: 92, timeP50: 42, timeP75: 42 },
    advanced: { xpP50: 159, xpP75: 181, timeP50: 59, timeP75: 67 },
    master: { xpP50: 366, xpP75: 449, timeP50: 111, timeP75: 136 },
  },
  character_design: {
    novice: { xpP50: 62, xpP75: 66, timeP50: 31, timeP75: 33 },
    intermediate: { xpP50: 95, xpP75: 97, timeP50: 43, timeP75: 44 },
    advanced: { xpP50: 154, xpP75: 257, timeP50: 57, timeP75: 95 },
    expert: { xpP50: 264, xpP75: 295, timeP50: 85, timeP75: 95 },
    master: { xpP50: 363, xpP75: 363, timeP50: 110, timeP75: 110 },
  },
  environment: {
    novice: { xpP50: 72, xpP75: 78, timeP50: 33, timeP75: 36 },
    intermediate: { xpP50: 101, xpP75: 101, timeP50: 46, timeP75: 46 },
    advanced: { xpP50: 173, xpP75: 205, timeP50: 64, timeP75: 76 },
    expert: { xpP50: 264, xpP75: 264, timeP50: 85, timeP75: 85 },
    master: { xpP50: 363, xpP75: 363, timeP50: 110, timeP75: 110 },
  },
}

/** Category baseline + score thresholds for difficulty tiers. */
export const CATEGORY_COMPLEXITY_CONFIG: Record<
  QuestCategory,
  { baseScore: number; thresholds: [number, Difficulty][] }
> = {
  drawing: {
    baseScore: 2,
    thresholds: [
      [6, 'novice'],
      [9, 'intermediate'],
      [13, 'advanced'],
      [17, 'expert'],
      [21, 'master'],
    ],
  },
  anatomy: {
    baseScore: 3,
    thresholds: [
      [6, 'novice'],
      [10, 'intermediate'],
      [14, 'advanced'],
      [18, 'expert'],
      [22, 'master'],
    ],
  },
  animation: {
    baseScore: 4,
    thresholds: [
      [7, 'novice'],
      [11, 'intermediate'],
      [15, 'advanced'],
      [19, 'expert'],
      [23, 'master'],
    ],
  },
  effects: {
    baseScore: 3,
    thresholds: [
      [6, 'novice'],
      [10, 'intermediate'],
      [14, 'advanced'],
      [18, 'expert'],
      [22, 'master'],
    ],
  },
  storytelling: {
    baseScore: 3,
    thresholds: [
      [6, 'novice'],
      [10, 'intermediate'],
      [14, 'advanced'],
      [18, 'expert'],
      [22, 'master'],
    ],
  },
  character_design: {
    baseScore: 3,
    thresholds: [
      [6, 'novice'],
      [10, 'intermediate'],
      [14, 'advanced'],
      [18, 'expert'],
      [22, 'master'],
    ],
  },
  environment: {
    baseScore: 3,
    thresholds: [
      [7, 'novice'],
      [11, 'intermediate'],
      [15, 'advanced'],
      [19, 'expert'],
      [23, 'master'],
    ],
  },
}

export function getCategoryMedianMetrics(
  catalog: Quest[],
  category: QuestCategory,
): { xp: number; estimatedTime: number; difficulty: Difficulty } {
  const pool = catalog.filter((q) => q.category === category)
  if (pool.length === 0) {
    return { xp: 90, estimatedTime: 42, difficulty: 'intermediate' }
  }
  const xp = median(pool.map((q) => q.xp))
  const estimatedTime = median(pool.map((q) => q.estimatedTime))
  const diffMed = median(pool.map((q) => DIFFICULTY_ORDER[q.difficulty]))
  const difficulty =
    (Object.entries(DIFFICULTY_ORDER).find(([, v]) => v === Math.round(diffMed))?.[0] as Difficulty) ??
    'intermediate'
  return { xp, estimatedTime, difficulty }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

/** 0–1 position of semantic score inside the active difficulty band (for XP/time tier). */
export function scoreToWithinDifficultyTier(
  score: number,
  category: QuestCategory,
  difficulty: Difficulty,
): number {
  const config = CATEGORY_COMPLEXITY_CONFIG[category]
  const thresholds = config.thresholds
  let bandStart = config.baseScore
  let bandEnd = thresholds[0]?.[0] ?? config.baseScore + 4

  for (let i = 0; i < thresholds.length; i++) {
    if (thresholds[i]![1] !== difficulty) continue
    bandStart = i === 0 ? config.baseScore : thresholds[i - 1]![0]
    bandEnd = thresholds[i + 1]?.[0] ?? thresholds[i]![0] + 5
    break
  }

  if (score <= bandStart) return 0
  if (score >= bandEnd) return 1
  return clamp((score - bandStart) / Math.max(bandEnd - bandStart, 0.5), 0, 1)
}

/** Typical practice minutes per quest XP point for a difficulty band. */
export function typicalMinutesPerXp(category: QuestCategory, difficulty: Difficulty): number {
  const band =
    CATALOG_CALIBRATION[category][difficulty] ??
    CATALOG_CALIBRATION[category].intermediate ??
    Object.values(CATALOG_CALIBRATION[category])[0]!
  return band.xpP50 > 0 ? band.timeP50 / band.xpP50 : 0.45
}

/** Keeps XP/time aligned with catalog norms after blending and quantity scaling. */
export function harmonizeXpTime(
  xp: number,
  estimatedTime: number,
  category: QuestCategory,
  difficulty: Difficulty,
): { xp: number; estimatedTime: number } {
  const bands = CATALOG_CALIBRATION[category]
  const band =
    bands[difficulty] ??
    bands.intermediate ??
    bands.advanced ??
    Object.values(bands)[0]

  const targetRatio = typicalMinutesPerXp(category, difficulty)
  let adjXp = xp
  let time = estimatedTime

  if (band) {
    const softMin = Math.round(band.xpP50 * 0.82)
    const softMax = Math.round(Math.max(band.xpP75 * 1.28, band.xpP50 * 1.45))
    if (adjXp < softMin) adjXp = Math.round(adjXp * 0.55 + softMin * 0.45)
    else if (adjXp > softMax) adjXp = Math.round(adjXp * 0.55 + softMax * 0.45)
  }

  const ratio = adjXp > 0 ? time / adjXp : targetRatio
  if (ratio > targetRatio * 1.4) {
    time = Math.round(adjXp * targetRatio * 1.22)
  } else if (ratio < targetRatio * 0.55) {
    time = Math.round(adjXp * targetRatio * 0.92)
  } else if (ratio > targetRatio * 1.18) {
    time = Math.round(adjXp * targetRatio * 1.12)
  } else if (ratio < targetRatio * 0.72) {
    time = Math.round(adjXp * targetRatio * 0.82)
  }

  return { xp: adjXp, estimatedTime: time }
}

export function roundRewardXp(xp: number): number {
  return clamp(Math.round(xp / 5) * 5, 20, 750)
}

export function roundRewardMinutes(minutes: number): number {
  return clamp(Math.round(minutes / 5) * 5, 10, 240)
}

export function metricsFromCalibration(
  difficulty: Difficulty,
  tier: number,
  category: QuestCategory,
  quantityMultiplier: number,
  quantityOpts?: { timeHeavy?: boolean },
): Pick<Quest, 'difficulty' | 'xp' | 'estimatedTime'> {
  const bands = CATALOG_CALIBRATION[category]
  const band =
    bands[difficulty] ??
    bands.intermediate ??
    bands.advanced ??
    Object.values(bands)[0]!
  const t = clamp(tier, 0, 1)
  const xp = Math.round(band.xpP50 + (band.xpP75 - band.xpP50) * t)
  const estimatedTime = Math.round(band.timeP50 + (band.timeP75 - band.timeP50) * t)
  const scaled = applyQuantityToRewards(xp, estimatedTime, quantityMultiplier, quantityOpts)
  const aligned = harmonizeXpTime(scaled.xp, scaled.estimatedTime, category, difficulty)
  return {
    difficulty,
    xp: roundRewardXp(aligned.xp),
    estimatedTime: roundRewardMinutes(aligned.estimatedTime),
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
