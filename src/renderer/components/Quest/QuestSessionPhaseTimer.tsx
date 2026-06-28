import {
  formatSessionRemaining,
  sessionInOvertime,
  type QuestSession,
} from '@/store/useQuestSessionStore'
import { getCurrentPhaseLabel, getPhaseTimerSec } from '@/utils/sessionPhaseDisplay'
import { useI18n } from '@/i18n'
import { useQuestStore } from '@/store/useQuestStore'
import { resolveQuestById } from '@/utils/resolveQuestById'

const LOW_TIME_SEC = 60

type QuestSessionPhaseTimerProps = {
  session: QuestSession
  size?: 'sm' | 'lg'
  layout?: 'stack' | 'horizontal'
  showPhaseMeta?: boolean
  framedLabel?: boolean
  className?: string
}

function buildTimerStateClasses(session: QuestSession, timerSec: number, inPhases: boolean): string {
  const classes: string[] = []
  if (session.isExpired || sessionInOvertime(session)) {
    classes.push('quest-phase-timer--overtime')
  }
  if (session.phasesComplete) {
    classes.push('quest-phase-timer--phase-complete')
  }
  const lowTime = inPhases ? timerSec <= LOW_TIME_SEC : session.remainingSec <= LOW_TIME_SEC
  if (lowTime && !session.isExpired) {
    classes.push('quest-phase-timer--low-time')
  }
  return classes.join(' ')
}

export default function QuestSessionPhaseTimer({
  session,
  size = 'lg',
  layout = 'stack',
  showPhaseMeta = true,
  framedLabel = false,
  className = '',
}: QuestSessionPhaseTimerProps) {
  const { t, language } = useI18n()
  const lang = language
  const quests = useQuestStore((s) => s.quests)
  const quest = resolveQuestById(session.questId, quests)
  const label = getCurrentPhaseLabel(session, quest, lang, t.quests.referencePhaseLabel)
  const timerSec = getPhaseTimerSec(session)
  const inPhases = session.phases.length > 0 && !session.phasesComplete
  const sizeClass = size === 'lg' ? 'quest-phase-timer--lg' : 'quest-phase-timer--sm'
  const layoutClass = layout === 'horizontal' ? 'quest-phase-timer--horizontal' : ''
  const stateClass = buildTimerStateClasses(session, timerSec, inPhases)

  const labelNode =
    showPhaseMeta && label ? (
      framedLabel && size === 'lg' ? (
        <div className="quest-phase-frame">
          <p className="quest-phase-frame__label">{label}</p>
        </div>
      ) : (
        <p className="quest-phase-timer__label" title={label}>
          {label}
        </p>
      )
    ) : null

  if (!inPhases) {
    return (
      <div
        className={`quest-phase-timer ${sizeClass} ${layoutClass} ${stateClass} ${className}`.trim()}
        aria-live="polite"
      >
        <p className="quest-phase-timer__clock font-mono font-bold text-[var(--accent-hover)]">
          {formatSessionRemaining(timerSec)}
        </p>
      </div>
    )
  }

  return (
    <div
      className={`quest-phase-timer ${sizeClass} ${layoutClass} ${stateClass} ${className}`.trim()}
      aria-live="polite"
    >
      {labelNode}
      <p className="quest-phase-timer__clock font-mono font-bold text-[var(--accent-hover)]">
        {formatSessionRemaining(timerSec)}
      </p>
      {showPhaseMeta && size === 'lg' && layout === 'stack' && (
        <p className="quest-phase-timer__total text-xs text-[var(--text-muted)]">
          {t.quests.sessionTotalRemaining}: {formatSessionRemaining(session.remainingSec)}
        </p>
      )}
    </div>
  )
}
