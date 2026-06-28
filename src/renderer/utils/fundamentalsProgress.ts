import {
  buildFundamentalsTrackSessionPhases,
  FUNDAMENTALS_ADVANCED_GATE_COUNT,
  FUNDAMENTALS_ADVANCED_ID_MAX,
  FUNDAMENTALS_ADVANCED_ID_MIN,
  FUNDAMENTALS_EXERCISES,
  FUNDAMENTALS_NOVICE_PART_A_COUNT,
  FUNDAMENTALS_NOVICE_PART_B_COUNT,
  FUNDAMENTALS_NOVICE_PHASE_COUNT,
  FUNDAMENTALS_TRACK_MEDIUM_ID,
  FUNDAMENTALS_TRACK_NOVICE_B_ID,
  FUNDAMENTALS_TRACK_NOVICE_ID,
  getFundamentalsQuestById,
  getFundamentalsTrackKind,
  getFundamentalsTrackPhaseCount,
  isFundamentalsAdvancedId,
  isFundamentalsNovicePartAId,
  isFundamentalsNovicePartBId,
  isFundamentalsQuestId,
  isFundamentalsTrackId,
  type FundamentalsExercise,
  type FundamentalsTrackKind,
} from '@/data/fundamentalsExercises'
import type { ExperienceTier } from '@/utils/experienceTier'
import type { SessionPhase } from '@/utils/questSessionPlan'

/** @deprecated Use FUNDAMENTALS_ADVANCED_GATE_COUNT; kept for copy fallbacks. */
export const FUNDAMENTALS_GATE_COUNT = FUNDAMENTALS_ADVANCED_GATE_COUNT

export {
  FUNDAMENTALS_ADVANCED_GATE_COUNT,
}

const LEGACY_FUNDAMENTALS_ID_MIN = 96001
const LEGACY_FUNDAMENTALS_ID_MAX = 96025

export type FundamentalsProgress = {
  completedIds: number[]
  trackPhaseDone: Partial<Record<FundamentalsTrackKind, number>>
  lastCompletedDate: string
}

export const EMPTY_FUNDAMENTALS_PROGRESS: FundamentalsProgress = {
  completedIds: [],
  trackPhaseDone: {},
  lastCompletedDate: '',
}

function mapLegacyAdvancedId(oldId: number): number | null {
  if (oldId < 96018 || oldId > 96025) return null
  return FUNDAMENTALS_ADVANCED_ID_MIN + (oldId - 96018)
}

function migrateLegacyFundamentalsProgress(
  completedIds: number[],
  trackPhaseDone: Partial<Record<FundamentalsTrackKind, number>>,
): { completedIds: number[]; trackPhaseDone: Partial<Record<FundamentalsTrackKind, number>> } {
  const hasLegacy = completedIds.some(
    (id) => id >= LEGACY_FUNDAMENTALS_ID_MIN && id <= LEGACY_FUNDAMENTALS_ID_MAX && id > FUNDAMENTALS_ADVANCED_ID_MAX,
  )
  if (!hasLegacy) return { completedIds, trackPhaseDone }

  const nextIds = new Set<number>()
  const nextPhases = { ...trackPhaseDone }

  for (const id of completedIds) {
    if (id >= LEGACY_FUNDAMENTALS_ID_MIN && id <= 96008) {
      nextPhases.novice = FUNDAMENTALS_NOVICE_PHASE_COUNT
      nextIds.add(FUNDAMENTALS_TRACK_NOVICE_ID)
      nextIds.add(FUNDAMENTALS_TRACK_NOVICE_B_ID)
      continue
    }
    if (id >= 96009 && id <= 96017) {
      nextPhases.medium = getFundamentalsTrackPhaseCount('medium')
      nextIds.add(FUNDAMENTALS_TRACK_MEDIUM_ID)
      continue
    }
    const mapped = mapLegacyAdvancedId(id)
    if (mapped != null) {
      nextIds.add(mapped)
      continue
    }
    if (isFundamentalsAdvancedId(id) || isFundamentalsTrackId(id)) {
      nextIds.add(id)
    }
  }

  return { completedIds: [...nextIds], trackPhaseDone: nextPhases }
}

