import type { Skill, SkillNode } from '@/store/models'
import { ALL_CATEGORIES } from '@/data/skillTree'
import { effectiveNodeLevel } from '@/utils/skillUnlocks'

/**
 * Player level = sum of legacy sidebar skill levels (one bar per category).
 * Falls back to sum of peak effective node level per category when legacy data is absent.
 */
export function computePlayerLevel(skillNodes: SkillNode[], legacySkills?: Skill[]): number {
  if (legacySkills && legacySkills.length > 0) {
    return legacySkills.reduce((sum, s) => sum + s.level, 0)
  }
  let total = 0
  for (const cat of ALL_CATEGORIES) {
    const nodes = skillNodes.filter((n) => n.category === cat)
    if (nodes.length === 0) continue
    total += Math.max(...nodes.map((n) => effectiveNodeLevel(n)))
  }
  return total
}

export type PlayerRankKey = 'novice' | 'apprentice' | 'journeyman' | 'master' | 'legend'

export function getPlayerRankKey(level: number): PlayerRankKey {
  if (level >= 21) return 'legend'
  if (level >= 13) return 'master'
  if (level >= 8) return 'journeyman'
  if (level >= 4) return 'apprentice'
  return 'novice'
}
