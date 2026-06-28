import type { QuestSession } from '@/store/useQuestSessionStore'
import {
  computePracticeTaskbarProgress,
  computeQuestSessionTaskbarProgress,
  taskbarProgressHidden,
} from '@/utils/sessionTaskbarProgress'

function baseSession(partial: Partial<QuestSession> = {}): QuestSession {
  return {
    questId: 1,
    mainMinutes: 20,
    referenceMinutes: 0,
    remainingSec: 600,
    isRunning: true,
    isExpired: false,
    overtimeElapsedSec: 0,
    graceRemainingSec: 0,
    graceExpired: false,
    startedAtMs: Date.now(),
    phases: [],
    currentPhaseIndex: 0,
    phaseRemainingSec: 0,
    currentPhaseEnteredAtMs: Date.now(),
    phasesComplete: true,
    referenceAtEnd: false,
    ...partial,
  }
}

describe('sessionTaskbarProgress', () => {
  it('returns hidden when session is not running', () => {
    expect(taskbarProgressHidden()).toEqual({ progress: -1, mode: 'none' })
    expect(
      computeQuestSessionTaskbarProgress(baseSession({ isRunning: false, isExpired: false })),
    ).toEqual({ progress: -1, mode: 'none' })
  })

  it('computes main timer progress fraction', () => {
    const state = computeQuestSessionTaskbarProgress(
      baseSession({ mainMinutes: 10, remainingSec: 300, phasesComplete: true }),
    )
    expect(state.mode).toBe('normal')
    expect(state.progress).toBeCloseTo(0.5, 2)
  })

  it('uses error mode in overtime', () => {
    const state = computeQuestSessionTaskbarProgress(
      baseSession({ isExpired: true, overtimeElapsedSec: 30 }),
    )
    expect(state.mode).toBe('error')
    expect(state.progress).toBe(2)
  })

  it('uses paused mode for polish phase', () => {
    const state = computeQuestSessionTaskbarProgress(
      baseSession({
        phasesComplete: false,
        phases: [{ kind: 'exercise', challengeId: 'polish-pass', durationSec: 300, xp: 5 }],
        currentPhaseIndex: 0,
        phaseRemainingSec: 150,
      }),
    )
    expect(state.mode).toBe('paused')
  })

  it('tracks practice elapsed progress', () => {
    const state = computePracticeTaskbarProgress(1800)
    expect(state.mode).toBe('normal')
    expect(state.progress).toBeGreaterThan(0.2)
  })
})
