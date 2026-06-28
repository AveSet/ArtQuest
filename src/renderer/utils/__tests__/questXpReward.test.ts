import { describe, expect, it, beforeEach } from 'vitest'
import { useSkillStore, createInitialSkillNodes } from '@/store/useSkillStore'
import { distributeQuestXp } from '../questXpReward'
import { computeQuestNodeXp, computeQuestTrackXp } from '../progressionBalance'

describe('distributeQuestXp', () => {
  beforeEach(() => {
    useSkillStore.setState({
      skillNodes: createInitialSkillNodes().map((n) =>
        n.id === 'drawing_fundamentals' ? { ...n, isUnlocked: true } : n,
      ),
      legacySkills: useSkillStore.getState().legacySkills.map((s) => ({ ...s, xp: 0, level: 1 })),
    })
  })

  it('awards full track and 20% node XP for a standard full-session completion', () => {
    distributeQuestXp(100, 'drawing', {
      tags: ['fundamentals'],
      practiceMinutes: 30,
      estimatedTime: 30,
      isSpeedRun: false,
    })
    const legacy = useSkillStore.getState().legacySkills.find((s) => s.category === 'drawing')
    const node = useSkillStore.getState().skillNodes.find((n) => n.id === 'drawing_fundamentals')
    expect(legacy?.xp).toBe(100)
    expect(node?.xp).toBe(computeQuestNodeXp(100, { practiceMinutes: 30, isSpeedRun: false }))
  })

  it('adds more node XP when practice minutes are higher but legacy track stays full face value', () => {
    distributeQuestXp(100, 'drawing', {
      tags: ['fundamentals'],
      practiceMinutes: 10,
      estimatedTime: 30,
    })
    distributeQuestXp(100, 'drawing', {
      tags: ['fundamentals'],
      practiceMinutes: 30,
      estimatedTime: 30,
    })
    const legacy = useSkillStore.getState().legacySkills.find((s) => s.category === 'drawing')
    const node = useSkillStore.getState().skillNodes.find((n) => n.id === 'drawing_fundamentals')
    expect(legacy?.xp).toBe(200)
    expect(node?.xp).toBe(
      computeQuestNodeXp(100, { practiceMinutes: 10 })
        + computeQuestNodeXp(100, { practiceMinutes: 30 }),
    )
  })

  it('keeps full track XP on speed runs but penalizes node practice bonus', () => {
    distributeQuestXp(70, 'drawing', {
      tags: ['fundamentals'],
      practiceMinutes: 10,
      estimatedTime: 25,
      isSpeedRun: true,
    })
    const legacy = useSkillStore.getState().legacySkills.find((s) => s.category === 'drawing')
    const node = useSkillStore.getState().skillNodes.find((n) => n.id === 'drawing_fundamentals')
    expect(legacy?.xp).toBe(70)
    expect(node?.xp).toBe(
      computeQuestNodeXp(70, { practiceMinutes: 10, isSpeedRun: true }),
    )
  })

  it('guards against negative or zero practice minutes anomalies', () => {
    distributeQuestXp(100, 'drawing', {
      tags: ['fundamentals'],
      practiceMinutes: 0,
      estimatedTime: 30,
    })
    const legacy = useSkillStore.getState().legacySkills.find((s) => s.category === 'drawing')
    const node = useSkillStore.getState().skillNodes.find((n) => n.id === 'drawing_fundamentals')
    expect(legacy?.xp).toBe(computeQuestTrackXp(100, { practiceMinutes: 0, estimatedTime: 30 }))
    expect(node?.xp).toBe(20)

    useSkillStore.setState({
      legacySkills: useSkillStore.getState().legacySkills.map((s) => ({ ...s, xp: 0, level: 1 })),
      skillNodes: createInitialSkillNodes().map((n) =>
        n.id === 'drawing_fundamentals' ? { ...n, isUnlocked: true, xp: 0, level: 0 } : n,
      ),
    })

    distributeQuestXp(100, 'drawing', {
      tags: ['fundamentals'],
      practiceMinutes: -10,
      estimatedTime: 30,
    })
    const legacyAfter = useSkillStore.getState().legacySkills.find((s) => s.category === 'drawing')
    const nodeAfter = useSkillStore.getState().skillNodes.find((n) => n.id === 'drawing_fundamentals')
    expect(legacyAfter?.xp).toBe(computeQuestTrackXp(100, { practiceMinutes: 0, estimatedTime: 30 }))
    expect(nodeAfter?.xp).toBe(20)
  })
})
