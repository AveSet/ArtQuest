import { useMemo } from 'react'
import { useQuestStore } from '@/store/useQuestStore'
import { getWeakestCriterionThisWeek } from '@/utils/feedbackAnalytics'
import { collectLearningFocusTags } from '@/utils/learningFocus'

/** Lightweight focus-tag selector for screens that do not need the full next-best-action stack. */
export function useLearningFocusTags(): string[] {
  const questCompletionLogs = useQuestStore((s) => s.questCompletionLogs)
  const completedWorks = useQuestStore((s) => s.completedWorks)

  const weakestCriterion = useMemo(
    () => getWeakestCriterionThisWeek(questCompletionLogs),
    [questCompletionLogs],
  )

  return useMemo(
    () =>
      collectLearningFocusTags({
        questCompletionLogs,
        completedWorks,
        weakCriterion: weakestCriterion?.criterion,
      }),
    [questCompletionLogs, completedWorks, weakestCriterion],
  )
}
