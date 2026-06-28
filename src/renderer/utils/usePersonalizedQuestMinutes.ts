import { useMemo } from 'react'
import type { Quest } from '@/store/models'
import { useQuestStore } from '@/store/useQuestStore'
import {
  getPersonalizedQuestMinutes,
  type PersonalizedQuestMinutes,
} from '@/utils/questPersonalizedTime'

export function usePersonalizedQuestMinutes(
  quest: Pick<Quest, 'id' | 'estimatedTime' | 'category' | 'difficulty'> | null | undefined,
): PersonalizedQuestMinutes | null {
  const questCompletionLogs = useQuestStore((s) => s.questCompletionLogs)
  const catalogQuests = useQuestStore((s) => s.catalogQuests.length > 0 ? s.catalogQuests : s.quests)

  return useMemo(() => {
    if (!quest) return null
    return getPersonalizedQuestMinutes(quest, questCompletionLogs, catalogQuests)
  }, [quest, questCompletionLogs, catalogQuests])
}
