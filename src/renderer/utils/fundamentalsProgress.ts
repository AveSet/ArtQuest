import {
  buildFundamentalsTrackSessionPhases,
  FUNDAMENTALS_ADVANCED_GATE_COUNT,
  FUNDAMENTALS_ADVANCED_ID_MAX,
  FUNDAMENTALS_ADVANCED_ID_MIN,
  FUNDAMENTALS_EXERCISES,
  FUNDAMENTALS_TRACK_MEDIUM_ID,
  FUNDAMENTALS_TRACK_NOVICE_ID,
  getFundamentalsQuestById,
  getFundamentalsTrackKind,
  getFundamentalsTrackPhaseCount,
  isFundamentalsAdvancedId,
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
      nextPhases.novice = getFundamentalsTrackPhaseCount('novice')
      nextIds.add(FUNDAMENTALS_TRACK_NOVICE_ID)
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
        trackPhaseDone[kind] = Math.min(v, getFundamentalsTrackPhaseCount(kind))
      }
    }
  }

  const migrated = migrateLegacyFundamentalsProgress(completedIds, trackPhaseDone)
  return {
    completedIds: [...new Set(migrated.completedIds)],
    trackPhaseDone: migrated.trackPhaseDone,
    lastCompletedDate: typeof raw.lastCompletedDate === 'string' ? raw.lastCompletedDate : '',
  }
}

export function isNoviceTrackComplete(progress: FundamentalsProgress): boolean {
  return (
    progress.completedIds.includes(FUNDAMENTALS_TRACK_NOVICE_ID) ||
    (progress.trackPhaseDone?.novice ?? 0) >= getFundamentalsTrackPhaseCount('novice')
  )
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
  if (isNoviceTrackComplete(progress)) count += 1
  if (isMediumTrackComplete(progress)) count += 1
  return count
}

/** True after the user completes at least one fundamentals exercise (any track phase or advanced quest). */
export function hasCompletedFundamentalsExercise(progress: FundamentalsProgress): boolean {
  if (getAdvancedCompletedCount(progress) > 0) return true
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

function pickActiveTrack(progress: FundamentalsProgress): FundamentalsTrackKind {
  const noviceStarted = (progress.trackPhaseDone?.novice ?? 0) > 0
  const mediumStarted = (progress.trackPhaseDone?.medium ?? 0) > 0
  if (mediumStarted && !noviceStarted && !isMediumTrackComplete(progress)) return 'medium'
  if (!isNoviceTrackComplete(progress)) return 'novice'
  if (!isMediumTrackComplete(progress)) return 'medium'
  return 'novice'
}

export function getNextFundamentalsExercise(
  progress: FundamentalsProgress,
): FundamentalsExercise | undefined {
  if (!isFundamentalsTrackComplete(progress)) {
    const kind = pickActiveTrack(progress)
    const trackId = kind === 'novice' ? FUNDAMENTALS_TRACK_NOVICE_ID : FUNDAMENTALS_TRACK_MEDIUM_ID
    return FUNDAMENTALS_EXERCISES.find((ex) => ex.id === trackId)
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
): number {
  if (progress.completedIds.includes(
    trackKind === 'novice' ? FUNDAMENTALS_TRACK_NOVICE_ID : FUNDAMENTALS_TRACK_MEDIUM_ID,
  )) {
    return getFundamentalsTrackPhaseCount(trackKind)
  }
  return progress.trackPhaseDone?.[trackKind] ?? 0
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

  let startIndex = getFundamentalsTrackPhaseStartIndex(progress, kind)
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
    if (kind === 'novice' && isNoviceTrackComplete(progress)) return true
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
  if (isFundamentalsTrackId(exercise.id)) {
    const kind = getFundamentalsTrackKind(exercise.id)
    if (kind === 'medium' && isMediumTrackComplete(progress)) {
      return { unlocked: false, missingPrerequisiteIds: [] }
    }
    if (kind === 'novice' && isNoviceTrackComplete(progress)) {
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
): FundamentalsProgress {
  const total = getFundamentalsTrackPhaseCount(trackKind)
  const prev = getFundamentalsTrackPhaseStartIndex(progress, trackKind)
  const nextDone = Math.min(total, prev + Math.max(0, phasesCompletedInSession))
  const trackPhaseDone = { ...progress.trackPhaseDone, [trackKind]: nextDone }
  const completedIds = [...progress.completedIds]
  const trackId = trackKind === 'novice' ? FUNDAMENTALS_TRACK_NOVICE_ID : FUNDAMENTALS_TRACK_MEDIUM_ID
  if (nextDone >= total && !completedIds.includes(trackId)) {
    completedIds.push(trackId)
  }
  return { ...progress, trackPhaseDone, completedIds: [...new Set(completedIds)] }
}
