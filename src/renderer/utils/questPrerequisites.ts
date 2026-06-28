import type { Quest, QuestCompletionLog, QuestTitleOverrides } from '@/store/models'
import type { Language } from '@/i18n/languages'
import { resolveQuestTitle } from '@/utils/questDisplay'

export type QuestUnlockState = {
  unlocked: boolean
  missingPrerequisiteIds: number[]
}

/** Quest ids satisfied at least once (any completion in logs). */
export function getSatisfiedQuestIds(logs: QuestCompletionLog[]): Set<number> {
  const ids = new Set<number>()
  for (const log of logs) {
    if (log.status !== 'timeout') ids.add(log.questId)
  }
  return ids
}

/** Quest is available when every prerequisite is in completedQuests or satisfiedOnceIds. */
export function getQuestUnlockState(
  quest: Pick<Quest, 'id' | 'prerequisites' | 'is_repeatable'>,
  completedQuests: number[],
  satisfiedOnceIds?: Iterable<number>,
): QuestUnlockState {
  const done = new Set(completedQuests)
  if (satisfiedOnceIds) {
    for (const id of satisfiedOnceIds) done.add(id)
  }
  const missing = quest.prerequisites.filter((pid) => !done.has(pid))
  return {
    unlocked: missing.length === 0,
    missingPrerequisiteIds: missing,
  }
}

/** Non-repeatable quests stay completed; repeatable quests can always be started again. */
export function isQuestPermanentlyCompleted(
  quest: Pick<Quest, 'id' | 'is_repeatable'>,
  completedQuests: number[],
): boolean {
  return !quest.is_repeatable && completedQuests.includes(quest.id)
}

export function resolvePrerequisiteTitles(
  missingIds: number[],
  quests: Quest[],
  language: Language,
  titleOverrides?: QuestTitleOverrides,
): string[] {
  const byId = new Map(quests.map((q) => [q.id, q]))
  return missingIds
    .map((id) => {
      const q = byId.get(id)
      if (!q) return `#${id}`
      return resolveQuestTitle(q, language, titleOverrides)
    })
    .filter(Boolean)
}
