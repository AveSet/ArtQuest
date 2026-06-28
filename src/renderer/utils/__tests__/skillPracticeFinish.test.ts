import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { useSkillStore, createInitialSkillNodes } from '@/store/useSkillStore'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { finishSkillPracticeSession } from '@/utils/skillPracticeFinish'

describe('finishSkillPracticeSession', () => {
  beforeEach(() => {
    useSkillPracticeStore.getState().clearSession()
    useUIStore.setState({ achievementQueue: [] })
  })

  it('awards practice XP and clears session', () => {
    useSkillStore.setState({
      skillNodes: createInitialSkillNodes().map((n) =>
        n.id === 'drawing_fundamentals' ? { ...n, isUnlocked: true, level: 1 } : n,
      ),
    })
    useSkillPracticeStore.setState({
      session: {
        nodeId: 'drawing_fundamentals',
        category: 'drawing',
        activeElapsedSec: 120,
        startedAtMs: Date.now(),
      },
    })

    const result = finishSkillPracticeSession()
    expect(result?.xp).toBeGreaterThan(0)
    expect(useSkillPracticeStore.getState().session).toBeNull()
    expect(useQuestStore.getState().lastCompletionReward?.skillXp).toBe(result?.xp)
  })
})
