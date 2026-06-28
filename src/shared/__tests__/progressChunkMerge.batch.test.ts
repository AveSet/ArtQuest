import { describe, it, expect } from 'vitest'
import {
  isProgressChunkBatchPayload,
  isProgressChunkPayload,
  mergeProgressChunks,
} from '../../shared/progressChunkMerge'

describe('progressChunkMerge batch payloads', () => {
  it('detects batch chunk payloads', () => {
    expect(
      isProgressChunkBatchPayload({
        _chunkBatch: [
          { _chunkKey: 'core', data: { completedToday: [] } },
          { _chunkKey: 'quests', data: { completedQuests: [1] } },
        ],
      }),
    ).toBe(true)
    expect(isProgressChunkBatchPayload({ _chunkBatch: [] })).toBe(false)
    expect(isProgressChunkBatchPayload({ _chunkKey: 'core', data: {} })).toBe(false)
  })

  it('merges multiple chunk entries from a batch save', () => {
    const merged = mergeProgressChunks({
      core: { completedToday: [2] },
      quests: { completedQuests: [9] },
    })
    expect(merged.completedToday).toEqual([2])
    expect(merged.completedQuests).toEqual([9])
    expect(isProgressChunkPayload({ _chunkKey: 'skills', data: { skillNodes: [] } })).toBe(true)
  })
})
