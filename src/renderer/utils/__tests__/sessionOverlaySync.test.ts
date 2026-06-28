import { beforeEach, describe, expect, it } from 'vitest'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useActivityStore } from '@/store/useActivityStore'
import {
  resetSessionOverlaySyncForTests,
  sessionOverlaySyncFingerprint,
} from '@/utils/sessionOverlaySync'

function mockQuestSession(overrides: Partial<ReturnType<typeof baseSession>> = {}) {
  return { ...baseSession(), ...overrides }
}

function baseSession() {
  const now = Date.now()
  return {
    questId: 1,
    mainMinutes: 20,
    referenceMinutes: 5,
    remainingSec: 1200,
    isRunning: true,
    isExpired: false,
    overtimeElapsedSec: 0,
    graceRemainingSec: 0,
    graceExpired: false,
    startedAtMs: now,
    activeElapsedSec: 0,
    phases: [] as import('@/store/useQuestSessionStore').SessionPhase[],
    currentPhaseIndex: 0,
    phaseRemainingSec: 300,
    currentPhaseEnteredAtMs: now,
    phasesComplete: false,
    referenceAtEnd: true,
  }
}

describe('sessionOverlaySyncFingerprint', () => {
  beforeEach(() => {
    resetSessionOverlaySyncForTests()
    useQuestSessionStore.setState({ session: null })
    useThemeStore.setState({ theme: 'light' })
    useActivityStore.setState({ shouldCountTime: true })
  })

  it('returns idle fingerprint when no session is active', () => {
    expect(sessionOverlaySyncFingerprint()).toBe('idle:light')
  })

  it('changes when quest session phase advances', () => {
    useQuestSessionStore.setState({ session: mockQuestSession() })
    const first = sessionOverlaySyncFingerprint()
    useQuestSessionStore.setState({ session: mockQuestSession({ currentPhaseIndex: 1 }) })
    expect(sessionOverlaySyncFingerprint()).not.toBe(first)
  })

  it('stays stable on timer-only ticks within the same phase', () => {
    useQuestSessionStore.setState({ session: mockQuestSession({ activeElapsedSec: 10 }) })
    const a = sessionOverlaySyncFingerprint()
    useQuestSessionStore.setState({ session: mockQuestSession({ activeElapsedSec: 59 }) })
    expect(sessionOverlaySyncFingerprint()).toBe(a)
  })
})
