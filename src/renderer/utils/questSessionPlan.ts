import type { MicroChallenge, Quest } from '@/store/models'

/** Extra minutes when the player opts into reference materials during a quest session. */
export const QUEST_REFERENCE_BONUS_MINUTES = 10

export type ExerciseSessionPhase = {
  kind: 'exercise'
  challengeId: string
  durationSec: number
  xp: number
}

export type ReferenceSessionPhase = {
  kind: 'reference'
  durationSec: number
}

import type { FundamentalsTrackKind } from '@/data/fundamentalsExercises'

export type FundamentalsSessionPhase = {
  kind: 'fundamentals'
  trackKind: FundamentalsTrackKind
  phaseIndex: number
  durationSec: number
  xp: number
}

export type SessionPhase = ExerciseSessionPhase | ReferenceSessionPhase | FundamentalsSessionPhase

export function orderMicroChallenges(challenges: MicroChallenge[]): MicroChallenge[] {
  if (challenges.length <= 1) return [...challenges]
  const sorted: MicroChallenge[] = []
  const done = new Set<string>()
  let guard = 0
  while (sorted.length < challenges.length && guard++ < challenges.length * 3) {
    let added = false
    for (const c of challenges) {
      if (done.has(c.id)) continue
      if (!c.prerequisite || done.has(c.prerequisite)) {
        sorted.push(c)
        done.add(c.id)
        added = true
      }
    }
    if (!added) break
  }
  return sorted.length === challenges.length ? sorted : [...challenges]
}

/** Practice minutes from quick exercises, or quest estimate when none exist. */
export function sumMicroChallengeMinutes(quest: Pick<Quest, 'estimatedTime' | 'microChallenges'>): number {
  const mcs = quest.microChallenges
  if (!mcs?.length) return quest.estimatedTime
  return mcs.reduce((sum, mc) => sum + mc.estimatedTime, 0)
}

export function getQuestDisplayMinutes(
  quest: Pick<Quest, 'estimatedTime' | 'microChallenges'>,
  withReference = false,
  minutesOverride?: number,
): number {
  const base = minutesOverride ?? quest.estimatedTime
  return base + (withReference ? QUEST_REFERENCE_BONUS_MINUTES : 0)
}

/** Main practice minutes for session timer (personalized or micro-challenge sum). */
export function getQuestSessionMainMinutes(
  quest: Pick<Quest, 'estimatedTime' | 'microChallenges'>,
  minutesOverride?: number,
): number {
  if (minutesOverride != null && minutesOverride > 0) return minutesOverride
  return sumMicroChallengeMinutes(quest)
}

export function buildSessionPhases(
  quest: Pick<Quest, 'microChallenges'>,
  withReference: boolean,
): SessionPhase[] {
  const mcs = quest.microChallenges
  if (!mcs?.length) {
    return withReference
      ? [{ kind: 'reference', durationSec: QUEST_REFERENCE_BONUS_MINUTES * 60 }]
      : []
  }

  const phases: SessionPhase[] = orderMicroChallenges(mcs).map((mc) => ({
    kind: 'exercise' as const,
    challengeId: mc.id,
    durationSec: mc.estimatedTime * 60,
    xp: mc.xp,
  }))

  if (withReference) {
    phases.unshift({ kind: 'reference', durationSec: QUEST_REFERENCE_BONUS_MINUTES * 60 })
  }

  return phases
}

export type QuestSessionStartPlan = {
  mainMinutes: number
  referenceMinutes: number
  totalMinutes: number
  phases: SessionPhase[]
  /** Reference block is at the start of the pool when opted in before exercise phases. */
  referenceAtEnd: boolean
}

export function buildQuestSessionStart(
  quest: Pick<Quest, 'id' | 'estimatedTime' | 'microChallenges'>,
  withReference: boolean,
  options?: { mainMinutesOverride?: number },
): QuestSessionStartPlan {
  const hasExercisePhases = (quest.microChallenges?.length ?? 0) > 0
  const catalogExerciseMinutes = sumMicroChallengeMinutes(quest)
  const exerciseMinutes = getQuestSessionMainMinutes(quest, options?.mainMinutesOverride)
  const referenceMinutes = withReference ? QUEST_REFERENCE_BONUS_MINUTES : 0
  const mainMinutes = hasExercisePhases ? exerciseMinutes : quest.estimatedTime
  let phases = hasExercisePhases ? buildSessionPhases(quest, withReference) : []
  if (
    hasExercisePhases &&
    options?.mainMinutesOverride != null &&
    catalogExerciseMinutes > 0 &&
    exerciseMinutes !== catalogExerciseMinutes
  ) {
    const scale = exerciseMinutes / catalogExerciseMinutes
    phases = phases.map((phase) =>
      phase.kind === 'exercise'
        ? { ...phase, durationSec: Math.max(60, Math.round(phase.durationSec * scale)) }
        : phase,
    )
  }
  return {
    mainMinutes,
    referenceMinutes,
    totalMinutes: mainMinutes + referenceMinutes,
    phases,
    referenceAtEnd: false,
  }
}
