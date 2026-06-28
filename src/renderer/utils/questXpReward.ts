import { useSkillStore } from '@/store/useSkillStore'
import type { SkillNode } from '@/store/models'
import {
  computeQuestNodeXp,
  computeQuestTrackXp,
  type QuestXpBalanceOpts,
} from '@/utils/progressionBalance'

export type DistributeXpOpts = QuestXpBalanceOpts & {
  targetSkillNodeId?: string
  tags?: string[]
}

export function pickSkillNodeForCategory(
  skillNodes: SkillNode[],
  category: string,
  tags?: string[],
): SkillNode | undefined {
  const categoryNodes = skillNodes.filter((n) => n.category === category && n.isUnlocked)
  if (categoryNodes.length === 0) return undefined
  if (tags && tags.length > 0) {
    return categoryNodes.reduce((best, n) => {
      const score = tags.filter((t) => n.tags.includes(t)).length
      const bestScore = tags.filter((t) => best.tags.includes(t)).length
      return score > bestScore ? n : best
    })
  }
  return categoryNodes[0]
}

function resolveNodeId(
  skillNodes: SkillNode[],
  category: string,
  opts?: { targetSkillNodeId?: string; tags?: string[] },
): string | undefined {
  let nodeId = opts?.targetSkillNodeId
  if (nodeId) {
    const target = skillNodes.find((n) => n.id === nodeId)
    if (!target?.isUnlocked) nodeId = undefined
  }
  return nodeId ?? pickSkillNodeForCategory(skillNodes, category, opts?.tags)?.id
}

export function distributeQuestXp(
  questXp: number,
  category: string,
  opts?: DistributeXpOpts,
): { trackXp: number; nodeXp: number } {
  return distributePartialXp(questXp, category, opts)
}

/** Awards phase XP to the active skill node only (no category track). */
export function distributePhaseNodeXp(
  phaseXp: number,
  category: string,
  opts?: { targetSkillNodeId?: string; tags?: string[] },
): number {
  if (phaseXp <= 0) return 0
  const skill = useSkillStore.getState()
  const nodeId = resolveNodeId(skill.skillNodes, category, opts)
  if (nodeId) {
    skill.addNodeXP(nodeId, phaseXp)
  } else {
    skill.addLegacyCategoryXp(category, phaseXp)
  }
  return phaseXp
}

/** Unified XP split for quest completion and timeout practice (no phase XP). */
export function distributePartialXp(
  questXp: number,
  category: string,
  opts?: DistributeXpOpts,
): { trackXp: number; nodeXp: number } {
  const balanceOpts: QuestXpBalanceOpts = {
    practiceMinutes: opts?.practiceMinutes,
    estimatedTime: opts?.estimatedTime,
    isSpeedRun: opts?.isSpeedRun,
    isOvertime: opts?.isOvertime,
  }
  const trackXp = computeQuestTrackXp(questXp, balanceOpts)
  const nodeXp = computeQuestNodeXp(questXp, balanceOpts)
  const skill = useSkillStore.getState()

  if (trackXp > 0) {
    skill.addLegacyCategoryXp(category, trackXp)
  }
  if (nodeXp > 0) {
    const nodeId = resolveNodeId(skill.skillNodes, category, opts)
    if (nodeId) {
      skill.addNodeXP(nodeId, nodeXp)
    } else {
      skill.addLegacyCategoryXp(category, nodeXp)
    }
  }

  return { trackXp, nodeXp }
}
