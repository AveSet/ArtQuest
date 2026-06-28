import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  splitSessionRemaining,
  getSessionPracticeMinutes,
  useQuestSessionStore,
  QUEST_REFERENCE_BONUS_MINUTES,
} from '@/store/useQuestSessionStore'
import type { QuestSession } from '@/store/useQuestSessionStore'
import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useUIStore } from '@/store/useUIStore'
import { createInitialSkillNodes } from '@/store/useSkillStore'
import { shouldCountSessionTime } from '@/store/useActivityStore'

vi.mock('@/utils/sound', () => ({ playSound: vi.fn(), playSessionSound: vi.fn() }))
vi.mock('@/store/useActivityStore', () => ({
  shouldCountSessionTime: vi.fn(() => true),
}))

function session(partial: Partial<QuestSession>): QuestSession {
  return {
    questId: 1,
    mainMinutes: 20,
    referenceMinutes: QUEST_REFERENCE_BONUS_MINUTES,
    remainingSec: 30 * 60,
    isRunning: true,
    isExpired: false,
    overtimeElapsedSec: 0,
    graceRemainingSec: 0,
    graceExpired: false,
    startedAtMs: Date.now(),
    phases: [],
    currentPhaseIndex: 0,
    phaseRemainingSec: 0,
    currentPhaseEnteredAtMs: Date.now(),
    phasesComplete: false,
    referenceAtEnd: false,
    ...partial,
  }
}

describe('splitSessionRemaining', () => {
  it('splits reference-first for legacy sessions', () => {
    const parts = splitSessionRemaining(session({ remainingSec: 30 * 60 }))
    expect(parts.referenceSec).toBe(10 * 60)
    expect(parts.mainSec).toBe(20 * 60)
  })

  it('splits reference-at-end for phased sessions', () => {
    const parts = splitSessionRemaining(
      session({ remainingSec: 25 * 60, referenceAtEnd: true }),
    )
    expect(parts.mainSec).toBe(20 * 60)
    expect(parts.referenceSec).toBe(5 * 60)
  })
})

describe('getSessionPracticeMinutes', () => {
  beforeEach(() => {
    useUIStore.setState({
      settings: { ...useUIStore.getState().settings, activityTrackingEnabled: true },
    } as Partial<ReturnType<typeof useUIStore.getState>>)
  })

  it('counts elapsed active time from remaining seconds when tracking off', () => {
    useUIStore.setState({
      settings: { ...useUIStore.getState().settings, activityTrackingEnabled: false },
    } as Partial<ReturnType<typeof useUIStore.getState>>)
    const s = session({ remainingSec: 25 * 60 })
    expect(getSessionPracticeMinutes(s)).toBe(5)
  })

  it('prefers tracked activeElapsedSec when set', () => {
    const s = session({ remainingSec: 30 * 60, activeElapsedSec: 300 })
    expect(getSessionPracticeMinutes(s)).toBe(5)
  })

  it('uses a minimum minute for brand-new tracked sessions to avoid zero-minute completions', () => {
    const s = session({ remainingSec: 30 * 60, activeElapsedSec: 0 })
    expect(getSessionPracticeMinutes(s)).toBe(1)
  })
})

