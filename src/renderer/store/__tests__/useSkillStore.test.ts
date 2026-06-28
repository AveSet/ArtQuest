import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillStore, getDefaultSkills, createInitialSkillNodes } from '../useSkillStore'
import { NODE_MAX_LEVEL } from '@/utils/progressionBalance'
import achievementsData from '@/data/achievements.json'
import type { Achievement } from '../models'

beforeEach(() => {
  useSkillStore.setState({
    legacySkills: getDefaultSkills(),
    skillNodes: createInitialSkillNodes(),
    achievements: [],
  })
})

describe('useSkillStore', () => {
  describe('getDefaultSkills', () => {
    it('returns 7 default skills', () => {
      const skills = getDefaultSkills()
      expect(skills).toHaveLength(7)
      expect(skills.map(s => s.category)).toEqual([
        'drawing', 'anatomy', 'animation', 'effects', 'storytelling', 'character_design', 'environment',
      ])
    })

    it('starts every legacy skill at level 0', () => {
      const skills = getDefaultSkills()
      expect(skills.every((s) => s.level === 0 && s.xp === 0)).toBe(true)
    })
  })

  describe('createInitialSkillNodes', () => {
    it('creates nodes with level 0 and unlocked false', () => {
      const nodes = createInitialSkillNodes()
      expect(nodes.length).toBeGreaterThan(0)
      nodes.forEach(n => {
        expect(n.level).toBe(0)
        expect(n.xp).toBe(0)
      })
    })

    it('unlocks nodes with no prerequisites (row 0)', () => {
      const nodes = createInitialSkillNodes()
      const fundamentals = nodes.filter(n => n.prerequisites.length === 0)
      fundamentals.forEach(n => {
        expect(n.isUnlocked).toBe(true)
      })
    })
  })

  describe('addNodeXP', () => {
    it('does nothing for locked nodes', () => {
      const nodes = createInitialSkillNodes()
      const lockedNode = nodes.find(n => !n.isUnlocked)
      if (!lockedNode) return

      useSkillStore.getState().addNodeXP(lockedNode.id, 100)
      const updated = useSkillStore.getState().skillNodes
      const found = updated.find(n => n.id === lockedNode.id)
      expect(found?.xp).toBe(0)
    })

    it('adds XP to unlocked nodes', () => {
      const nodes = createInitialSkillNodes()
      const unlocked = nodes.find(n => n.isUnlocked)
      if (!unlocked) return

      useSkillStore.getState().addNodeXP(unlocked.id, 50)
      const updated = useSkillStore.getState().skillNodes
      const found = updated.find(n => n.id === unlocked.id)
      expect(found?.xp).toBe(50)
    })

    it('levels up when XP exceeds max', () => {
      const nodes = createInitialSkillNodes()
      const unlocked = nodes.find(n => n.isUnlocked)
      if (!unlocked) return

      useSkillStore.getState().addNodeXP(unlocked.id, 500)
      const updated = useSkillStore.getState().skillNodes
      const found = updated.find(n => n.id === unlocked.id)
      expect(found?.level).toBeGreaterThan(0)
    })
  })

  describe('addXPByCategory', () => {
    it('adds XP to unlocked nodes in category', () => {
      const nodes = createInitialSkillNodes()
      const unlockedDrawing = nodes.find(n => n.category === 'drawing' && n.isUnlocked)
      if (!unlockedDrawing) return

      useSkillStore.getState().addXPByCategory('drawing', 100)
      const updated = useSkillStore.getState().skillNodes
      const found = updated.find(n => n.id === unlockedDrawing.id)
      expect(found?.xp).toBe(100)
    })

    it('falls back to legacy skills if no unlocked nodes', () => {
      useSkillStore.setState({
        skillNodes: [],
        legacySkills: getDefaultSkills(),
      })

      useSkillStore.getState().addXPByCategory('drawing', 100)
      const legacy = useSkillStore.getState().legacySkills
      const drawing = legacy.find(s => s.category === 'drawing')
      expect(drawing?.xp).toBe(100)
    })

    it('legacy category track has no level cap', () => {
      useSkillStore.setState({
        skillNodes: [],
        legacySkills: getDefaultSkills().map((s) =>
          s.category === 'drawing'
            ? { ...s, level: 10, xp: 0, maxXp: 300 }
            : s,
        ),
      })

      useSkillStore.getState().addLegacyCategoryXp('drawing', 50_000)
      const drawing = useSkillStore.getState().legacySkills.find((s) => s.category === 'drawing')
      expect(drawing?.level).toBeGreaterThan(10)
    })

    it('picks best-matched node by tags', () => {
      createInitialSkillNodes()
      // Level up fundamentals to unlock row-1 nodes
      useSkillStore.getState().addNodeXP('drawing_fundamentals', 500)
      let updated = useSkillStore.getState().skillNodes
      expect(updated.find(n => n.id === 'drawing_fundamentals')?.level).toBeGreaterThanOrEqual(1)

      // XP with tags matching drawing_gesture should go to gesture
      useSkillStore.getState().addXPByCategory('drawing', 50, ['gesture', 'speed'])
      updated = useSkillStore.getState().skillNodes
      const gesture = updated.find(n => n.id === 'drawing_gesture')
      expect(gesture?.xp).toBe(50)
    })

    it('falls back to first unlocked node when no tags match', () => {
      createInitialSkillNodes()
      useSkillStore.getState().addNodeXP('drawing_fundamentals', 500)
      let updated = useSkillStore.getState().skillNodes
      expect(updated.find(n => n.id === 'drawing_fundamentals')?.level).toBeGreaterThanOrEqual(1)

      // XP with tags that don't match any drawing node should go to first unlocked
      const prevXp = updated.find(n => n.id === 'drawing_fundamentals')?.xp ?? 0
      useSkillStore.getState().addXPByCategory('drawing', 50, ['nonexistent'])
      updated = useSkillStore.getState().skillNodes
      const fundNode = updated.find(n => n.id === 'drawing_fundamentals')
      expect(fundNode?.xp).toBe(prevXp + 50)
    })
  })

  describe('checkAchievements', () => {
    it('unlocks first_quest when questCount >= 1', () => {
      const result = useSkillStore.getState().checkAchievements({
        completedQuests: [],
        completedWorks: [],
        streak: 0,
        questCompletionLogs: [{ questId: 1, nodeId: '', completedAt: new Date().toISOString(), xpEarned: 100, difficulty: 'novice' }],
      })
      expect(result.some(a => a.id === 'first_quest')).toBe(true)
    })

    it('unlocks quality_reflection_5 with enough feedback logs', () => {
      const logs = Array.from({ length: 5 }, (_, i) => ({
        questId: i + 1,
        nodeId: '',
        completedAt: new Date().toISOString(),
        xpEarned: 10,
        difficulty: 'novice' as const,
        feedback: {
          difficultyRating: 3 as const,
          criteria: [{ label: 'proportion' as const, rating: 4 as const }],
        },
      }))
      const result = useSkillStore.getState().checkAchievements({
        completedQuests: [],
        completedWorks: [],
        streak: 0,
        questCompletionLogs: logs,
      })
      expect(result.some((a) => a.id === 'quality_reflection_5')).toBe(true)
    })

    it('category achievements count unique quests not log spam', () => {
      const drawingQuest = {
        id: 900,
        category: 'drawing',
        difficulty: 'novice',
      } as import('../models').Quest
      const logs = Array.from({ length: 30 }, () => ({
        questId: 900,
        nodeId: '',
        completedAt: new Date().toISOString(),
        xpEarned: 10,
        difficulty: 'novice' as const,
      }))
      const result = useSkillStore.getState().checkAchievements({
        completedQuests: [drawingQuest],
        completedWorks: [],
        streak: 0,
        questCompletionLogs: logs,
      })
      expect(result.some((a) => a.id === 'drawing_century')).toBe(false)
      expect(result.some((a) => a.id === 'drawing_master')).toBe(false)
      expect(result.some((a) => a.id === 'thirty_quests')).toBe(true)
    })

    it('unlocks level_12 when effective level from prestige reaches 12', () => {
      const nodes = createInitialSkillNodes().map((n) =>
        n.id === 'drawing_fundamentals'
          ? { ...n, isUnlocked: true, level: 2, prestige: 1 }
          : n
      )
      useSkillStore.setState({
        skillNodes: nodes,
        achievements: (achievementsData as Achievement[]).map((a) => ({ ...a, unlocked: false })),
      })
      expect(2 + NODE_MAX_LEVEL).toBeGreaterThanOrEqual(12)

      const result = useSkillStore.getState().checkAchievements({
        completedQuests: [],
        completedWorks: [],
        streak: 0,
        questCompletionLogs: [],
      })
      expect(result.some((a) => a.id === 'level_12')).toBe(true)
    })
  })
})
