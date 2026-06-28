import type { Quest } from '@/store/models'
import type { Language } from '@/i18n/translations'
import type { FundamentalsExercise } from '@/data/fundamentalsExercises'
import { buildQuestPhasePlanRows, sumPhasePlanMinutes } from '@/utils/questPhaseKeys'
import FundamentalsBookPages from '@/components/Quest/FundamentalsBookPages'

type Props = {
  quest: Quest
  lang: Language
  fundamentalsExercise?: FundamentalsExercise
  fundamentalsSteps?: string[]
  minutesLabel: string
  sessionPlanTitle: string
  sessionPlanHint?: string
  totalPhasesLabel?: string
}

function fundamentalsPhaseIndexFromKey(key: string): number | undefined {
  const match = /^f(\d+)$/.exec(key)
  return match ? Number(match[1]) : undefined
}

export default function SessionPhasePlanPreview({
  quest,
  lang,
  fundamentalsExercise,
  fundamentalsSteps,
  minutesLabel,
  sessionPlanTitle,
  sessionPlanHint,
  totalPhasesLabel,
}: Props) {
  const rows = buildQuestPhasePlanRows(quest, lang, { fundamentalsExercise, fundamentalsSteps })
  if (rows.length === 0) return null

  const totalMinutes = sumPhasePlanMinutes(rows)
  const showTotal = rows.length > 1
  const showPhaseReferences = Boolean(fundamentalsExercise?.trackPhases?.length)

  return (
    <div className="micro-challenge-preview-block mb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] m-0">
          {sessionPlanTitle}
        </p>
        {showTotal ? (
          <p className="text-xs text-[var(--text-muted)] m-0">
            {totalPhasesLabel
              ? totalPhasesLabel.replace('{count}', String(rows.length)).replace('{minutes}', String(totalMinutes))
              : `${rows.length} · ${totalMinutes} ${minutesLabel}`}
          </p>
        ) : null}
      </div>
      {sessionPlanHint ? (
        <p className="text-xs text-[var(--text-muted)] mb-2">{sessionPlanHint}</p>
      ) : null}
      <ol className="micro-challenge-preview list-none m-0 p-0 space-y-2">
        {rows.map((row, index) => {
          const phaseIndex = showPhaseReferences ? fundamentalsPhaseIndexFromKey(row.key) : undefined
          return (
            <li
              key={row.key}
              className="micro-challenge-preview__row rounded-md border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/60 px-2 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="micro-challenge-preview__num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] font-semibold text-[var(--text-secondary)]"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="micro-challenge-preview__text flex-1 min-w-0 text-[var(--text-primary)] leading-snug">
                  {row.label}
                </span>
                <span className="micro-challenge-preview__meta shrink-0 text-[var(--text-muted)] whitespace-nowrap">
                  {row.minutes} {minutesLabel}
                </span>
              </div>
              {phaseIndex != null && fundamentalsExercise ? (
                <FundamentalsBookPages
                  exercise={fundamentalsExercise}
                  phaseIndex={phaseIndex}
                  compact
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
