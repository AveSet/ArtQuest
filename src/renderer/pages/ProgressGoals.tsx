import { useMemo } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import { formatLocalizedDate } from '@/utils/dateLocale'
import EmptyState from '@/components/ui/EmptyState'

const ProgressGoals = () => {
  const { t, language } = useI18n()
  const completedGoals = useUIStore((s) => s.completedGoals)

  const sortedGoals = useMemo(
    () =>
      [...completedGoals].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      ),
    [completedGoals],
  )

  const formatDate = (iso: string) =>
    formatLocalizedDate(iso, language, { year: 'numeric', month: 'short', day: 'numeric' })

  if (sortedGoals.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title={t.progress.goalsEmpty}
      />
    )
  }

  return (
    <ul className="space-y-3" aria-label={t.progress.goals}>
        {sortedGoals.map((goal) => (
          <li key={goal.id} className="card-fantasy border border-[var(--gold-primary)]/20">
            <p className="text-fantasy font-medium leading-relaxed whitespace-pre-wrap mb-2">
              {goal.text}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
              <span>{t.progress.goalStartedOn.replace('{date}', formatDate(goal.createdAt))}</span>
              <span className="text-status-success font-medium">
                {t.progress.goalCompletedOn.replace('{date}', formatDate(goal.completedAt))}
              </span>
            </div>
          </li>
        ))}
      </ul>
  )
}

export default ProgressGoals
