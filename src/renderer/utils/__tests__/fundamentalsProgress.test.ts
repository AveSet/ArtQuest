import { describe, it, expect } from 'vitest'
import {
  FUNDAMENTALS_ADVANCED_ID_MIN,
  FUNDAMENTALS_TRACK_NOVICE_B_ID,
  FUNDAMENTALS_TRACK_NOVICE_ID,
} from '@/data/fundamentalsExercises'
import {
  applyFundamentalsTrackSessionComplete,
  getNextFundamentalsExercise,
  isFundamentalsGateCleared,
  isNovicePartAComplete,
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
    expect(normalized.completedIds).toContain(FUNDAMENTALS_TRACK_NOVICE_B_ID)
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

  it('clears daily gate when any fundamentals quest is completed', () => {
    const progress = normalizeFundamentalsProgress({
      completedIds: [FUNDAMENTALS_ADVANCED_ID_MIN],
      trackPhaseDone: {},
      lastCompletedDate: '2026-06-01',
    })
    expect(isFundamentalsGateCleared(progress)).toBe(true)
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

  it('returns novice part A first when nothing is done', () => {
    const progress = { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' }
    expect(getNextFundamentalsExercise(progress)?.id).toBe(FUNDAMENTALS_TRACK_NOVICE_ID)
  })

  it('returns novice part B after part A is complete', () => {
    const progress = normalizeFundamentalsProgress({
      completedIds: [FUNDAMENTALS_TRACK_NOVICE_ID],
      trackPhaseDone: { novice: 6 },
      lastCompletedDate: '',
    })
    expect(getNextFundamentalsExercise(progress)?.id).toBe(FUNDAMENTALS_TRACK_NOVICE_B_ID)
  })

  it('uses fundamentals path for beginner until gate cleared', () => {
    expect(shouldUseFundamentalsPath('beginner', { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' })).toBe(true)
    const cleared = normalizeFundamentalsProgress({
      completedIds: [
        FUNDAMENTALS_TRACK_NOVICE_ID,
        FUNDAMENTALS_TRACK_NOVICE_B_ID,
        FUNDAMENTALS_ADVANCED_ID_MIN,
        FUNDAMENTALS_ADVANCED_ID_MIN + 1,
        FUNDAMENTALS_ADVANCED_ID_MIN + 2,
      ],
      trackPhaseDone: { novice: 8 },
      lastCompletedDate: '',
    })
    expect(shouldUseFundamentalsPath('beginner', cleared)).toBe(false)
  })

  it('accumulates track phase progress across sessions for part A', () => {
    const base = { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' }
    const afterTwo = applyFundamentalsTrackSessionComplete(base, 'novice', 2, FUNDAMENTALS_TRACK_NOVICE_ID)
    expect(afterTwo.trackPhaseDone.novice).toBe(2)
    const afterAll = applyFundamentalsTrackSessionComplete(afterTwo, 'novice', 4, FUNDAMENTALS_TRACK_NOVICE_ID)
    expect(afterAll.completedIds).toContain(FUNDAMENTALS_TRACK_NOVICE_ID)
    expect(isNovicePartAComplete(afterAll)).toBe(true)
    expect(isNoviceTrackComplete(afterAll)).toBe(false)
  })

  it('completes novice track after part B sessions', () => {
    const partADone = normalizeFundamentalsProgress({
      completedIds: [FUNDAMENTALS_TRACK_NOVICE_ID],
      trackPhaseDone: { novice: 6 },
      lastCompletedDate: '',
    })
    const afterPartB = applyFundamentalsTrackSessionComplete(partADone, 'novice', 2, FUNDAMENTALS_TRACK_NOVICE_B_ID)
    expect(afterPartB.completedIds).toContain(FUNDAMENTALS_TRACK_NOVICE_B_ID)
    expect(isNoviceTrackComplete(afterPartB)).toBe(true)
  })

  it('builds phased session start for fundamentals tracks', () => {
    const fresh = resolveFundamentalsTrackSessionStart(FUNDAMENTALS_TRACK_NOVICE_ID, {
      completedIds: [],
      trackPhaseDone: {},
      lastCompletedDate: '',
    })
    expect(fresh?.phasesOverride).toHaveLength(6)
    expect(fresh?.mainMinutesOverride).toBeGreaterThan(0)

    const resumed = resolveFundamentalsTrackSessionStart(FUNDAMENTALS_TRACK_NOVICE_ID, {
      completedIds: [],
      trackPhaseDone: { novice: 3 },
      lastCompletedDate: '',
    })
    expect(resumed?.phasesOverride).toHaveLength(3)
    expect(resumed?.phasesOverride[0]).toMatchObject({ kind: 'fundamentals', phaseIndex: 3 })

    const partBFresh = resolveFundamentalsTrackSessionStart(FUNDAMENTALS_TRACK_NOVICE_B_ID, {
      completedIds: [FUNDAMENTALS_TRACK_NOVICE_ID],
      trackPhaseDone: { novice: 6 },
      lastCompletedDate: '',
    })
    expect(partBFresh?.phasesOverride).toHaveLength(2)
    expect(partBFresh?.phasesOverride[0]).toMatchObject({ kind: 'fundamentals', phaseIndex: 6 })
  })
})