function migrateNoviceSplitProgress(
  completedIds: number[],
  trackPhaseDone: Partial<Record<FundamentalsTrackKind, number>>,
): { completedIds: number[]; trackPhaseDone: Partial<Record<FundamentalsTrackKind, number>> } {
  const nextIds = new Set(completedIds)
  let nextPhases = { ...trackPhaseDone }

  const legacyNoviceCount = completedIds.filter((id) => id >= 96001 && id <= 96008).length
  if (legacyNoviceCount >= 8) {
    nextPhases = { ...nextPhases, novice: FUNDAMENTALS_NOVICE_PHASE_COUNT }
    nextIds.add(FUNDAMENTALS_TRACK_NOVICE_ID)
    nextIds.add(FUNDAMENTALS_TRACK_NOVICE_B_ID)
    return { completedIds: [...nextIds], trackPhaseDone: nextPhases }
  }

  const noviceDone = nextPhases.novice ?? 0

  if (noviceDone >= FUNDAMENTALS_NOVICE_PART_A_COUNT) {
    nextIds.add(FUNDAMENTALS_TRACK_NOVICE_ID)
  }
  if (noviceDone >= FUNDAMENTALS_NOVICE_PHASE_COUNT) {
    nextIds.add(FUNDAMENTALS_TRACK_NOVICE_B_ID)
  }

  if (
    nextIds.has(FUNDAMENTALS_TRACK_NOVICE_ID) &&
    noviceDone >= FUNDAMENTALS_NOVICE_PHASE_COUNT &&
    !nextIds.has(FUNDAMENTALS_TRACK_NOVICE_B_ID)
  ) {
    nextIds.add(FUNDAMENTALS_TRACK_NOVICE_B_ID)
  }

  return { completedIds: [...nextIds], trackPhaseDone: nextPhases }
}

export function normalizeFundamentalsProgress(
  raw: Partial<FundamentalsProgress> | undefined | null,
): FundamentalsProgress {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_FUNDAMENTALS_PROGRESS }
  const completedIds = Array.isArray(raw.completedIds)
    ? raw.completedIds.filter((id): id is number => typeof id === 'number' && Number.isFinite(id))
    : []
  const trackPhaseDone: Partial<Record<FundamentalsTrackKind, number>> = {}
  if (raw.trackPhaseDone && typeof raw.trackPhaseDone === 'object') {
    for (const kind of ['novice', 'medium'] as const) {
      const v = raw.trackPhaseDone[kind]
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        const max =
          kind === 'novice'
            ? FUNDAMENTALS_NOVICE_PHASE_COUNT
            : getFundamentalsTrackPhaseCount('medium')
        trackPhaseDone[kind] = Math.min(v, max)
      }
    }
  }

  const migrated = migrateLegacyFundamentalsProgress(completedIds, trackPhaseDone)
  const split = migrateNoviceSplitProgress(migrated.completedIds, migrated.trackPhaseDone)
  return {
    completedIds: [...new Set(split.completedIds)],
    trackPhaseDone: split.trackPhaseDone,
    lastCompletedDate: typeof raw.lastCompletedDate === 'string' ? raw.lastCompletedDate : '',
  }
}

export function isNovicePartAComplete(progress: FundamentalsProgress): boolean {
  return (
    progress.completedIds.includes(FUNDAMENTALS_TRACK_NOVICE_ID) ||
    (progress.trackPhaseDone?.novice ?? 0) >= FUNDAMENTALS_NOVICE_PART_A_COUNT
  )
}

