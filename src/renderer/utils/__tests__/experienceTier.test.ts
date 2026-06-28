import { describe, expect, it } from 'vitest'
import { createInitialSkillNodes } from '@/store/useSkillStore'
import { computeAvgSkillLevel } from '@/utils/recommendedQuest'
import { NODE_ROWS } from '@/utils/skillUnlocks'
import {
  applyExperienceTierToSkillNodes,
  maxUnlockedRowForTier,
  syncLegacySkillsForTier,
} from '@/utils/experienceTier'
import { getDefaultSkills } from '@/store/useSkillStore'

function nodesAtRow(nodes: ReturnType<typeof createInitialSkillNodes>, row: number) {
  return nodes.filter((n) => (NODE_ROWS[n.id] ?? 0) === row)
}

describe('experienceTier', () => {
  it('beginner leaves tree at default unlocks', () => {
    const nodes = createInitialSkillNodes()
    const result = applyExperienceTierToSkillNodes(nodes, 'beginner')
    expect(nodesAtRow(result, 2).every((n) => !n.isUnlocked)).toBe(true)
    expect(nodesAtRow(result, 3).every((n) => !n.isUnlocked)).toBe(true)
    expect(computeAvgSkillLevel(result)).toBe(1)
  })

  it('intermediate unlocks through row 2 (3rd skill level)', () => {
    const nodes = createInitialSkillNodes()
    const result = applyExperienceTierToSkillNodes(nodes, 'intermediate')
    const row2 = nodesAtRow(result, 2)
    expect(row2.length).toBeGreaterThan(0)
    expect(row2.every((n) => n.isUnlocked)).toBe(true)
    expect(nodesAtRow(result, 3).every((n) => !n.isUnlocked)).toBe(true)
    expect(computeAvgSkillLevel(result, 'intermediate')).toBeGreaterThanOrEqual(4)
  })

  it('advanced unlocks top row (row 3)', () => {
    const nodes = createInitialSkillNodes()
    const result = applyExperienceTierToSkillNodes(nodes, 'advanced')
    const row3 = nodesAtRow(result, 3)
    expect(row3.length).toBeGreaterThan(0)
    expect(row3.every((n) => n.isUnlocked)).toBe(true)
    expect(computeAvgSkillLevel(result, 'advanced')).toBeGreaterThanOrEqual(7)
  })

  it('resets existing node levels when tier changes', () => {
    const nodes = createInitialSkillNodes().map((n) => ({ ...n, level: 12, xp: 50 }))
    const result = applyExperienceTierToSkillNodes(nodes, 'intermediate')
    expect(result.every((n) => n.level === 0 && n.xp === 0 && n.prestige === 0)).toBe(true)
  })

  it('locks rows above tier when downgrading', () => {
    const advanced = applyExperienceTierToSkillNodes(createInitialSkillNodes(), 'advanced')
    const beginner = applyExperienceTierToSkillNodes(advanced, 'beginner')
    expect(nodesAtRow(beginner, 2).every((n) => !n.isUnlocked)).toBe(true)
    expect(nodesAtRow(beginner, 3).every((n) => !n.isUnlocked)).toBe(true)
  })

  it('syncLegacySkillsForTier sets legacy bars to tier baseline', () => {
    const progressed = getDefaultSkills().map((s) => ({ ...s, level: 10, xp: 200 }))
    expect(syncLegacySkillsForTier(progressed, 'beginner').every((s) => s.level === 0 && s.xp === 0)).toBe(
      true,
    )
    expect(syncLegacySkillsForTier(progressed, 'intermediate').every((s) => s.level === 3 && s.xp === 0)).toBe(
      true,
    )
    expect(syncLegacySkillsForTier(progressed, 'advanced').every((s) => s.level === 4 && s.xp === 0)).toBe(
      true,
    )
  })

  it('maxUnlockedRowForTier maps tiers to rows', () => {
    expect(maxUnlockedRowForTier('beginner')).toBe(0)
    expect(maxUnlockedRowForTier('intermediate')).toBe(2)
    expect(maxUnlockedRowForTier('advanced')).toBe(3)
  })
})
