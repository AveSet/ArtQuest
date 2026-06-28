import { describe, expect, it } from 'vitest'
import { PROGRESS_CHUNK_FIELD_MAP, splitProgressSnapshot } from '../progressSnapshot'
import { PROGRESS_FIELD_KEYS } from '../progressSchema'
import { assertProgressFieldRegistryComplete } from '../progressFieldRegistry'

describe('progressSnapshot', () => {
  it('maps every progress field to exactly one chunk', () => {
    expect(assertProgressFieldRegistryComplete()).toEqual([])
  })

  it('does not duplicate fundamentalsProgress in quests chunk', () => {
    expect(PROGRESS_CHUNK_FIELD_MAP.quests).not.toContain('fundamentalsProgress')
    expect(PROGRESS_CHUNK_FIELD_MAP.core).toContain('fundamentalsProgress')
  })

  it('splits a full snapshot without losing fields', () => {
    const full: Record<string, unknown> = { schemaVersion: 17 }
    for (const key of PROGRESS_FIELD_KEYS) {
      full[key] = key === 'fundamentalsProgress' ? { completedIds: [], lastCompletedDate: '' } : []
    }
    const chunks = splitProgressSnapshot(full)
    expect(chunks.core.fundamentalsProgress).toEqual({ completedIds: [], lastCompletedDate: '' })
    expect(chunks.quests).not.toHaveProperty('fundamentalsProgress')
    expect(chunks.skills.skillNodes).toEqual([])
  })
})
