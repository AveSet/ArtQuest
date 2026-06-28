import type { QuestSession } from '@/store/useQuestSessionStore'
import { sessionInOvertime } from '@/store/useQuestSessionStore'
import { phaseLabelKeyForChallenge } from '@/utils/microChallengeXp'
import { getPhaseTimerSec } from '@/utils/sessionPhaseDisplay'
import { areSessionTimersDisabled } from '@/utils/sessionTimersPreference'

export type TaskbarProgressMode = 'normal' | 'paused' | 'error' | 'none'

export type TaskbarProgressState = {
  progress: number
  mode: TaskbarProgressMode
}

/** OS taskbar / dock progress for an active quest session (-1 hides). */
export function computeQuestSessionTaskbarProgress(session: QuestSession): TaskbarProgressState {
  if (areSessionTimersDisabled()) {
    return { progress: -1, mode: 'none' }
  }
  if (!session.isRunning && !session.isExpired) {
    return { progress: -1, mode: 'none' }
  }

  if (session.isExpired || sessionInOvertime(session)) {
    return { progress: 2, mode: 'error' }
  }

  const mode = resolvePhaseProgressMode(session)
  const progress = resolveSessionProgressFraction(session)
  return { progress, mode }
}

function resolvePhaseProgressMode(session: QuestSession): TaskbarProgressMode {
  if (!session.phases.length || session.phasesComplete) return 'normal'
  const phase = session.phases[session.currentPhaseIndex]
  if (!phase) return 'normal'
  if (phase.kind === 'reference') return 'paused'
  if (phase.kind === 'exercise') {
    const key = phaseLabelKeyForChallenge(phase.challengeId)
    if (key === 'polish') return 'paused'
    if (key === 'warmup' || key === 'core') return 'normal'
  }
  return 'normal'
}

function resolveSessionProgressFraction(session: QuestSession): number {
  if (session.phases.length > 0 && !session.phasesComplete) {
    let totalSec = 0
    let elapsedSec = 0
    for (let i = 0; i < session.phases.length; i++) {
      const phase = session.phases[i]!
      const dur = Math.max(1, phase.durationSec)
      totalSec += dur
      if (i < session.currentPhaseIndex) {
        elapsedSec += dur
      } else if (i === session.currentPhaseIndex) {
        elapsedSec += Math.max(0, dur - session.phaseRemainingSec)
      }
    }
    return Math.min(1, Math.max(0, elapsedSec / Math.max(1, totalSec)))
  }

  const totalSec = Math.max(1, session.mainMinutes * 60)
  const remaining = Math.max(0, getPhaseTimerSec(session))
  return Math.min(1, Math.max(0, (totalSec - remaining) / totalSec))
}

/** Practice sessions show indeterminate-style progress (pulse at 0.5). */
export function computePracticeTaskbarProgress(activeElapsedSec: number): TaskbarProgressState {
  const minutes = Math.max(0, activeElapsedSec) / 60
  const progress = Math.min(0.95, minutes / 60)
  return { progress: Math.max(0.05, progress), mode: 'normal' }
}

export function taskbarProgressHidden(): TaskbarProgressState {
  return { progress: -1, mode: 'none' }
}
