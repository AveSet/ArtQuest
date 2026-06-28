import { describe, it, expect } from 'vitest'
import {
  computeQualityAchievementStats,
  shouldUnlockQualityAchievement,
} from '../qualityAchievements'
import type { CompletedWork, QuestCompletionLog } from '@/store/models'
import { createInitialSkillNodes } from '@/store/useSkillStore'

describe('qualityAchievements', () => {
  it('counts reflection and portfolio signals', () => {
    const logs: QuestCompletionLog[] = [
      {
        questId: 1,
        nodeId: 'n',
        completedAt: '2026-01-01T10:00:00Z',
        xpEarned: 10,
        difficulty: 'novice',
        category: 'drawing',
        feedback: {
          difficultyRating: 3,
          criteria: [{ label: 'proportion', rating: 4 }],
        },
      },
      {
        questId: 2,
        nodeId: 'n',
        completedAt: '2026-01-10T10:00:00Z',
        xpEarned: 10,
        difficulty: 'novice',
        category: 'drawing',
        feedback: {
          difficultyRating: 3,
          criteria: [{ label: 'line_confidence', rating: 4 }],
          mistakeTags: ['hands', 'perspective'],
        },
      },
    ]
    const works: CompletedWork[] = [
      { questId: 1, imageUrl: 'a', date: '2026-01-01', improvementNotes: 'fix hands' },
      { questId: 1, imageUrl: 'b', date: '2026-01-02', tags: ['hands'] },
    ]
    const stats = computeQualityAchievementStats(logs, works, createInitialSkillNodes(), {
      v1: 'helpful',
      v2: 'applied',
    })
    expect(stats.logsWithFeedback).toBe(2)
    expect(stats.logsWithStrongCriteria).toBe(2)
    expect(stats.worksWithImprovementNotes).toBe(1)
    expect(stats.worksWithTags).toBe(1)
    expect(stats.questsWithMultipleWorks).toBe(1)
    expect(stats.materialHelpful).toBe(1)
    expect(stats.materialApplied).toBe(1)
    expect(stats.uniqueMistakeTags).toBe(2)
    expect(shouldUnlockQualityAchievement('quality_reflection_5', stats)).toBe(false)
    expect(shouldUnlockQualityAchievement('growth_before_after_3', stats)).toBe(false)
  })

  it('detects spaced revisits', () => {
    const logs: QuestCompletionLog[] = [
      { questId: 5, nodeId: '', completedAt: '2026-01-01', xpEarned: 1, difficulty: 'novice' },
      { questId: 5, nodeId: '', completedAt: '2026-01-15', xpEarned: 1, difficulty: 'novice' },
      { questId: 6, nodeId: '', completedAt: '2026-02-01', xpEarned: 1, difficulty: 'novice' },
      { questId: 6, nodeId: '', completedAt: '2026-02-20', xpEarned: 1, difficulty: 'novice' },
      { questId: 7, nodeId: '', completedAt: '2026-03-01', xpEarned: 1, difficulty: 'novice' },
      { questId: 7, nodeId: '', completedAt: '2026-03-12', xpEarned: 1, difficulty: 'novice' },
    ]
    const stats = computeQualityAchievementStats(logs, [], createInitialSkillNodes())
    expect(stats.spacedRevisitQuests).toBe(3)
    expect(shouldUnlockQualityAchievement('reviewer_revisit_3', stats)).toBe(true)
  })
})