export function isNovicePartBComplete(progress: FundamentalsProgress): boolean {
  return (
    progress.completedIds.includes(FUNDAMENTALS_TRACK_NOVICE_B_ID) ||
    (progress.trackPhaseDone?.novice ?? 0) >= FUNDAMENTALS_NOVICE_PHASE_COUNT
  )
}

export function isNoviceTrackComplete(progress: FundamentalsProgress): boolean {
  return isNovicePartBComplete(progress)
}

export function isMediumTrackComplete(progress: FundamentalsProgress): boolean {
  return (
    progress.completedIds.includes(FUNDAMENTALS_TRACK_MEDIUM_ID) ||
    (progress.trackPhaseDone?.medium ?? 0) >= getFundamentalsTrackPhaseCount('medium')
  )
}

export function isFundamentalsTrackComplete(progress: FundamentalsProgress): boolean {
  return isNoviceTrackComplete(progress) || isMediumTrackComplete(progress)
}

export function getAdvancedCompletedCount(progress: FundamentalsProgress): number {
  return progress.completedIds.filter((id) => isFundamentalsAdvancedId(id)).length
}

export function getFundamentalsCompletedCount(progress: FundamentalsProgress): number {
  let count = getAdvancedCompletedCount(progress)
  if (isNovicePartAComplete(progress)) count += 1
  if (isNovicePartBComplete(progress)) count += 1
  if (isMediumTrackComplete(progress)) count += 1
  return count
}

/** True after the user completes at least one fundamentals exercise (any track phase or advanced quest). */
export function hasCompletedFundamentalsExercise(progress: FundamentalsProgress): boolean {
  if (progress.completedIds.some((id) => isFundamentalsQuestId(id))) return true
  if ((progress.trackPhaseDone?.novice ?? 0) > 0) return true
  if ((progress.trackPhaseDone?.medium ?? 0) > 0) return true
  return false
}

export function isFundamentalsGateCleared(progress: FundamentalsProgress): boolean {
  return hasCompletedFundamentalsExercise(progress)
}

export function isFundamentalsPathComplete(progress: FundamentalsProgress): boolean {
  const allAdvanced = FUNDAMENTALS_EXERCISES.filter((ex) => isFundamentalsAdvancedId(ex.id))
  return (
    isNoviceTrackComplete(progress) &&
    isMediumTrackComplete(progress) &&
    allAdvanced.every((ex) => progress.completedIds.includes(ex.id))
  )
}

export function shouldUseFundamentalsPath(
  experienceTier: ExperienceTier,
  progress: FundamentalsProgress,
): boolean {
  return experienceTier === 'beginner' && !isFundamentalsGateCleared(progress)
}

export function shouldGateDailiesForBeginner(
  experienceTier: ExperienceTier,
  progress: FundamentalsProgress,
): boolean {
  return experienceTier === 'beginner' && !isFundamentalsGateCleared(progress)
}

export function shouldPrioritizeFundamentalsAction(
  experienceTier: ExperienceTier,
  progress: FundamentalsProgress,
): boolean {
  return shouldGateDailiesForBeginner(experienceTier, progress)
}

export function getNextFundamentalsExercise(
  progress: FundamentalsProgress,
): FundamentalsExercise | undefined {
  if (!isNovicePartAComplete(progress)) {
    return FUNDAMENTALS_EXERCISES.find((ex) => ex.id === FUNDAMENTALS_TRACK_NOVICE_ID)
  }
  if (!isNoviceTrackComplete(progress)) {
    return FUNDAMENTALS_EXERCISES.find((ex) => ex.id === FUNDAMENTALS_TRACK_NOVICE_B_ID)
  }
  if (!isMediumTrackComplete(progress)) {
    return FUNDAMENTALS_EXERCISES.find((ex) => ex.id === FUNDAMENTALS_TRACK_MEDIUM_ID)
  }
  if (getAdvancedCompletedCount(progress) < FUNDAMENTALS_ADVANCED_GATE_COUNT) {
    return FUNDAMENTALS_EXERCISES.find(
      (ex) => isFundamentalsAdvancedId(ex.id) && !progress.completedIds.includes(ex.id),
    )
  }
  return undefined
}

