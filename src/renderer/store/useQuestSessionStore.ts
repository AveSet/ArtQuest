import { create } from 'zustand'
import { playSound } from '@/utils/sound'
import {
  buildQuestSessionStart,
  QUEST_REFERENCE_BONUS_MINUTES,
  type SessionPhase,
} from '@/utils/questSessionPlan'
import { QUEST_GRACE_PERIOD_SEC } from '@/utils/questSessionConstants'
import type { Quest } from '@/store/models'
import { useQuestStore } from '@/store/useQuestStore'
import { shouldCountSessionTime } from '@/store/useActivityStore'
import { expandSessionToMainWindow } from '@/utils/sessionOverlayActions'
import { useUIStore } from '@/store/useUIStore'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { reconcileSessionMicroChallenges } from '@/utils/sessionPersistence'
import { areSessionTimersDisabled } from '@/utils/sessionTimersPreference'
import { useSessionRitualStore } from '@/store/useSessionRitualStore'
import { inferPhaseTransitionKey } from '@/utils/phaseTransitionLabels'
import { playSessionSound } from '@/utils/sound'

export { QUEST_REFERENCE_BONUS_MINUTES }
export type { SessionPhase }

export { QUEST_GRACE_PERIOD_SEC } from '@/utils/questSessionConstants'

export type QuestSession = {
  questId: number
  mainMinutes: number
  referenceMinutes: number
  remainingSec: number
  isRunning: boolean
  isExpired: boolean
  /** Seconds counted up after the main timer reaches zero (unlimited until submit). */
  overtimeElapsedSec: number
  /** @deprecated Legacy field — restored sessions only; never set on new sessions. */
  graceRemainingSec: number
  /** @deprecated Always false for new sessions — overtime no longer auto-fails. */
  graceExpired: boolean
  startedAtMs: number
  /** Seconds counted while a tracked art app was active (for XP). */
  activeElapsedSec?: number
  /** Ordered session phases (quick exercises + optional reference at end). */
  phases: SessionPhase[]
  currentPhaseIndex: number
  phaseRemainingSec: number
  currentPhaseEnteredAtMs: number
  phasesComplete: boolean
  /** Reference minutes are consumed at the end of the pool (phased quests). */
  referenceAtEnd: boolean
}

type QuestSessionState = {
  session: QuestSession | null
  referenceToastVisible: boolean
  startSession: (
    quest: Pick<Quest, 'id' | 'estimatedTime' | 'microChallenges'>,
    withReferenceBonus?: boolean,
    options?: { mainMinutesOverride?: number; phasesOverride?: SessionPhase[] },
  ) => void
  hydrateSession: (session: QuestSession | null) => void
  cancelSession: () => void
  tick: () => void
  advancePhase: () => void
  showReferenceToast: () => void
  clearReferenceToast: () => void
}

let tickHandle: ReturnType<typeof setInterval> | null = null
let referenceToastTimer: number | null = null

function usesMainProcessSessionTicks(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.onSessionTick)
}

function ensureTick(get: () => QuestSessionState, _set: (partial: Partial<QuestSessionState> | ((s: QuestSessionState) => Partial<QuestSessionState>)) => void) {
  // Electron: main process SessionTickBridge already calls tick() once per second.
  if (usesMainProcessSessionTicks()) return
  if (tickHandle != null) return
  tickHandle = setInterval(() => get().tick(), 1000)
}

function clearTickIfIdle(session: QuestSession | null) {
  if (session != null) return
  if (tickHandle != null) {
    clearInterval(tickHandle)
    tickHandle = null
  }
}

function emptyPhaseFields(): Pick<
  QuestSession,
  'phases' | 'currentPhaseIndex' | 'phaseRemainingSec' | 'currentPhaseEnteredAtMs' | 'phasesComplete' | 'referenceAtEnd'
> {
  return {
    phases: [],
    currentPhaseIndex: 0,
    phaseRemainingSec: 0,
    currentPhaseEnteredAtMs: 0,
    phasesComplete: false,
    referenceAtEnd: false,
  }
}

function playPhaseTransitionSound(questId: number) {
  const quest = useQuestStore.getState().quests.find((q) => q.id === questId)
  playSound('microComplete', quest?.category)
}

function markExercisePhaseComplete(questId: number, challengeId: string) {
  useQuestStore.getState().completeMicroChallenge(questId, challengeId, { silent: true })
}

function notifyPhaseTransition(session: QuestSession, _prevIndex: number): void {
  const nextPhase = session.phases[session.currentPhaseIndex]
  if (nextPhase?.kind !== 'exercise') return
  const key = inferPhaseTransitionKey(nextPhase.challengeId)
  if (key) useSessionRitualStore.getState().showPhaseTransitionBanner(key)
}

