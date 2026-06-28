import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { computePracticeOnlyXp } from '@/utils/progressionBalance'
import { playSound } from '@/utils/sound'
import { useXpFloatStore } from '@/store/xpFloatStore'
import { runPostPracticeAchievementChecks } from '@/utils/postPracticeAchievements'

export type FinishSkillPracticeResult = {
  nodeId: string
  category: import('@/data/skillTree').QuestCategory
  xp: number
  elapsedSec: number
} | null

/** Awards practice XP from activeElapsedSec and clears the practice session. */
export function finishSkillPracticeSession(): FinishSkillPracticeResult {
  const practice = useSkillPracticeStore.getState().session
  if (!practice) return null

  const node = useSkillStore.getState().skillNodes.find((n) => n.id === practice.nodeId)
  if (!node) return null

  const elapsedSec = practice.activeElapsedSec
  if (elapsedSec < 1) {
    useSkillPracticeStore.getState().clearSession()
    return null
  }

  const minutes = elapsedSec / 60
  const xp = computePracticeOnlyXp(minutes)
  useSkillStore.getState().addNodeXP(practice.nodeId, xp)
  useQuestStore.setState({
    lastCompletionReward: {
      questXp: 0,
      skillXp: xp,
      category: practice.category,
    },
  })
  if (xp > 0) useXpFloatStore.getState().push(xp)
  void useUIStore.getState().saveProgress()
  playSound('complete', practice.category)
  useSkillPracticeStore.getState().clearSession()

  runPostPracticeAchievementChecks()

  return { nodeId: practice.nodeId, category: practice.category, xp, elapsedSec }
}
