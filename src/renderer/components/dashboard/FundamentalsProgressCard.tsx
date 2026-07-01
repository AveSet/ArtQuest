import { Link } from 'react-router'
import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'
import {
  getNextFundamentalsExercise,
  getFundamentalsCompletedCount,
  isFundamentalsGateCleared,
  shouldGateDailiesForBeginner,
  type FundamentalsProgress,
} from '@/utils/fundamentalsProgress'
import { FUNDAMENTALS_EXERCISE_COUNT } from '@/data/fundamentalsExercises'
import type { ExperienceTier } from '@/utils/experienceTier'
import { resolveQuestTitle } from '@/utils/questDisplay'
import { playUiClick } from '@/utils/sound'
import { buildQuestDetailNavState } from '@/utils/resolveQuestById'
import { fmt } from '@/i18n/dashboardCopy'

type Props = {
  experienceTier: ExperienceTier
  fundamentalsProgress: FundamentalsProgress
}

export default function FundamentalsProgressCard({ experienceTier, fundamentalsProgress }: Props) {
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const next = getNextFundamentalsExercise(fundamentalsProgress)
  const gateCleared = isFundamentalsGateCleared(fundamentalsProgress)
  const gateActive = shouldGateDailiesForBeginner(experienceTier, fundamentalsProgress)
  const doneCount = getFundamentalsCompletedCount(fundamentalsProgress)
  const progressLabel = fmt(t.fundamentals?.progressHint ?? '{done}/{total} exercises completed', {
    done: doneCount,
    total: FUNDAMENTALS_EXERCISE_COUNT,
  })
  const hasStarted =
    gateCleared ||
    Object.values(fundamentalsProgress.trackPhaseDone).some((n) => (n ?? 0) > 0) ||
    fundamentalsProgress.completedIds.length > 0

  if (!next && !hasStarted) return null

  const handleContinue = () => {
    if (!next) return
    playUiClick()
    navigate(`/quests/${next.id}`, {
      state: buildQuestDetailNavState(next.id, { autoStart: true }),
    })
  }

  return (
    <div className="card-fantasy mb-4 border-l-4 border-[var(--accent)]">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h2 className="heading-2 text-lg">{t.fundamentals?.title ?? 'Fundamentals'}</h2>
        <Link
          to="/fundamentals"
          className="text-sm text-[var(--accent-hover)] font-medium"
          onClick={() => playUiClick()}
        >
          {t.fundamentals?.viewAll ?? 'View all'}
        </Link>
      </div>

      <p className="text-sm text-[var(--text-muted)] mb-2" aria-live="polite">
        {progressLabel}
      </p>

      {gateActive && !gateCleared && (
        <p className="text-xs text-[var(--status-warning-text)] mb-3 px-2.5 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
          {t.fundamentals?.gateHint ??
            'Complete one fundamentals exercise to unlock daily quests.'}
        </p>
      )}

      {gateActive && gateCleared && (
        <p className="text-xs text-[var(--status-success-text)] mb-3 px-2.5 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
          {t.fundamentals?.gateUnlocked ?? 'Daily quests unlocked — keep going through the full path!'}
        </p>
      )}

      {next ? (
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)] p-3">
          <p className="text-xs text-[var(--text-muted)] mb-1">{t.fundamentals?.upNext ?? 'Up next'}</p>
          <p className="font-medium text-[var(--text-primary)]">
            {resolveQuestTitle(next, language)}
          </p>
          <button type="button" className="btn-primary w-full mt-3 py-2" onClick={handleContinue}>
            {hasStarted
              ? (t.fundamentals?.continueCta ?? 'Continue fundamentals')
              : (t.fundamentals?.startCta ?? 'Start fundamentals')}
          </button>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          {t.fundamentals?.pathComplete ?? 'You completed all fundamentals exercises!'}
        </p>
      )}
    </div>
  )
}
