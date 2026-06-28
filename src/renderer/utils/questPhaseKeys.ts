import type { Language } from '@/i18n/translations'
import type { Quest } from '@/store/models'
import type { SessionPhase } from '@/utils/questSessionPlan'
import {
  getFundamentalsQuestById,
  getFundamentalsTrackPhase,
  type FundamentalsExercise,
} from '@/data/fundamentalsExercises'
import { orderMicroChallenges } from '@/utils/questSessionPlan'
import { phaseLabelKeyForChallenge } from '@/utils/microChallengeXp'

export type QuestPhasePlanRow = {
  key: string
  label: string
  minutes: number
  phaseKind?: 'fundamentals' | 'exercise' | 'reference' | 'main'
}

function sanitizeChallengeKey(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9]/g, '')
  return cleaned.slice(0, 24) || 'step'
}

/** Stable storage key for per-phase help media (quest + phase). */
export function getPhaseMediaKey(sessionPhase: SessionPhase | null | undefined): string {
  if (!sessionPhase) return 'main'
  if (sessionPhase.kind === 'fundamentals') return `f${sessionPhase.phaseIndex}`
  if (sessionPhase.kind === 'exercise') return `e${sanitizeChallengeKey(sessionPhase.challengeId)}`
  if (sessionPhase.kind === 'reference') return 'ref'
  return 'main'
}

export function getPhaseMediaKeyFromPlanRow(row: QuestPhasePlanRow): string {
  if (row.phaseKind === 'fundamentals') {
    const match = /^f(\d+)$/.exec(row.key)
    if (match) return `f${match[1]}`
  }
  if (row.phaseKind === 'exercise') return row.key.startsWith('e') ? row.key : `e${sanitizeChallengeKey(row.key)}`
  if (row.phaseKind === 'reference') return 'ref'
  return row.key === 'main' ? 'main' : row.key
}

function phaseLabelFromChallengeKey(
  key: ReturnType<typeof phaseLabelKeyForChallenge>,
  quests: Record<string, string | undefined>,
): string {
  if (key === 'warmup') return quests.phaseLabelWarmup ?? 'Warmup'
  if (key === 'core') return quests.phaseLabelCore ?? 'Core'
  if (key === 'polish') return quests.phaseLabelPolish ?? 'Polish'
  return quests.phaseLabelStep ?? 'Step'
}

export function buildQuestPhasePlanRows(
  quest: Quest,
  lang: Language,
  options?: {
    fundamentalsExercise?: FundamentalsExercise
    fundamentalsSteps?: string[]
    questLabels?: Record<string, string | undefined>
  },
): QuestPhasePlanRow[] {
  const exercise =
    options?.fundamentalsExercise ?? getFundamentalsQuestById(quest.id)
  const labels = options?.questLabels ?? {}

  if (exercise?.trackPhases?.length) {
    return exercise.trackPhases.map((phase) => ({
      key: `f${phase.phaseIndex}`,
      label: phase.title[lang] ?? phase.title.en,
      minutes: phase.estimatedTime,
      phaseKind: 'fundamentals' as const,
    }))
  }

  if (quest.microChallenges?.length) {
    return orderMicroChallenges(quest.microChallenges).map((mc) => ({
      key: `e${sanitizeChallengeKey(mc.id)}`,
      label: mc.instruction[lang] || mc.instruction.en,
      minutes: mc.estimatedTime,
      phaseKind: 'exercise' as const,
    }))
  }

  const stepsFromExercise =
    options?.fundamentalsSteps ??
    (exercise?.steps?.map((step) => step[lang] ?? step.en) ?? [])
  if (stepsFromExercise.length > 0 && !exercise?.trackPhases?.length) {
    const perStep = Math.max(1, Math.round(quest.estimatedTime / stepsFromExercise.length))
    return stepsFromExercise.map((label, index) => ({
      key: `s${index}`,
      label,
      minutes: perStep,
      phaseKind: 'main' as const,
    }))
  }

  return [
    {
      key: 'main',
      label: labels.sessionMainPhaseLabel ?? labels.startQuestNow ?? 'Practice',
      minutes: quest.estimatedTime,
      phaseKind: 'main' as const,
    },
  ]
}

export function sumPhasePlanMinutes(rows: QuestPhasePlanRow[]): number {
  return rows.reduce((sum, row) => sum + row.minutes, 0)
}

export function getSessionPhaseLabel(
  sessionPhase: SessionPhase,
  quest: Quest | undefined,
  lang: Language,
  referencePhaseLabel: string,
): string {
  if (sessionPhase.kind === 'reference') return referencePhaseLabel
  if (sessionPhase.kind === 'fundamentals') {
    const exercise = quest ? getFundamentalsQuestById(quest.id) : undefined
    const phase = exercise ? getFundamentalsTrackPhase(exercise, sessionPhase.phaseIndex) : undefined
    return phase?.title[lang] ?? phase?.title.en ?? ''
  }
  if (sessionPhase.kind === 'exercise') {
    const mc = quest?.microChallenges?.find((m) => m.id === sessionPhase.challengeId)
    if (mc) return mc.instruction[lang] || mc.instruction.en || ''
    const key = phaseLabelKeyForChallenge(sessionPhase.challengeId)
    return phaseLabelFromChallengeKey(key, {})
  }
  return ''
}

/** Electron saveQuestReference folder id (alphanumeric + hyphen, max 50). */
export function getPhaseMediaStorageId(
  questId: number,
  phaseKey: string,
  entryId?: string,
): string {
  const raw = (entryId ? `${questId}-${phaseKey}-${entryId}` : `${questId}-${phaseKey}`)
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .slice(0, 50)
  return raw
}
