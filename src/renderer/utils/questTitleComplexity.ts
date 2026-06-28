import type { Quest } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import { isFundamentalDrill } from '@/utils/questTitleScale'
import {
  CATEGORY_COMPLEXITY_CONFIG,
  DIFFICULTY_ORDER,
  metricsFromCalibration,
  scoreToWithinDifficultyTier,
  type Difficulty,
} from '@/utils/questCatalogCalibration'
import {
  allComplexityCues,
  type ComplexityCue,
} from '@/utils/questTitleComplexitySignals'

export type { Difficulty }

export type TitleComplexityProfile = {
  score: number
  minDifficulty: Difficulty
  /** 0–1 how much to trust semantic complexity vs catalog neighbors */
  semanticWeight: number
  /** Matched conceptual tags (for tags preview / UX hints) */
  inferredTags: string[]
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function scoreToDifficulty(score: number, category: QuestCategory): Difficulty {
  const { thresholds } = CATEGORY_COMPLEXITY_CONFIG[category]
  let result: Difficulty = 'novice'
  for (const [minScore, diff] of thresholds) {
    if (score >= minScore) result = diff
  }
  return result
}

function applyCue(
  text: string,
  cue: ComplexityCue,
  category: QuestCategory,
  seen: Set<string>,
): { delta: number; hint?: string; tag?: string } {
  if (cue.categories && !cue.categories.includes(category)) {
    return { delta: 0 }
  }
  const key = cue.re.source
  if (seen.has(key)) return { delta: 0 }
  const matches = text.match(cue.re)
  if (!matches) return { delta: 0 }
  seen.add(key)
  const hits = Math.min(matches.length, 2)
  return {
    delta: hits * cue.weight,
    hint: cue.hint?.ru,
    tag: cue.hint ? cueTagFromHint(cue) : undefined,
  }
}

function cueTagFromHint(cue: ComplexityCue): string | undefined {
  if (!cue.hint) return undefined
  const en = cue.hint.en.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return en.length >= 3 ? en.slice(0, 32) : undefined
}

/** Semantic difficulty / workload from title wording (independent of catalog token match). */
export function assessTitleComplexity(title: string, category: QuestCategory): TitleComplexityProfile {
  const text = title.trim().toLowerCase()
  const config = CATEGORY_COMPLEXITY_CONFIG[category]
  const inferredTags = new Set<string>()

  if (!text) {
    return {
      score: config.baseScore,
      minDifficulty: 'novice',
      semanticWeight: 0.35,
      inferredTags: [],
    }
  }

  let score = config.baseScore
  const words = text.split(/\s+/).filter(Boolean).length
  score += Math.min(3, words * 0.28)

  const seen = new Set<string>()
  for (const cue of allComplexityCues(category)) {
    const { delta, tag } = applyCue(text, cue, category, seen)
    if (delta !== 0) {
      score += delta
      if (tag) inferredTags.add(tag)
    }
  }

  // Colon-style catalog titles ("Силуэт: …") imply structured exercise series
  if (/^[^:：]{3,28}[:：]/.test(title.trim())) score += 1.5

  if (isFundamentalDrill(title)) {
    score = Math.min(score, config.baseScore + 5.5)
  }

  const minDifficulty = scoreToDifficulty(score, category)
  const maxThreshold = config.thresholds[config.thresholds.length - 1]![0]
  const semanticWeight = clamp((score - config.baseScore) / (maxThreshold - config.baseScore + 4), 0.38, 0.94)

  return {
    score,
    minDifficulty,
    semanticWeight,
    inferredTags: [...inferredTags],
  }
}

/** Localized hints for AddQuest preview (“понимает вас”). */
export function getTitleComplexityHints(
  title: string,
  category: QuestCategory,
  language: 'ru' | 'en',
): string[] {
  if (!title.trim()) return []
  const text = title.trim().toLowerCase()
  const hints: string[] = []
  for (const cue of allComplexityCues(category)) {
    if (!cue.hint) continue
    if (cue.categories && !cue.categories.includes(category)) continue
    if (cue.re.test(text)) {
      hints.push(language === 'ru' ? cue.hint.ru : cue.hint.en)
      if (hints.length >= 6) break
    }
  }
  return hints
}

export function metricsFromComplexityProfile(
  profile: TitleComplexityProfile,
  category: QuestCategory,
  quantityMultiplier: number,
  catalogMedians: { xp: number; estimatedTime: number; difficulty: Difficulty },
  title?: string,
): Pick<Quest, 'difficulty' | 'xp' | 'estimatedTime'> {
  const difficulty = profile.minDifficulty
  const tier = scoreToWithinDifficultyTier(profile.score, category, difficulty)
  const quantityOpts = title
    ? { timeHeavy: isFundamentalDrill(title) }
    : undefined

  const calibrated = metricsFromCalibration(
    difficulty,
    tier,
    category,
    quantityMultiplier,
    quantityOpts,
  )

  let { xp, estimatedTime } = calibrated

  const medianOrder = DIFFICULTY_ORDER[catalogMedians.difficulty]
  const profileOrder = DIFFICULTY_ORDER[profile.minDifficulty]
  if (profileOrder >= medianOrder + 2 && profile.score >= 14) {
    const lift = profileOrder >= DIFFICULTY_ORDER.expert ? 1.06 : 1.03
    xp = Math.min(750, Math.round(xp * lift))
    estimatedTime = Math.min(240, Math.round(estimatedTime * lift))
  } else if (profileOrder <= medianOrder - 1 && profile.score <= configBase(category) + 4) {
    xp = Math.min(xp, Math.round(catalogMedians.xp * 0.92))
    estimatedTime = Math.min(estimatedTime, Math.round(catalogMedians.estimatedTime * 0.92))
  }

  return {
    difficulty: clampDifficultyAtLeast(calibrated.difficulty, profile.minDifficulty),
    xp,
    estimatedTime,
  }
}

function configBase(category: QuestCategory): number {
  return CATEGORY_COMPLEXITY_CONFIG[category].baseScore
}

export function clampDifficultyAtLeast(current: Difficulty, floor: Difficulty): Difficulty {
  return DIFFICULTY_ORDER[current] >= DIFFICULTY_ORDER[floor] ? current : floor
}

export function clampDifficultyAtMost(current: Difficulty, ceiling: Difficulty): Difficulty {
  return DIFFICULTY_ORDER[current] <= DIFFICULTY_ORDER[ceiling] ? current : ceiling
}

export { DIFFICULTY_ORDER }
