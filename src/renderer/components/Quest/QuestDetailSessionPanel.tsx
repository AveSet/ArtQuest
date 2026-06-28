import { memo, useEffect } from 'react'
import {
  formatOvertimeElapsed,
  formatSessionRemaining,
  sessionHasPhases,
  sessionInOvertime,
  useQuestSessionStore,
} from '@/store/useQuestSessionStore'
import QuestSplitTimer from '@/components/QuestSplitTimer'
import QuestPhaseFocus from '@/components/Quest/QuestPhaseFocus'

type QuestDetailSessionPanelProps = {
  questId: number
  displayMinutes: number
  timerExpired: boolean
  onTimerExpired: () => void
  overtimeHint: string
  overtimeXpNote?: string
  timerExpiredLabel: string
  timerExpiredCta: string
  showSubmitModal: boolean
  onOpenFinishFlow: () => void
}

function QuestDetailSessionPanel({
  questId,
  displayMinutes,
  timerExpired,
  onTimerExpired,
  overtimeHint,
  overtimeXpNote,
  timerExpiredLabel,
  timerExpiredCta,
  showSubmitModal,
  onOpenFinishFlow,
}: QuestDetailSessionPanelProps) {
  const session = useQuestSessionStore((s) => (s.session?.questId === questId ? s.session : null))
  const sessionExpired = session?.isExpired ?? false

  useEffect(() => {
    if (sessionExpired && !timerExpired) {
      onTimerExpired()
    }
  }, [sessionExpired, timerExpired, onTimerExpired])

  if (!session) {
    return (
      <div className="text-5xl sm:text-6xl font-mono font-bold text-[var(--accent-hover)]">
        {formatSessionRemaining(displayMinutes * 60)}
      </div>
    )
  }

  const inOvertime = sessionInOvertime(session)

  return (
    <>
      <div className="mb-4 flex justify-center">
        {sessionHasPhases(session) ? (
          <QuestPhaseFocus session={session} />
        ) : (
          <div className="text-center">
            <QuestSplitTimer session={session} size="lg" />
          </div>
        )}
      </div>
      {timerExpired ? (
        <div className="mb-4 space-y-3 max-w-md mx-auto" role="status">
          <p className="text-sm font-medium text-[var(--status-warning-text)] px-4 py-2 rounded-lg bg-[var(--gold-primary)]/15 border border-[var(--gold-dark)]/40 timer-expired-banner">
            {timerExpiredLabel}
          </p>
          {inOvertime ? (
            <p className="text-sm text-center text-[var(--text-secondary)]">
              {overtimeHint.replace('{time}', formatOvertimeElapsed(session.overtimeElapsedSec ?? 0))}
            </p>
          ) : null}
          {overtimeXpNote ? (
            <p className="text-xs text-center text-[var(--text-muted)] px-2">{overtimeXpNote}</p>
          ) : null}
          {!showSubmitModal && inOvertime ? (
            <button
              type="button"
              onClick={onOpenFinishFlow}
              className="btn-primary btn-session-primary text-base py-2 px-6 w-full"
            >
              📤 {timerExpiredCta}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

export default memo(QuestDetailSessionPanel)