export function getFundamentalsTrackPhaseStartIndex(
  progress: FundamentalsProgress,
  trackKind: FundamentalsTrackKind,
  questId?: number,
): number {
  const globalDone = progress.trackPhaseDone?.[trackKind] ?? 0

  if (trackKind === 'novice' && questId === FUNDAMENTALS_TRACK_NOVICE_B_ID) {
    if (progress.completedIds.includes(FUNDAMENTALS_TRACK_NOVICE_B_ID)) {
      return FUNDAMENTALS_NOVICE_PART_B_COUNT
    }
    return Math.max(0, Math.min(FUNDAMENTALS_NOVICE_PART_B_COUNT, globalDone - FUNDAMENTALS_NOVICE_PART_A_COUNT))
  }

  if (trackKind === 'novice') {
    if (progress.completedIds.includes(FUNDAMENTALS_TRACK_NOVICE_ID)) {
      return FUNDAMENTALS_NOVICE_PART_A_COUNT
    }
    return Math.min(FUNDAMENTALS_NOVICE_PART_A_COUNT, globalDone)
  }

  if (progress.completedIds.includes(FUNDAMENTALS_TRACK_MEDIUM_ID)) {
    return getFundamentalsTrackPhaseCount('medium')
  }
  return globalDone
}

/** Phased session plan for novice/medium fundamentals tracks (resume or restart). */
export function resolveFundamentalsTrackSessionStart(
  questId: number,
  progress: FundamentalsProgress,
): { mainMinutesOverride: number; phasesOverride: SessionPhase[] } | undefined {
  if (!isFundamentalsTrackId(questId)) return undefined
  const exercise = getFundamentalsQuestById(questId)
  const kind = getFundamentalsTrackKind(questId)
  if (!exercise || !kind) return undefined

  let startIndex = getFundamentalsTrackPhaseStartIndex(progress, kind, questId)
  let phasesOverride = buildFundamentalsTrackSessionPhases(exercise, startIndex)
  if (phasesOverride.length === 0) {
    startIndex = 0
    phasesOverride = buildFundamentalsTrackSessionPhases(exercise, 0)
  }
  if (phasesOverride.length === 0) return undefined

  const mainMinutesOverride = Math.max(
    1,
    Math.round(phasesOverride.reduce((sum, phase) => sum + phase.durationSec, 0) / 60),
  )
  return { mainMinutesOverride, phasesOverride }
}

export function canCompleteFundamentalsExercise(
  questId: number,
  progress: FundamentalsProgress,
): boolean {
  if (progress.completedIds.includes(questId)) return true
  if (isFundamentalsTrackId(questId)) {
    const kind = getFundamentalsTrackKind(questId)
    if (!kind) return false
    if (isFundamentalsNovicePartAId(questId) && isNovicePartAComplete(progress)) return true
    if (isFundamentalsNovicePartBId(questId) && isNoviceTrackComplete(progress)) return true
    if (kind === 'medium' && isMediumTrackComplete(progress)) return true
    return true
  }
  if (isFundamentalsAdvancedId(questId)) return true
  return false
}

