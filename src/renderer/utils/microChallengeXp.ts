import type { Quest } from '@/store/models'
import { inferPhaseTransitionKey } from '@/utils/phaseTransitionLabels'

/** Share of each micro-challenge face XP awarded to the skill node on phase complete. */
export const PHASE_NODE_XP_RATIO = 0.175

/** Max total phase XP as a fraction of quest face XP (prevents double-counting with full quest reward). */
export const MAX_PHASE_XP_QUEST_RATIO = 0.3

/** Phase-type weights — core and polish reward structured work more than warmup. */
export const PHASE_TYPE_WEIGHT: Record<PhaseLabelKey, number> = {
  warmup: 1,
  core: 1.5,
  polish: 2,
  step: 1,
}

export function computePhaseNodeXpAmounts(quest: Quest): Map<string, number> {
  const challenges = quest.microChallenges ?? []
  const result = new Map<string, number>()
  if (challenges.length === 0 || quest.xp <= 0) return result

  const rawById = new Map<string, number>()
  let rawTotal = 0
  for (const mc of challenges) {
    const phaseKey = phaseLabelKeyForChallenge(mc.id)
    const weight = PHASE_TYPE_WEIGHT[phaseKey]
    const raw = mc.xp > 0 ? Math.max(1, Math.round(mc.xp * PHASE_NODE_XP_RATIO * weight)) : 0
    rawById.set(mc.id, raw)
    rawTotal += raw
  }

  const maxTotal = Math.max(1, Math.round(quest.xp * MAX_PHASE_XP_QUEST_RATIO))
  const scale = rawTotal > maxTotal ? maxTotal / rawTotal : 1

  let scaledTotal = 0
  for (const [id, raw] of rawById) {
    const scaled = raw > 0 ? Math.max(1, Math.round(raw * scale)) : 0
    result.set(id, scaled)
    scaledTotal += scaled
  }

  if (scaledTotal > maxTotal) {
    for (const [id, value] of result) {
      if (scaledTotal <= maxTotal) break
      const reduction = Math.min(value, scaledTotal - maxTotal)
      result.set(id, value - reduction)
      scaledTotal -= reduction
    }
  }
  return result
}

export function computePhaseNodeXp(quest: Quest, challengeId: string): number {
  return computePhaseNodeXpAmounts(quest).get(challengeId) ?? 0
}

export type PhaseLabelKey = 'warmup' | 'core' | 'polish' | 'step'

export function phaseLabelKeyForChallenge(challengeId: string): PhaseLabelKey {
  return inferPhaseTransitionKey(challengeId) ?? 'step'
}
