import type { QuestSession } from '@/store/useQuestSessionStore'
import type { SkillPracticeSession } from '@/store/useSkillPracticeStore'
import type { QuestCategory } from '@/data/skillTree'
import { useUIStore } from '@/store/useUIStore'
import { useQuestStore } from '@/store/useQuestStore'

export type PersistedQuestSession = QuestSession & { savedAtMs: number }

export type PersistedSkillPracticeSession = {
  nodeId: string
  category: QuestCategory
  startedAtMs: number
  activeElapsedSec?: number
}

function isActivityTrackingEnabled(): boolean {
  return useUIStore.getState().settings.activityTrackingEnabled !== false
}

function normalizeQuestSession(
  session: Partial<QuestSession> &
    Pick<
      QuestSession,
      'questId' | 'mainMinutes' | 'referenceMinutes' | 'remainingSec' | 'isRunning' | 'isExpired' | 'startedAtMs'
    >,
): QuestSession {
  let overtimeElapsedSec = session.overtimeElapsedSec ?? 0
  const legacyGrace = session.graceRemainingSec ?? 0
  if (session.isExpired && overtimeElapsedSec === 0 && legacyGrace > 0) {
    overtimeElapsedSec = Math.max(0, 180 - legacyGrace)
  }
  return {
    ...session,
    phases: session.phases ?? [],
    currentPhaseIndex: session.currentPhaseIndex ?? 0,
    phaseRemainingSec: session.phaseRemainingSec ?? 0,
    currentPhaseEnteredAtMs: session.currentPhaseEnteredAtMs ?? session.startedAtMs ?? Date.now(),
    phasesComplete: session.phasesComplete ?? false,
    referenceAtEnd: session.referenceAtEnd ?? false,
    overtimeElapsedSec,
    graceRemainingSec: 0,
    graceExpired: false,
    activeElapsedSec: session.activeElapsedSec ?? 0,
  }
}

/** Pure session advance — no quest store side effects (used during offline restore). */
function advancePhasePure(session: QuestSession): QuestSession {
  const nextIndex = session.currentPhaseIndex + 1
  if (nextIndex >= session.phases.length) {
    return {
      ...session,
      currentPhaseIndex: nextIndex,
      phaseRemainingSec: 0,
      phasesComplete: true,
    }
  }
  const nextPhase = session.phases[nextIndex]!
  const carryOverSec = Math.max(0, session.phaseRemainingSec)
  return {
    ...session,
    currentPhaseIndex: nextIndex,
    phaseRemainingSec: nextPhase.durationSec + carryOverSec,
    phasesComplete: false,
    currentPhaseEnteredAtMs: Date.now(),
  }
}

function applyOfflinePhases(session: QuestSession, offlineSec: number): QuestSession {
  let s = session
  let credit = offlineSec
  while (credit > 0 && s.phases.length > 0 && !s.phasesComplete) {
    if (credit < s.phaseRemainingSec) {
      return { ...s, phaseRemainingSec: s.phaseRemainingSec - credit }
    }
    credit -= s.phaseRemainingSec
    s = advancePhasePure({ ...s, phaseRemainingSec: 0 })
  }
  return s
}

export function serializeQuestSession(session: QuestSession | null): PersistedQuestSession | null {
  if (!session) return null
  return { ...session, savedAtMs: Date.now() }
}

/** Restore quest timer; subtract offline elapsed time when session was running. */
type PersistedQuestSessionInput = Omit<
  PersistedQuestSession,
  | 'phases'
  | 'currentPhaseIndex'
  | 'phaseRemainingSec'
  | 'phasesComplete'
  | 'referenceAtEnd'
  | 'currentPhaseEnteredAtMs'
  | 'overtimeElapsedSec'
  | 'graceRemainingSec'
  | 'graceExpired'
  | 'activeElapsedSec'
> &
  Partial<
    Pick<
      QuestSession,
      | 'phases'
      | 'currentPhaseIndex'
      | 'phaseRemainingSec'
      | 'phasesComplete'
      | 'referenceAtEnd'
      | 'currentPhaseEnteredAtMs'
      | 'overtimeElapsedSec'
      | 'graceRemainingSec'
      | 'graceExpired'
      | 'activeElapsedSec'
    >
  >

export function restoreQuestSession(
  persisted: PersistedQuestSessionInput | null | undefined,
): QuestSession | null {
  if (!persisted) return null
  const { savedAtMs, ...raw } = persisted
  let session = normalizeQuestSession(raw)
  let remainingSec = session.remainingSec
  let isExpired = session.isExpired
  const isRunning = session.isRunning
  let overtimeElapsedSec = session.overtimeElapsedSec ?? 0
  const tracking = isActivityTrackingEnabled()

  if (isRunning) {
    const offlineSec = Math.floor((Date.now() - savedAtMs) / 1000)

    if (!isExpired && offlineSec > 0) {
      const before = remainingSec
      remainingSec = Math.max(0, before - offlineSec)
      if (!tracking && session.phases.length > 0 && !session.phasesComplete) {
        session = applyOfflinePhases(session, offlineSec)
      }
      if (remainingSec <= 0) {
        remainingSec = 0
        isExpired = true
        const overflow = Math.max(0, offlineSec - before)
        overtimeElapsedSec += overflow
      }
    } else if (isExpired && offlineSec > 0) {
      overtimeElapsedSec += offlineSec
    }
  }

  return {
    ...session,
    remainingSec,
    isExpired,
    isRunning,
    overtimeElapsedSec,
    graceRemainingSec: 0,
    graceExpired: false,
  }
}

/** Mark exercise phases completed during offline restore (call after hydrate, before tick). */
export function reconcileSessionMicroChallenges(session: QuestSession): void {
  if (session.phases.length === 0) return
  const endIndex = session.phasesComplete
    ? session.phases.length
    : Math.min(session.currentPhaseIndex, session.phases.length)
  for (let i = 0; i < endIndex; i++) {
    const phase = session.phases[i]
    if (phase?.kind === 'exercise') {
      useQuestStore.getState().completeMicroChallenge(session.questId, phase.challengeId, {
        silent: true,
        skipXp: true,
      })
    }
  }
}

export function serializeSkillPracticeSession(
  session: PersistedSkillPracticeSession | null,
): PersistedSkillPracticeSession | null {
  return session ? { ...session } : null
}

export function restoreSkillPracticeSession(
  persisted: PersistedSkillPracticeSession | null | undefined,
): SkillPracticeSession | null {
  if (!persisted?.nodeId) return null
  return {
    ...persisted,
    activeElapsedSec: persisted.activeElapsedSec ?? 0,
  }
}
