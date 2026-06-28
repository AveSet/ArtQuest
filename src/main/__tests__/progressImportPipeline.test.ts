import { describe, expect, it } from 'vitest'
import { expandPayloadCompletionLogs, compressCompletionLogsForExport } from '../../shared/progressLogCompression'
import { mergeProgressChunks, splitProgressIntoChunks } from '../../shared/progressChunkMerge'
import { parseProgressPayload, pickLoadedProgressFields } from '../../shared/progressSchema'

/** Mirrors Electron `import-progress-file` expansion before Zod parse. */
function parseImportedProgressFile(raw: Record<string, unknown>) {
  const payload = raw.payload && typeof raw.payload === 'object' ? raw.payload : raw
  const expandedPayload =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? expandPayloadCompletionLogs(payload as Record<string, unknown>)
      : payload
  return parseProgressPayload(expandedPayload)
}

describe('progress import pipeline (main)', () => {
  it('accepts compressed completion logs in export envelopes', () => {
    const logs = Array.from({ length: 120 }, (_, i) => ({
      questId: i + 1,
      nodeId: 'drawing_fundamentals',
      completedAt: '2026-06-04T12:00:00.000Z',
      xpEarned: 12,
      difficulty: 'novice',
    }))
    const envelope = {
      version: 1,
      exportedAt: '2026-06-04T12:00:00.000Z',
      payload: {
        schemaVersion: 15,
        questCompletionLogs: [],
        questCompletionLogsCompressed: compressCompletionLogsForExport(logs),
        completedQuests: [],
        skillNodes: [],
        legacySkills: [],
        achievements: [],
        userQuests: [],
        deletedQuestIds: [],
        completedWorks: [],
        settings: {
          soundEnabled: true,
          soundVolume: 0.5,
          language: 'en',
          favoriteCategories: ['drawing'],
          useRandomCategories: false,
          profileSetupComplete: true,
          hasSeenOnboarding: true,
        },
      },
    }

    const parsed = parseImportedProgressFile(envelope)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.questCompletionLogs).toHaveLength(120)
  })

  it('import sync keeps questSavedReferences when stale quest chunks exist', () => {
    const importedRefs = {
      '99': [{ id: 'ref_import', path: '/userData/refs/import.png', addedAt: '2026-06-09T10:00:00.000Z' }],
    }
    const imported = parseProgressPayload({
      schemaVersion: 15,
      questSavedReferences: importedRefs,
      skillNodes: [],
      legacySkills: [],
      achievements: [],
      userQuests: [],
      deletedQuestIds: [],
      questTitleOverrides: {},
      completedQuests: [],
      completedWorks: [],
      questCompletionLogs: [],
      settings: {
        soundEnabled: true,
        soundVolume: 0.5,
        language: 'en',
        favoriteCategories: ['drawing'],
        useRandomCategories: false,
        profileSetupComplete: true,
        hasSeenOnboarding: true,
      },
      streakState: { current: 0, longest: 0, lastActiveDate: '' },
      adaptiveWeights: { default: 1 },
      lastRefreshDate: '',
      dailyQuestsIds: [],
      completedToday: [],
      lastDailyQuestDate: '',
      lastFavCategories: '',
      dailyBonusGrantedDate: '',
      weeklyChallengeWeek: '',
      weeklyChallengeQuestId: 0,
      weeklyChallengeCompletedWeek: '',
    })
    expect(imported.success).toBe(true)
    if (!imported.success) return

    const snapshot = pickLoadedProgressFields(imported.data)
    const staleChunks = {
      quests: { questSavedReferences: { '1': [{ id: 'stale', path: '/old.png', addedAt: '2020-01-01' }] } },
      core: { completedToday: [1] },
    }
    const withoutSync = mergeProgressChunks(staleChunks, snapshot)
    expect(withoutSync.questSavedReferences).toEqual(staleChunks.quests.questSavedReferences)

    const syncedChunks = splitProgressIntoChunks(snapshot)
    const afterSync = mergeProgressChunks(syncedChunks)
    expect(afterSync.questSavedReferences).toEqual(importedRefs)
  })
})