describe('phased session', () => {
  beforeEach(() => {
    useQuestSessionStore.setState({ session: null, referenceToastVisible: false })
    useQuestStore.setState({
      quests: [
        {
          id: 42,
          code: 'T',
          title: { en: 'Test', ru: 'Тест', zh: 'Test', ja: 'Test', ko: 'Test' },
          category: 'drawing',
          difficulty: 'novice',
          description: { en: 'd', ru: 'd', zh: 'd', ja: 'd', ko: 'd' },
          xp: 50,
          estimatedTime: 99,
          source: '',
          icon: '🎨',
          color: '#000',
          min_level: 1,
          tags: [],
          prerequisites: [],
          medium: 'digital',
          is_repeatable: true,
          review_after_days: 0,
          streak_bonus: 1,
          microChallenges: [
            { id: 'mc-a', instruction: { en: 'A', ru: 'A', zh: 'A', ja: 'A', ko: 'A' }, estimatedTime: 1, xp: 5 },
            { id: 'mc-b', instruction: { en: 'B', ru: 'B', zh: 'B', ja: 'B', ko: 'B' }, estimatedTime: 1, xp: 5, prerequisite: 'mc-a' },
          ],
        },
      ],
      microChallengesCompleted: {},
      questsLoaded: true,
    } as Partial<ReturnType<typeof useQuestStore.getState>>)
  })

  it('starts with total pool from micro challenge minutes', () => {
    const quest = useQuestStore.getState().quests[0]!
    useQuestSessionStore.getState().startSession(quest, false)
    const s = useQuestSessionStore.getState().session!
    expect(s.mainMinutes).toBe(2)
    expect(s.remainingSec).toBe(2 * 60)
    expect(s.phases).toHaveLength(2)
    expect(s.phaseRemainingSec).toBe(60)
  })

  it('keeps countdown when art-app activity is not counted', () => {
    const quest = useQuestStore.getState().quests[0]!
    useQuestSessionStore.getState().startSession(quest, false)
    const before = useQuestSessionStore.getState().session!.remainingSec
    vi.mocked(shouldCountSessionTime).mockReturnValue(false)
    useQuestSessionStore.getState().tick()
    const after = useQuestSessionStore.getState().session!
    expect(after.remainingSec).toBe(before - 1)
    expect(after.activeElapsedSec).toBe(0)
    vi.mocked(shouldCountSessionTime).mockReturnValue(true)
  })

  it('advancePhase carries unused phase seconds into the next phase and awards phase XP', () => {
    useSkillStore.setState({
      skillNodes: createInitialSkillNodes().map((n) =>
        n.id === 'drawing_fundamentals' ? { ...n, isUnlocked: true } : n,
      ),
    })
    const quest = useQuestStore.getState().quests[0]!
    useQuestSessionStore.getState().startSession(quest, false)
    const before = useQuestSessionStore.getState().session!.remainingSec
    useQuestSessionStore.getState().advancePhase()
    const after = useQuestSessionStore.getState().session!
    expect(after.currentPhaseIndex).toBe(1)
    expect(after.remainingSec).toBe(before)
    expect(after.phaseRemainingSec).toBe(120)
    expect(useQuestStore.getState().microChallengesCompleted['42']).toContain('mc-a')
    const node = useSkillStore.getState().skillNodes.find((n) => n.id === 'drawing_fundamentals')
    expect(node?.xp).toBeGreaterThan(0)
  })
})

describe('overtime session', () => {
  beforeEach(() => {
    useQuestSessionStore.setState({ session: null, referenceToastVisible: false })
  })

  it('enters overtime instead of expiring the session', () => {
    useQuestSessionStore.setState({
      session: {
        questId: 1,
        mainMinutes: 1,
        referenceMinutes: 0,
        remainingSec: 1,
        isRunning: true,
        isExpired: false,
        overtimeElapsedSec: 0,
        graceRemainingSec: 0,
        graceExpired: false,
        startedAtMs: Date.now(),
        phases: [],
        currentPhaseIndex: 0,
        phaseRemainingSec: 0,
        currentPhaseEnteredAtMs: Date.now(),
        phasesComplete: true,
        referenceAtEnd: false,
        activeElapsedSec: 0,
      },
    })
    useQuestSessionStore.getState().tick()
    useQuestSessionStore.getState().tick()
    const s = useQuestSessionStore.getState().session!
    expect(s.isExpired).toBe(true)
    expect(s.graceExpired).toBe(false)
    expect(s.isRunning).toBe(true)
    expect(s.overtimeElapsedSec).toBe(1)
  })

  it('zeros phase timer when total session time expires', () => {
    useQuestSessionStore.setState({
      session: session({
        remainingSec: 1,
        phaseRemainingSec: 1,
        phases: [{ kind: 'exercise', challengeId: 'mc-a', durationSec: 60, xp: 5 }],
        currentPhaseIndex: 0,
        phasesComplete: false,
        referenceMinutes: 0,
      }),
    })

    useQuestSessionStore.getState().tick()

    const s = useQuestSessionStore.getState().session!
    expect(s.isExpired).toBe(true)
    expect(s.remainingSec).toBe(0)
    expect(s.phaseRemainingSec).toBe(0)
  })
})
