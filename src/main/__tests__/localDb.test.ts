import { describe, it, expect } from 'vitest'
import { mergeProgressChunks } from '../../shared/progressChunkMerge'

/** Lightweight persistence tests without spinning up SQLite/Electron. */
describe('localDb chunk merge contract', () => {
  it('rebuilds a progress object from chunk rows like localDb.rebuildProgressFromChunks', () => {
    const merged = mergeProgressChunks({
      core: { completedToday: [3], schemaVersion: 15 },
      quests: { completedQuests: [7, 8] },
      gallery: { completedWorks: [{ questId: 1 }] },
    })
    expect(merged.completedToday).toEqual([3])
    expect(merged.completedQuests).toEqual([7, 8])
    expect(merged.completedWorks).toEqual([{ questId: 1 }])
  })
})
