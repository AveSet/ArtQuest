import { describe, it, expect, beforeEach } from 'vitest'
import { restoreQuestSession, serializeQuestSession } from '@/utils/sessionPersistence'
import { useUIStore } from '@/store/useUIStore'

const emptyPhases = {
  phases: [],
  currentPhaseIndex: 0,
  phaseRemainingSec: 0,
  currentPhaseEnteredAtMs: 0,
  phasesComplete: false,
  referenceAtEnd: false,
  overtimeElapsedSec: 0,
  graceRemainingSec: 0,
  graceExpired: false,
  activeElapsedSec: 0,
}

describe('sessionPersistence', () => {
  beforeEach(() => {
    useUIStore.setState({
      settings: { ...useUIStore.getState().settings, activityTrackingEnabled: false },
    } as Partial<ReturnType<typeof useUIStore.getState>>)
  })

  it('subtracts offline elapsed time from quest session remaining when tracking off', () => {
    const savedAt = Date.now() - 120_000
    const restored = restoreQuestSession({
      questId: 1,
      mainMinutes: 30,
      referenceMinutes: 0,
      remainingSec: 600,
      isRunning: true,
      isExpired: false,
      startedAtMs: savedAt - 60_000,
      savedAtMs: savedAt,
      ...emptyPhases,
    })
    expect(restored?.remainingSec).toBe(480)
    expect(restored?.isExpired).toBe(false)
  })

  it('does not subtract offline time when activity tracking is enabled', () => {
    useUIStore.setState({
      settings: { ...useUIStore.getState().settings, activityTrackingEnabled: true },
    } as Partial<ReturnType<typeof useUIStore.getState>>)
    const savedAt = Date.now() - 120_000
    const restored = restoreQuestSession({
      questId: 1,
      mainMinutes: 30,
      referenceMinutes: 0,
      remainingSec: 600,
      isRunning: true,
      isExpired: false,
      startedAtMs: savedAt - 60_000,
      savedAtMs: savedAt,
      ...emptyPhases,
    })
    expect(restored?.remainingSec).toBe(600)
  })

  it('enters overtime when offline time exceeds remaining (tracking off)', () => {
    const savedAt = Date.now() - 3600_000
    const restored = restoreQuestSession({
      questId: 1,
      mainMinutes: 10,
      referenceMinutes: 0,
      remainingSec: 60,
      isRunning: true,
      isExpired: false,
      startedAtMs: savedAt,
      savedAtMs: savedAt,
      ...emptyPhases,
    })
    expect(restored?.remainingSec).toBe(0)
    expect(restored?.isExpired).toBe(true)
    expect(restored?.graceExpired).toBe(false)
    expect(restored?.overtimeElapsedSec).toBeGreaterThan(0)
  })

  it('serializeQuestSession adds savedAtMs', () => {
    const serialized = serializeQuestSession({
      questId: 5,
      mainMinutes: 20,
      referenceMinutes: 15,
      remainingSec: 1200,
      isRunning: true,
      isExpired: false,
      startedAtMs: 1000,
      ...emptyPhases,
    })
    expect(serialized?.savedAtMs).toBeTypeOf('number')
  })
})
