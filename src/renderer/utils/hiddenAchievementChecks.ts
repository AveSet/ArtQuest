import type { Achievement, Quest, QuestCompletionLog } from '@/store/models'
import { HIDDEN_ACHIEVEMENTS } from '@/store/models'

export type HiddenAchievementContext = {
  quests: Quest[]
  questCompletionLogs: QuestCompletionLog[]
  streakCurrent: number
  unlockedAchievementIds: Set<string>
}

/** Returns hidden achievements newly satisfied by quest logs / streak (no store writes). */
export function evaluateHiddenAchievementUnlocks(ctx: HiddenAchievementContext): Achievement[] {
  const parseCount = (parts: string[], idx: number): number => {
    const m = parts[idx]?.match(/count>=(\d+)/)
    return m?.[1] ? parseInt(m[1], 10) : 1
  }

  const conditionCheckers: Record<string, (parts: string[]) => boolean> = {
    complete_quest_tag: (parts) => {
      const head = parts[0]
      if (!head) return false
      const tag = head.slice('complete_quest_tag:'.length)
      const required = parseCount(parts, 1)
      const actual = ctx.questCompletionLogs.filter((log) => {
        const q = ctx.quests.find((quest) => quest.id === log.questId)
        return q ? q.tags.includes(tag) : false
      }).length
      return actual >= required
    },
    complete_quest: (parts) => {
      const hourExpr = parts[1] ?? ''
      const isLess = hourExpr.includes('<')
      const hourMatch = hourExpr.match(/>=(\d+)/) ?? hourExpr.match(/<(\d+)/)
      const hour = hourMatch?.[1] ? parseInt(hourMatch[1], 10) : 0
      const required = parseCount(parts, 2)
      const matching = ctx.questCompletionLogs.filter((log) => {
        const logHour = new Date(log.completedAt).getHours()
        return isLess ? logHour < hour : logHour >= hour
      })
      return matching.length >= required
    },
    streak_current: (parts) => {
      const head = parts[0] ?? ''
      const m = head.match(/>=(\d+)/) || parts[1]?.match(/>=(\d+)/)
      const required = m?.[1] ? parseInt(m[1], 10) : 1
      return ctx.streakCurrent >= required
    },
  }

  const unlocked: Achievement[] = []

  for (const hidden of HIDDEN_ACHIEVEMENTS) {
    if (ctx.unlockedAchievementIds.has(hidden.id)) continue

    const parts = hidden.condition.split(' ')
    const typeKey = parts[0]
    if (!typeKey) continue
    const checkerKey = typeKey.includes(':')
      ? (typeKey.split(':')[0] ?? typeKey)
      : typeKey.startsWith('streak_current')
        ? 'streak_current'
        : typeKey.startsWith('complete_quest_tag')
          ? 'complete_quest_tag'
          : typeKey.startsWith('complete_quest')
            ? 'complete_quest'
            : typeKey
    const checker = conditionCheckers[checkerKey]
    if (!checker || !checker(parts)) continue

    unlocked.push({
      id: hidden.id,
      title: hidden.reward.title,
      description: hidden.reward.description,
      icon: hidden.reward.icon,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    })
  }

  return unlocked
}
