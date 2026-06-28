import type { Quest } from '@/store/models'
import { useI18n } from '@/i18n'
import { usePersonalizedQuestMinutes } from '@/utils/usePersonalizedQuestMinutes'
import { useLastQuestCompletionMinutes } from '@/utils/useLastQuestCompletionMinutes'
import { formatQuestMinutesLabel, formatQuestMinutesSubLabel } from '@/utils/questTimeDisplay'

type QuestTimeMetaProps = {
  quest: Pick<Quest, 'id' | 'estimatedTime' | 'category' | 'difficulty'>
  className?: string
}

export default function QuestTimeMeta({ quest, className }: QuestTimeMetaProps) {
  const { t } = useI18n()
  const personalized = usePersonalizedQuestMinutes(quest)
  const lastCompletionMinutes = useLastQuestCompletionMinutes(quest.id)
  const sub = formatQuestMinutesSubLabel(
    personalized,
    t.quests.typicalTimeLabel ?? 'Typical',
    t.common.minutes,
  )
  const lastLabel = t.quests.lastCompletionTimeLabel ?? 'Last'
  return (
    <span className={className} title={sub ?? undefined}>
      ⏱ {formatQuestMinutesLabel(personalized, t.common.minutes)}
      {sub ? (
        <span className="text-[var(--text-muted)] text-xs ml-1">({sub})</span>
      ) : null}
      {lastCompletionMinutes != null ? (
        <span className="text-[var(--text-muted)] text-xs ml-1">
          · {lastLabel} {lastCompletionMinutes} {t.common.minutes}
        </span>
      ) : null}
    </span>
  )
}
