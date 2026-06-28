import { useMemo } from 'react'
import { useQuestStore } from '@/store/useQuestStore'
import { getLastQuestCompletionMinutes } from '@/utils/questPersonalizedTime'

export function useLastQuestCompletionMinutes(questId: number | null | undefined): number | null {
  const questCompletionLogs = useQuestStore((s) => s.questCompletionLogs)

  return useMemo(() => {
    if (questId == null) return null
    return getLastQuestCompletionMinutes(questId, questCompletionLogs)
  }, [questId, questCompletionLogs])
}
