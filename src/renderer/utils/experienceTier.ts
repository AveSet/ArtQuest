import type { Skill, SkillNode } from '@/store/models'
import { NODE_ROWS, applyPrerequisiteUnlocks } from '@/utils/skillUnlocks'
import { computeInitialNodeMaxXp } from '@/utils/progressionBalance'
import { createInitialSkillNodes, useSkillStore } from '@/store/useSkillStore'

export type ExperienceTier = 'beginner' | 'intermediate' | 'advanced'

/** Highest skill-tree row unlocked per tier (0 = fundamentals, 3 = top row). */
export function maxUnlockedRowForTier(tier: ExperienceTier): number {
  if (tier === 'intermediate') return 2
  if (tier === 'advanced') return 3
  return 0
}

/** Minimum average level used for quest difficulty gating. */
export const TIER_MIN_AVG_LEVEL: Record<ExperienceTier, number> = {
  beginner: 1,
  intermediate: 4,
  advanced: 7,
}

/** Legacy sidebar skill bars shown on the dashboard. */
const TIER_LEGACY_LEVEL: Record<ExperienceTier, number> = {
  beginner: 0,
  intermediate: 3,
  advanced: 4,
}

export function fundamentalLevelForTier(tier: ExperienceTier): number {
  return TIER_LEGACY_LEVEL[tier]
}

export function minAvgLevelForTier(tier: ExperienceTier): number {
  return TIER_MIN_AVG_LEVEL[tier]
}

function baselineSkillNode(node: SkillNode): SkillNode {
  return {
    ...node,
    level: 0,
    xp: 0,
    prestige: 0,
    maxXp: computeInitialNodeMaxXp(node.order),
    lastReviewDate: null,
    isUnlocked: false,
  }
}

export function applyExperienceTierToSkillNodes(
  nodes: SkillNode[],
  tier: ExperienceTier,
): SkillNode[] {
  const maxRow = maxUnlockedRowForTier(tier)
  const baselined = nodes.map(baselineSkillNode)
  const withPrereqs = applyPrerequisiteUnlocks(baselined)

  if (maxRow === 0) return withPrereqs

  return withPrereqs.map((node) => {
    const row = NODE_ROWS[node.id] ?? 0
    if (row <= maxRow) {
      return { ...node, isUnlocked: true }
    }
    return { ...node, isUnlocked: false }
  })
}

export function syncLegacySkillsForTier(legacySkills: Skill[], tier: ExperienceTier): Skill[] {
  const targetLevel = TIER_LEGACY_LEVEL[tier]
  return legacySkills.map((s) => ({
    ...s,
    level: targetLevel,
    xp: 0,
  }))
}

export function applyExperienceTierToStores(tier: ExperienceTier): void {
  const { legacySkills } = useSkillStore.getState()
  useSkillStore.setState({
    skillNodes: applyExperienceTierToSkillNodes(createInitialSkillNodes(), tier),
    legacySkills: syncLegacySkillsForTier(legacySkills, tier),
  })
}
