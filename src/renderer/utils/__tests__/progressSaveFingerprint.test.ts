import { describe, it, expect } from 'vitest'
import { buildProgressSaveFingerprint } from '../progressSaveFingerprint'

describe('buildProgressSaveFingerprint', () => {
  it('buckets running session remainingSec so timer ticks do not change fingerprint every second', () => {
    const base = {
      schemaVersion: 12,
      activeQuestSession: {
        questId: 1,
        remainingSec: 61,
        isRunning: true,
        isExpired: false,
        savedAtMs: 0,
      },
    }
    const a = buildProgressSaveFingerprint(base)
    const b = buildProgressSaveFingerprint({
      ...base,
      activeQuestSession: { ...base.activeQuestSession!, remainingSec: 62 },
    })
    expect(a).toBe(b)
  })

  it('changes fingerprint when session quest changes', () => {
    const a = buildProgressSaveFingerprint({
      activeQuestSession: { questId: 1, remainingSec: 100, isRunning: true, isExpired: false, savedAtMs: 0 },
    })
    const b = buildProgressSaveFingerprint({
      activeQuestSession: { questId: 2, remainingSec: 100, isRunning: true, isExpired: false, savedAtMs: 0 },
    })
    expect(a).not.toBe(b)
  })
})
