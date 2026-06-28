import { splitSessionRemaining, formatSessionRemaining, type QuestSession } from '@/store/useQuestSessionStore'
import { useI18n } from '@/i18n'

type QuestSplitTimerProps = {
  session: QuestSession
  size?: 'sm' | 'lg'
  className?: string
}

export default function QuestSplitTimer({ session, size = 'lg', className = '' }: QuestSplitTimerProps) {
  const { t } = useI18n()
  const { referenceSec, mainSec } = splitSessionRemaining(session)
  const sizeClass = size === 'lg' ? 'quest-split-timer--lg' : 'quest-split-timer--sm'
  const stateClasses = [
    mainSec <= 60 && !session.isExpired ? 'quest-split-timer--low-time' : '',
    session.isExpired ? 'quest-split-timer--overtime' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={`quest-split-timer ${sizeClass} ${stateClasses} ${className}`.trim()}
      aria-live="polite"
    >
      {session.referenceMinutes > 0 && referenceSec > 0 && (
        <span className="quest-split-timer__ref" title={t.quests.timerReferenceLabel}>
          {formatSessionRemaining(referenceSec)}
        </span>
      )}
      {session.referenceMinutes > 0 && referenceSec > 0 && (
        <span className="quest-split-timer__sep" aria-hidden="true">
          /
        </span>
      )}
      <span className="quest-split-timer__main" title={t.quests.timerMainLabel}>
        {formatSessionRemaining(mainSec)}
      </span>
    </div>
  )
}
