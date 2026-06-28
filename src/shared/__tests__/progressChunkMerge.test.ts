import { describe, it, expect } from 'vitest'
import { isProgressChunkPayload, mergeProgressChunks, splitProgressIntoChunks } from '../progressChunkMerge'

describe('progressChunkMerge', () => {
  it('detects chunk payloads', () => {
    expect(isProgressChunkPayload({ _chunkKey: 'core', data: { settings: {} } })).toBe(true)
    expect(isProgressChunkPayload({ settings: {} })).toBe(false)
  })

  it('merges chunks with cosmetics portrait nested', () => {
    const merged = mergeProgressChunks({
      core: { completedToday: [1], schemaVersion: 12 },
      quests: { completedQuests: [1, 2] },
      cosmetics: { portraitProgress: { dailyChestStreak: 3 } },
    })
    expect(merged.completedToday).toEqual([1])
    expect(merged.completedQuests).toEqual([1, 2])
    expect(merged.portraitProgress).toEqual({ dailyChestStreak: 3 })
  })

  it('round-trips split and merge', () => {
    const full = {
      schemaVersion: 12,
      settings: { language: 'en' },
      completedQuests: [5],
      skillNodes: [],
      completedWorks: [],
      portraitProgress: { dailyChestStreak: 0 },
    }
    const chunks = splitProgressIntoChunks(full)
    const merged = mergeProgressChunks(chunks)
    expect(merged.completedQuests).toEqual([5])
    expect(merged.settings).toEqual({ language: 'en' })
  })
})
