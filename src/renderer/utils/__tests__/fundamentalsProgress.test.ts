import { describe, it, expect } from 'vitest'
import {
  FUNDAMENTALS_ADVANCED_ID_MIN,
  FUNDAMENTALS_TRACK_NOVICE_ID,
} from '@/data/fundamentalsExercises'
import {
  applyFundamentalsTrackSessionComplete,
  getNextFundamentalsExercise,
  isFundamentalsGateCleared,
  isNoviceTrackComplete,
  normalizeFundamentalsProgress,
  resolveFundamentalsTrackSessionStart,
  shouldGateDailiesForBeginner,
  shouldUseFundamentalsPath,
} from '../fundamentalsProgress'

describe('fundamentalsProgress', () => {
  it('migrates legacy sequential ids into track completion', () => {
    const legacyIds = Array.from({ length: 8 }, (_, i) => 96001 + i)
    const normalized = normalizeFundamentalsProgress({
      completedIds: legacyIds,
      lastCompletedDate: '',
    })
    expect(isNoviceTrackComplete(normalized)).toBe(true)
    expect(normalized.completedIds).toContain(FUNDAMENTALS_TRACK_NOVICE_ID)
  })

  it('clears daily gate after first fundamentals progress', () => {
    const progress = normalizeFundamentalsProgress({
      completedIds: [],
      trackPhaseDone: { novice: 1 },
      lastCompletedDate: '2026-06-01',
    })
    expect(isFundamentalsGateCleared(progress)).toBe(true)
    expect(shouldGateDailiesForBeginner('beginner', progress)).toBe(false)
  })

  it('keeps dailies gated until first fundamentals exercise', () => {
    const progress = normalizeFundamentalsProgress({
      completedIds: [],
      trackPhaseDone: {},
      lastCompletedDate: '',
    })
    expect(isFundamentalsGateCleared(progress)).toBe(false)
    expect(shouldGateDailiesForBeginner('beginner', progress)).toBe(true)
  })

  it('returns novice track first when nothing is done', () => {
    const progress = { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' }
    expect(getNextFundamentalsExercise(progress)?.id).toBe(FUNDAMENTALS_TRACK_NOVICE_ID)
  })

  it('uses fundamentals path for beginner until gate cleared', () => {
    expect(shouldUseFundamentalsPath('beginner', { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' })).toBe(true)
    const cleared = normalizeFundamentalsProgress({
      completedIds: [
        FUNDAMENTALS_TRACK_NOVICE_ID,
        FUNDAMENTALS_ADVANCED_ID_MIN,
        FUNDAMENTALS_ADVANCED_ID_MIN + 1,
        FUNDAMENTALS_ADVANCED_ID_MIN + 2,
      ],
      trackPhaseDone: { novice: 8 },
      lastCompletedDate: '',
    })
    expect(shouldUseFundamentalsPath('beginner', cleared)).toBe(false)
  })

  it('accumulates track phase progress across sessions', () => {
    const base = { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' }
    const afterTwo = applyFundamentalsTrackSessionComplete(base, 'novice', 2)
    expect(afterTwo.trackPhaseDone.novice).toBe(2)
    const afterAll = applyFundamentalsTrackSessionComplete(afterTwo, 'novice', 6)
    expect(afterAll.completedIds).toContain(FUNDAMENTALS_TRACK_NOVICE_ID)
    expect(isNoviceTrackComplete(afterAll)).toBe(true)
  })

  it('builds phased session start for fundamentals tracks', () => {
    const fresh = resolveFundamentalsTrackSessionStart(FUNDAMENTALS_TRACK_NOVICE_ID, {
      completedIds: [],
      trackPhaseDone: {},
      lastCompletedDate: '',
    })
    expect(fresh?.phasesOverride).toHaveLength(8)
    expect(fresh?.mainMinutesOverride).toBeGreaterThan(0)

    const resumed = resolveFundamentalsTrackSessionStart(FUNDAMENTALS_TRACK_NOVICE_ID, {
      completedIds: [],
      trackPhaseDone: { novice: 3 },
      lastCompletedDate: '',
    })
    expect(resumed?.phasesOverride).toHaveLength(5)
    expect(resumed?.phasesOverride[0]).toMatchObject({ kind: 'fundamentals', phaseIndex: 3 })
  })
})