function moveToNextPhase(
  session: QuestSession,
  playSoundOnTransition: boolean,
  _manualAdvance: boolean,
): QuestSession {
  const current = session.phases[session.currentPhaseIndex]
  if (current?.kind === 'exercise') {
    markExercisePhaseComplete(session.questId, current.challengeId)
  }

  if (playSoundOnTransition) {
    playPhaseTransitionSound(session.questId)
  }

  const nextIndex = session.currentPhaseIndex + 1
  if (nextIndex >= session.phases.length) {
    return {
      ...session,
      currentPhaseIndex: nextIndex,
      phaseRemainingSec: 0,
      phasesComplete: true,
      currentPhaseEnteredAtMs: Date.now(),
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

export function formatSessionRemaining(sec: number): string {
  if (areSessionTimersDisabled()) return '∞'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatOvertimeElapsed(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function splitSessionRemaining(session: QuestSession): { referenceSec: number; mainSec: number } {
  const mainCap = session.mainMinutes * 60
  if (session.referenceMinutes <= 0) {
    return { referenceSec: 0, mainSec: session.remainingSec }
  }
  if (session.referenceAtEnd) {
    const referenceSec = Math.max(0, session.remainingSec - mainCap)
    const mainSec = Math.min(session.remainingSec, mainCap)
    return { referenceSec, mainSec }
  }
  const mainSec = Math.min(session.remainingSec, mainCap)
  const referenceSec = Math.max(0, session.remainingSec - mainCap)
  return { referenceSec, mainSec }
}

export function isSessionInReferencePhase(session: QuestSession): boolean {
  if (session.referenceMinutes <= 0) return false
  if (session.referenceAtEnd) {
    return session.remainingSec <= session.referenceMinutes * 60
  }
  return session.remainingSec > session.mainMinutes * 60
}

function isActivityTrackingEnabled(): boolean {
  return useUIStore.getState().settings.activityTrackingEnabled !== false
}

/** Active practice minutes from session timer (only art-app active time when tracked). */
export function getSessionPracticeMinutes(session: QuestSession): number {
  const activeSec = session.activeElapsedSec ?? 0
  if (activeSec > 0) {
    return Math.max(1, Math.round(activeSec / 60))
  }
  const totalSec = (session.mainMinutes + session.referenceMinutes) * 60
  const scheduledElapsed = Math.max(0, totalSec - session.remainingSec)
  const overtimeSec = session.isExpired ? (session.overtimeElapsedSec ?? 0) : 0
  const elapsedSec = scheduledElapsed + overtimeSec
  if (isActivityTrackingEnabled() && elapsedSec <= 0) return 1
  return Math.max(1, Math.round(elapsedSec / 60))
}

export function sessionHasPhases(session: QuestSession): boolean {
  return session.phases.length > 0
}

export function sessionInOvertime(session: QuestSession): boolean {
  return session.isExpired && !session.graceExpired
}

/** @deprecated Use sessionInOvertime */
export function sessionInGracePeriod(session: QuestSession): boolean {
  return sessionInOvertime(session)
}

function normalizeHydratedSession(session: QuestSession): QuestSession {
  let overtimeElapsedSec = session.overtimeElapsedSec ?? 0
  if (session.isExpired && overtimeElapsedSec === 0 && (session.graceRemainingSec ?? 0) > 0) {
    overtimeElapsedSec = Math.max(0, QUEST_GRACE_PERIOD_SEC - session.graceRemainingSec)
  }
  return {
    ...session,
    overtimeElapsedSec,
    graceRemainingSec: 0,
    graceExpired: false,
    currentPhaseEnteredAtMs: session.currentPhaseEnteredAtMs ?? session.startedAtMs ?? Date.now(),
    activeElapsedSec: session.activeElapsedSec ?? 0,
  }
}

export const useQuestSessionStore = create<QuestSessionState>((set, get) => ({
  session: null,
  referenceToastVisible: false,

  startSession: (quest, withReferenceBonus = false, options) => {
    useSkillPracticeStore.getState().clearSession()
    const plan = buildQuestSessionStart(quest, withReferenceBonus, {
      mainMinutesOverride: options?.mainMinutesOverride,
    })
    const phases = options?.phasesOverride?.length ? options.phasesOverride : plan.phases
    const phaseMinutes =
      phases.length > 0
        ? phases.reduce((sum, phase) => sum + phase.durationSec, 0) / 60
        : plan.mainMinutes
    const mainMinutes = Math.max(1, Math.round(options?.phasesOverride?.length ? phaseMinutes : plan.mainMinutes))
    const totalMinutes = mainMinutes + plan.referenceMinutes
    const firstPhase = phases[0]
    const now = Date.now()
    const phaseFields =
      phases.length > 0
        ? {
            phases,
            currentPhaseIndex: 0,
            phaseRemainingSec: firstPhase?.durationSec ?? 0,
            phasesComplete: false,
            referenceAtEnd: plan.referenceAtEnd,
            currentPhaseEnteredAtMs: now,
          }
        : emptyPhaseFields()

    set({
      session: {
        questId: quest.id,
        mainMinutes,
        referenceMinutes: plan.referenceMinutes,
        remainingSec: totalMinutes * 60,
        isRunning: true,
        isExpired: false,
        overtimeElapsedSec: 0,
        graceRemainingSec: 0,
        graceExpired: false,
        startedAtMs: now,
        activeElapsedSec: 0,
        ...phaseFields,
      },
    })
    if (withReferenceBonus) get().showReferenceToast()
    ensureTick(get, set)
  },

  hydrateSession: (session) => {
    if (!session) {
      if (referenceToastTimer != null) {
        clearTimeout(referenceToastTimer)
        referenceToastTimer = null
      }
      set({ session: null, referenceToastVisible: false })
      clearTickIfIdle(null)
      return
    }
    const normalized = normalizeHydratedSession(session)
    reconcileSessionMicroChallenges(normalized)
    set({ session: normalized })
    ensureTick(get, set)
    expandSessionToMainWindow()
  },

  cancelSession: () => {
    if (referenceToastTimer != null) {
      clearTimeout(referenceToastTimer)
      referenceToastTimer = null
    }
    set({ session: null, referenceToastVisible: false })
    clearTickIfIdle(null)
  },

  advancePhase: () => {
    const { session } = get()
    if (!session?.phases.length || session.phasesComplete) return
    const prevIndex = session.currentPhaseIndex
    const next = moveToNextPhase(session, true, true)
    notifyPhaseTransition(next, prevIndex)
    set({ session: next })
    const enteredReference =
      next.phases[next.currentPhaseIndex]?.kind === 'reference' && !next.phasesComplete
    if (enteredReference) get().showReferenceToast()
  },

  tick: () => {
    const { session } = get()
    if (!session?.isRunning) return
    const counting = shouldCountSessionTime()

    if (areSessionTimersDisabled()) {
      const activeElapsedSec = (session.activeElapsedSec ?? 0) + (counting ? 1 : 0)
      if (activeElapsedSec !== session.activeElapsedSec) {
        set({ session: { ...session, activeElapsedSec } })
      }
      return
    }

    if (session.isExpired) {
      const activeElapsedSec = (session.activeElapsedSec ?? 0) + (counting ? 1 : 0)
      set({
        session: {
          ...session,
          overtimeElapsedSec: (session.overtimeElapsedSec ?? 0) + 1,
          activeElapsedSec,
        },
      })
      return
    }

    const activeElapsedSec = (session.activeElapsedSec ?? 0) + (counting ? 1 : 0)
    const remainingSec = session.remainingSec - 1
    if (remainingSec <= 0) {
      set({
        session: {
          ...session,
          remainingSec: 0,
          phaseRemainingSec: 0,
          isExpired: true,
          overtimeElapsedSec: 0,
          activeElapsedSec,
        },
      })
      return
    }

    if (session.phases.length > 0 && !session.phasesComplete) {
      const phaseRemainingSec =
        session.phaseRemainingSec > 0 ? session.phaseRemainingSec - 1 : 0

      if (phaseRemainingSec <= 0 && session.phaseRemainingSec > 0) {
        const prevIndex = session.currentPhaseIndex
        const next = moveToNextPhase({ ...session, remainingSec, phaseRemainingSec: 0 }, true, false)
        notifyPhaseTransition(next, prevIndex)
        const enteredReference =
          next.phases[next.currentPhaseIndex]?.kind === 'reference' && !next.phasesComplete
        if (enteredReference) get().showReferenceToast()
        set({ session: { ...next, remainingSec, activeElapsedSec } })
        return
      }

      set({ session: { ...session, remainingSec, phaseRemainingSec, activeElapsedSec } })
      if (session.phaseRemainingSec === 60) {
        playSessionSound('focusLow')
      }
      return
    }

    set({ session: { ...session, remainingSec, activeElapsedSec } })
  },

  showReferenceToast: () => {
    if (referenceToastTimer != null) {
      clearTimeout(referenceToastTimer)
      referenceToastTimer = null
    }
    set({ referenceToastVisible: true })
    referenceToastTimer = window.setTimeout(() => {
      referenceToastTimer = null
      get().clearReferenceToast()
    }, 4000)
  },

  clearReferenceToast: () => set({ referenceToastVisible: false }),
}))
