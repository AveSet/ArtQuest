import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'
import { useQuestStore } from '@/store/useQuestStore'
import {
  FUNDAMENTALS_EXERCISES,
  FUNDAMENTALS_TRACK_MEDIUM_ID,
  isFundamentalsAdvancedId,
  isFundamentalsNovicePartAId,
  isFundamentalsNovicePartBId,
  isFundamentalsTrackId,
  type BookTier,
  type FundamentalsExercise,
} from '@/data/fundamentalsExercises'
import {
  getFundamentalsTrackPhaseStartIndex,
  getNextFundamentalsExercise,
  getFundamentalsUnlockState,
  isMediumTrackComplete,
  isNovicePartAComplete,
  isNovicePartBComplete,
} from '@/utils/fundamentalsProgress'
import { resolveQuestTitle } from '@/utils/questDisplay'
import { playUiClick } from '@/utils/sound'
import { buildQuestDetailNavState } from '@/utils/resolveQuestById'
import FundamentalsBookPages from '@/components/Quest/FundamentalsBookPages'

const TIER_ORDER: BookTier[] = ['beginner', 'intermediate', 'advanced']

function tierExercises(tier: BookTier): FundamentalsExercise[] {
  return FUNDAMENTALS_EXERCISES.filter((ex) => ex.bookTier === tier)
}

