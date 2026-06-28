import { describe, it, expect } from 'vitest'
import {
  computePracticeRatio,
  computePracticeBonusXp,
  computeQuestNodeXp,
  computeQuestTrackXp,
  computeSkillXpFromQuest,
  computePracticeOnlyXp,
  expectedMaxXpAtNodeLevel,
  NODE_XP_BASE,
  QUEST_NODE_XP_RATIO,
  PRACTICE_RATIO_FLOOR,
} from '../progressionBalance'

describe('progressionBalance', () => {
  describe('computePracticeRatio', () => {
    it('clamps ratio between floor and 1', () => {
      expect(computePracticeRatio(0, 25)).toBe(PRACTICE_RATIO_FLOOR)
      expect(computePracticeRatio(5, 25)).toBe(0.25)
      expect(computePracticeRatio(25, 25)).toBe(1)
      expect(computePracticeRatio(40, 25)).toBe(1)
    })

    it('returns 1 when estimated time is unknown', () => {
      expect(computePracticeRatio(0, 0)).toBe(1)
    })
  })

  describe('quest XP split', () => {
    it('credits full track XP when no estimated time is provided', () => {
      expect(computeQuestTrackXp(100)).toBe(100)
      expect(computeQuestTrackXp(250)).toBe(250)
    })

    it('awards full track XP on completion regardless of logged practice minutes', () => {
      expect(computeQuestTrackXp(100, { practiceMinutes: 25, estimatedTime: 25 })).toBe(100)
      expect(computeQuestTrackXp(100, { practiceMinutes: 10, estimatedTime: 25 })).toBe(100)
      expect(computeQuestTrackXp(70, { practiceMinutes: 0, estimatedTime: 25 })).toBe(70)
    })

    it('applies overtime penalty to track XP only', () => {
      const onTime = computeQuestTrackXp(100, { practiceMinutes: 30, estimatedTime: 30 })
      const overtime = computeQuestTrackXp(100, {
        practiceMinutes: 45,
        estimatedTime: 30,
        isOvertime: true,
      })
      expect(onTime).toBe(100)
      expect(overtime).toBe(75)
      const nodeOnTime = computeQuestNodeXp(100, { practiceMinutes: 45, isOvertime: true })
      const nodeNoOvertimeFlag = computeQuestNodeXp(100, { practiceMinutes: 45 })
      expect(nodeOnTime).toBe(nodeNoOvertimeFlag)
    })

    it('credits 20% of quest XP to the skill node', () => {
      expect(QUEST_NODE_XP_RATIO).toBe(0.2)
      expect(computeQuestNodeXp(100)).toBe(20)
      expect(computeQuestNodeXp(250)).toBe(Math.round(250 * QUEST_NODE_XP_RATIO))
    })

    it('adds practice-time XP to the node share', () => {
      expect(computeQuestNodeXp(100, 10)).toBe(20 + computePracticeOnlyXp(10))
      expect(computeQuestNodeXp(100, 30)).toBe(20 + computePracticeOnlyXp(30))
    })

    it('applies speed-run penalty to practice bonus only', () => {
      const normal = computeQuestNodeXp(100, { practiceMinutes: 10, isSpeedRun: false })
      const speed = computeQuestNodeXp(100, { practiceMinutes: 10, isSpeedRun: true })
      expect(speed).toBeLessThan(normal)
      expect(speed).toBe(20 + computePracticeBonusXp(10, { isSpeedRun: true }))
    })

    it('computeSkillXpFromQuest aliases node XP', () => {
      expect(computeSkillXpFromQuest(100)).toBe(computeQuestNodeXp(100))
    })

    it('node XP scales with quest XP', () => {
      expect(computeQuestNodeXp(500)).toBeGreaterThan(computeQuestNodeXp(50))
    })
  })

  describe('computePracticeOnlyXp', () => {
    it('converts minutes to XP', () => {
      expect(computePracticeOnlyXp(10)).toBe(15)
    })

    it('returns zero for non-positive minutes', () => {
      expect(computePracticeOnlyXp(0)).toBe(0)
    })

    it('returns 5 for 1 minute', () => {
      expect(computePracticeOnlyXp(1)).toBe(5)
    })
  })

  describe('computePracticeBonusXp', () => {
    it('returns zero for non-positive minutes', () => {
      expect(computePracticeBonusXp(0)).toBe(0)
      expect(computePracticeBonusXp(-5)).toBe(0)
    })

    it('never drops speed-run bonus below 5 when minutes are positive', () => {
      expect(computePracticeBonusXp(1, { isSpeedRun: true })).toBeGreaterThanOrEqual(5)
    })
  })

  describe('expectedMaxXpAtNodeLevel', () => {
    it('returns NODE_XP_BASE at level 0', () => {
      expect(expectedMaxXpAtNodeLevel(0)).toBe(NODE_XP_BASE)
    })

    it('increases by NODE_XP_MULT per level', () => {
      const l0 = expectedMaxXpAtNodeLevel(0)
      const l1 = expectedMaxXpAtNodeLevel(1)
      expect(l1).toBeGreaterThan(l0)
    })

    it('level 10 is substantially larger than level 0', () => {
      const l0 = expectedMaxXpAtNodeLevel(0)
      const l10 = expectedMaxXpAtNodeLevel(10)
      expect(l10).toBeGreaterThan(l0 * 3)
    })
  })
})
