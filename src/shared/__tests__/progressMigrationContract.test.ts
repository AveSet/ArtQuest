import { describe, it, expect } from 'vitest'
import {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  parseProgressPayload,
  pickLoadedProgressFields,
} from '../progressSchema'
import { MIGRATION_CONTRACT_FIXTURES } from './fixtures/progressMigrationFixtures'

describe('progress migration contract', () => {
  for (const { label, payload } of MIGRATION_CONTRACT_FIXTURES) {
    it(`migrates ${label} to schema v${CURRENT_PROGRESS_SCHEMA_VERSION}`, () => {
      const parsed = parseProgressPayload(payload)
      expect(parsed.success, parsed.success ? undefined : JSON.stringify(parsed.error?.issues?.slice(0, 3))).toBe(true)
      if (!parsed.success) return
      expect(parsed.data.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION)
    })

    it(`pickLoadedProgressFields preserves core data for ${label}`, () => {
      const parsed = parseProgressPayload(payload)
      expect(parsed.success).toBe(true)
      if (!parsed.success) return
      const loaded = pickLoadedProgressFields(parsed.data)
      expect(loaded.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION)
      expect(Array.isArray(loaded.completedQuests)).toBe(true)
      expect(loaded.settings).toBeTruthy()
      expect(loaded.streakState).toBeTruthy()
    })
  }

  it('strips legacy campaign keys during migration', () => {
    const parsed = parseProgressPayload({
      schemaVersion: 22,
      settings: {
        ...MIGRATION_CONTRACT_FIXTURES[0].payload.settings,
        campaign: 'legacy',
        learningPath: 'old-path',
        portraitAnimation: 'spine',
      },
    })
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect('campaign' in parsed.data.settings).toBe(false)
    expect('learningPath' in parsed.data.settings).toBe(false)
    expect('portraitAnimation' in parsed.data.settings).toBe(false)
  })
})
