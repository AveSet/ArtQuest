import { describe, it, expect, beforeEach } from 'vitest'
import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore, getDefaultSkills, createInitialSkillNodes } from '@/store/useSkillStore'
import { buildProgressData } from '@/utils/progressService'
import { buildProgressChunkFromStores, buildProgressPayloadFromStores } from '@/utils/progressChunkBuilders'
import { PROGRESS_CHUNK_FIELD_MAP } from '../../../shared/progressSnapshot'
import { parseProgressPayload } from '../../../shared/progressSchema'
import type { QuestCompletionLog } from '@/store/models'

beforeEach(() => {
  useQuestStore.setState({
    quests: [],
    catalogQuests: [],
    userQuests: [],
    deletedQuestIds: [],
    questTitleOverrides: {},
    completedQuests: [42],
    completedWorks: [],
    questCompletionLogs: [
      {
        questId: 42,
        nodeId: 'n1',
        completedAt: '2026-06-01T12:00:00.000Z',
        xpEarned: 10,
        difficulty: 'novice',
      },
    ],
    dailyQuestsIds: [1, 2],
    completedToday: [1],
    lastDailyQuestDate: '2026-06-13',
  })
  useSkillStore.setState({
    legacySkills: getDefaultSkills(),
    skillNodes: createInitialSkillNodes(),
    achievements: [],
  })
})

describe('buildProgressChunkFromStores', () => {
  it('includes every field registered for each chunk key', () => {
    for (const [chunk, fields] of Object.entries(PROGRESS_CHUNK_FIELD_MAP)) {
      const built = buildProgressChunkFromStores(chunk as keyof typeof PROGRESS_CHUNK_FIELD_MAP)
      for (const field of fields) {
        expect(built).toHaveProperty(field)
      }
    }
  })

  it('quests chunk mirrors live quest store arrays', () => {
    const chunk = buildProgressChunkFromStores('quests')
    const questState = useQuestStore.getState()
    expect(chunk.completedQuests).toEqual(questState.completedQuests)
    const storedLogs =
      (chunk.questCompletionLogs as QuestCompletionLog[] | undefined) ??
      (chunk.recentTail as QuestCompletionLog[] | undefined)
    expect(storedLogs).toEqual(questState.questCompletionLogs)
  })

  it('does not call full buildProgressData internally', () => {
    const logs: QuestCompletionLog[] = Array.from({ length: 50 }, (_, i) => ({
      questId: i + 1,
      nodeId: '',
      completedAt: `2026-06-${String((i % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
      xpEarned: 10,
      difficulty: 'novice' as const,
    }))
    useQuestStore.setState({ questCompletionLogs: logs })
    const chunk = buildProgressChunkFromStores('quests')
    expect(
      (chunk.questCompletionLogs as QuestCompletionLog[] | undefined)?.length ??
        (chunk.recentTail as QuestCompletionLog[] | undefined)?.length,
    ).toBe(50)
    const full = buildProgressData()
    expect(full.questCompletionLogs.length).toBe(50)
  })

  it('buildProgressPayloadFromStores matches buildProgressData after schema parse', () => {
    const fromChunks = parseProgressPayload(buildProgressPayloadFromStores())
    const fromFull = parseProgressPayload(buildProgressData())
    expect(fromChunks.success).toBe(true)
    expect(fromFull.success).toBe(true)
    if (!fromChunks.success || !fromFull.success) return
    expect(fromChunks.data.completedQuests).toEqual(fromFull.data.completedQuests)
    expect(fromChunks.data.questCompletionLogs).toEqual(fromFull.data.questCompletionLogs)
    expect(fromChunks.data.settings.language).toEqual(fromFull.data.settings.language)
    expect(fromChunks.data.skillNodes).toEqual(fromFull.data.skillNodes)
  })
})