export function getFundamentalsUnlockState(
  exercise: Pick<FundamentalsExercise, 'id' | 'prerequisites'>,
  progress: FundamentalsProgress,
): { unlocked: boolean; missingPrerequisiteIds: number[] } {
  if (isFundamentalsAdvancedId(exercise.id)) {
    return { unlocked: true, missingPrerequisiteIds: [] }
  }
  if (isFundamentalsNovicePartBId(exercise.id)) {
    if (isNoviceTrackComplete(progress)) {
      return { unlocked: false, missingPrerequisiteIds: [] }
    }
    if (!isNovicePartAComplete(progress)) {
      return { unlocked: false, missingPrerequisiteIds: [FUNDAMENTALS_TRACK_NOVICE_ID] }
    }
    return { unlocked: true, missingPrerequisiteIds: [] }
  }
  if (isFundamentalsNovicePartAId(exercise.id)) {
    if (isNovicePartAComplete(progress) && isNoviceTrackComplete(progress)) {
      return { unlocked: false, missingPrerequisiteIds: [] }
    }
    return { unlocked: true, missingPrerequisiteIds: [] }
  }
  if (exercise.id === FUNDAMENTALS_TRACK_MEDIUM_ID) {
    if (isMediumTrackComplete(progress)) {
      return { unlocked: false, missingPrerequisiteIds: [] }
    }
    return { unlocked: true, missingPrerequisiteIds: [] }
  }
  return { unlocked: true, missingPrerequisiteIds: [] }
}

export function applyFundamentalsTrackSessionComplete(
  progress: FundamentalsProgress,
  trackKind: FundamentalsTrackKind,
  phasesCompletedInSession: number,
  questId?: number,
): FundamentalsProgress {
  const completedIds = [...progress.completedIds]
  const prevGlobal = progress.trackPhaseDone?.[trackKind] ?? 0

  if (trackKind === 'novice' && questId === FUNDAMENTALS_TRACK_NOVICE_ID) {
    const startIndex = getFundamentalsTrackPhaseStartIndex(progress, trackKind, questId)
    const nextGlobal = Math.min(
      FUNDAMENTALS_NOVICE_PHASE_COUNT,
      Math.max(prevGlobal, startIndex + Math.max(0, phasesCompletedInSession)),
    )
    const trackPhaseDone = { ...progress.trackPhaseDone, novice: nextGlobal }
    if (nextGlobal >= FUNDAMENTALS_NOVICE_PART_A_COUNT && !completedIds.includes(FUNDAMENTALS_TRACK_NOVICE_ID)) {
      completedIds.push(FUNDAMENTALS_TRACK_NOVICE_ID)
    }
    return { ...progress, trackPhaseDone, completedIds: [...new Set(completedIds)] }
  }

  if (trackKind === 'novice' && questId === FUNDAMENTALS_TRACK_NOVICE_B_ID) {
    const startIndex = getFundamentalsTrackPhaseStartIndex(progress, trackKind, questId)
    const globalStart = FUNDAMENTALS_NOVICE_PART_A_COUNT + startIndex
    const nextGlobal = Math.min(
      FUNDAMENTALS_NOVICE_PHASE_COUNT,
      Math.max(prevGlobal, globalStart + Math.max(0, phasesCompletedInSession)),
    )
    const trackPhaseDone = { ...progress.trackPhaseDone, novice: nextGlobal }
    if (nextGlobal >= FUNDAMENTALS_NOVICE_PHASE_COUNT && !completedIds.includes(FUNDAMENTALS_TRACK_NOVICE_B_ID)) {
      completedIds.push(FUNDAMENTALS_TRACK_NOVICE_B_ID)
    }
    return { ...progress, trackPhaseDone, completedIds: [...new Set(completedIds)] }
  }

  const total = getFundamentalsTrackPhaseCount(trackKind)
  const prev = getFundamentalsTrackPhaseStartIndex(progress, trackKind, questId)
  const nextDone = Math.min(total, prev + Math.max(0, phasesCompletedInSession))
  const trackPhaseDone = { ...progress.trackPhaseDone, [trackKind]: nextDone }
  if (nextDone >= total && !completedIds.includes(FUNDAMENTALS_TRACK_MEDIUM_ID)) {
    completedIds.push(FUNDAMENTALS_TRACK_MEDIUM_ID)
  }
  return { ...progress, trackPhaseDone, completedIds: [...new Set(completedIds)] }
}
