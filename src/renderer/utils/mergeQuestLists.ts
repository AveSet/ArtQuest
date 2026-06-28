import type { Quest } from '@/store/models'

/** Catalog first, then user quests; user id wins on collision. Omits deleted quest ids. */
export function mergeQuestLists(
  catalog: Quest[],
  userQuests: Quest[],
  deletedQuestIds: readonly number[] = [],
): Quest[] {
  const deleted = new Set(deletedQuestIds)
  const userIds = new Set(userQuests.map((q) => q.id))
  const base = catalog.filter((q) => !userIds.has(q.id) && !deleted.has(q.id))
  return [...base, ...userQuests.filter((q) => !deleted.has(q.id))]
}