export default function Fundamentals() {
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const fundamentalsProgress = useQuestStore((s) => s.fundamentalsProgress)
  const nextExercise = getNextFundamentalsExercise(fundamentalsProgress)
  const doneSet = new Set(fundamentalsProgress.completedIds)

  const tierLabel = (tier: BookTier): string => {
    const labels = t.fundamentals?.tiers
    if (tier === 'beginner') return labels?.beginner ?? 'Novice'
    if (tier === 'intermediate') return labels?.intermediate ?? 'Intermediate'
    return labels?.advanced ?? 'Advanced'
  }

  const openExercise = (id: number, autoStart: boolean) => {
    playUiClick()
    navigate(`/quests/${id}`, {
      state: buildQuestDetailNavState(id, autoStart ? { autoStart: true } : undefined),
    })
  }

  const trackPhaseProgress = (exercise: FundamentalsExercise): { done: number; total: number } => {
    if (!exercise.trackKind || !exercise.trackPhases) return { done: 0, total: 0 }
    const total = exercise.trackPhases.length
    if (isFundamentalsNovicePartAId(exercise.id) && isNovicePartAComplete(fundamentalsProgress)) {
      return { done: total, total }
    }
    if (isFundamentalsNovicePartBId(exercise.id) && isNovicePartBComplete(fundamentalsProgress)) {
      return { done: total, total }
    }
    if (exercise.id === FUNDAMENTALS_TRACK_MEDIUM_ID && isMediumTrackComplete(fundamentalsProgress)) {
      return { done: total, total }
    }
    const done = getFundamentalsTrackPhaseStartIndex(
      fundamentalsProgress,
      exercise.trackKind,
      exercise.id,
    )
    return { done, total }
  }

  return (
    <div className="container-fantasy max-w-2xl mx-auto py-4">
      <header className="mb-6">
        <h1 className="heading-fantasy text-2xl sm:text-3xl">{t.fundamentals?.title ?? 'Fundamentals'}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          {t.fundamentals?.pageIntro ??
            'Phased novice and intermediate tracks, plus advanced exercises — build line control, forms, and imagination.'}
        </p>
      </header>

      {nextExercise && (
        <button
          type="button"
          className="btn-primary w-full mb-6 py-3"
          onClick={() => openExercise(nextExercise.id, true)}
        >
          {(fundamentalsProgress.completedIds.length > 0 ||
            Object.values(fundamentalsProgress.trackPhaseDone).some((n) => (n ?? 0) > 0))
            ? (t.fundamentals?.continueCta ?? 'Continue fundamentals')
            : (t.fundamentals?.startCta ?? 'Start fundamentals')}
        </button>
      )}

      {TIER_ORDER.map((tier) => {
        const exercises = tierExercises(tier)
        if (exercises.length === 0) return null
        return (
          <section key={tier} className="mb-6">
            <h2 className="heading-2 text-lg mb-3">{tierLabel(tier)}</h2>
            <ol className="space-y-2">
              {exercises.map((exercise) => {
                const unlock = getFundamentalsUnlockState(exercise, fundamentalsProgress)
                const isDone = doneSet.has(exercise.id) || (
                  isFundamentalsTrackId(exercise.id) &&
                  ((isFundamentalsNovicePartAId(exercise.id) && isNovicePartAComplete(fundamentalsProgress)) ||
                    (isFundamentalsNovicePartBId(exercise.id) && isNovicePartBComplete(fundamentalsProgress)) ||
                    (exercise.id === FUNDAMENTALS_TRACK_MEDIUM_ID && isMediumTrackComplete(fundamentalsProgress)))
                )
                const isCurrent = nextExercise?.id === exercise.id
                const trackProgress = isFundamentalsTrackId(exercise.id)
                  ? trackPhaseProgress(exercise)
                  : null
                return (
                  <li
                    key={exercise.id}
                    className={`card-fantasy p-3 border ${
                      isCurrent
                        ? 'border-[var(--accent)]'
                        : 'border-[var(--border-secondary)]'
                    } ${!unlock.unlocked ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isDone
                            ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                            : isCurrent
                              ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                        }`}
                        aria-hidden
                      >
                        {isDone ? '✓' : exercise.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-[var(--text-primary)]">
                          {resolveQuestTitle(exercise, language)}
                        </h3>
                        {trackProgress && trackProgress.total > 0 && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {(t.fundamentals?.trackPhaseProgress ?? '{done}/{total} phases')
                              .replace('{done}', String(trackProgress.done))
                              .replace('{total}', String(trackProgress.total))}
                          </p>
                        )}
                        {isFundamentalsTrackId(exercise.id) && exercise.trackPhases && (
                          <ol className="mt-3 space-y-2">
                            {exercise.trackPhases.map((phase, phaseIdx) => {
                              const phaseDone = trackProgress ? phaseIdx < trackProgress.done : false
                              const phaseCurrent =
                                isCurrent && trackProgress?.done === phaseIdx
                              return (
                                <li
                                  key={phase.phaseIndex}
                                  className={`rounded-lg border px-2 py-2 ${
                                    phaseCurrent
                                      ? 'border-[var(--accent)] bg-[var(--accent-muted)]/20'
                                      : 'border-[var(--border-secondary)] bg-[var(--bg-secondary)]/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[var(--text-muted)] w-5">
                                      {phaseDone ? '✓' : phaseIdx + 1}
                                    </span>
                                    <span className="text-sm text-[var(--text-primary)]">
                                      {phase.title[language] ?? phase.title.en}
                                    </span>
                                  </div>
                                  <FundamentalsBookPages
                                    exercise={{ bookPages: phase.bookPages, trackPhases: exercise.trackPhases }}
                                    phaseIndex={phase.phaseIndex}
                                    compact
                                  />
                                </li>
                              )
                            })}
                          </ol>
                        )}
                        {isFundamentalsAdvancedId(exercise.id) && unlock.unlocked && (
                          <FundamentalsBookPages exercise={exercise} compact />
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {unlock.unlocked ? (
                            <button
                              type="button"
                              className="btn-secondary text-xs py-1 px-2"
                              onClick={() => openExercise(exercise.id, isCurrent)}
                            >
                              {isCurrent
                                ? (t.fundamentals?.startCurrent ?? 'Start')
                                : (t.common.details ?? 'Details')}
                            </button>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">
                              {t.fundamentals?.locked ?? 'Complete previous exercise first'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
