import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '@/i18n'
import { getSessionRitual } from '@/i18n/sessionRitualCopy'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { buildReviewShelfItems } from '@/utils/reviewShelf'
import { resolveQuestTitle } from '@/utils/questDisplay'
import { getLocalDateStr } from '@/utils/dailyQuests'

export default function ReviewShelf() {
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const { quests, logs, overrides } = useQuestStore(
    useShallow((s) => ({
      quests: s.quests,
      logs: s.questCompletionLogs,
      overrides: s.questTitleOverrides,
    })),
  )
  const schedule = useUIStore((s) => s.questReviewSchedule)
  const today = getLocalDateStr()

  const items = useMemo(
    () =>
      buildReviewShelfItems(quests, logs, schedule, today, (q) =>
        resolveQuestTitle(q, language, overrides),
      ),
    [quests, logs, schedule, today, language, overrides],
  )

  if (items.length === 0) {
    const ritual = getSessionRitual(t)
    return (
      <section className="card-fantasy p-4 review-shelf review-shelf--empty" aria-labelledby="review-shelf-title">
        <h2 id="review-shelf-title" className="heading-4 mb-2">
          {ritual.reviewShelfTitle}
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {t.dashboard.reviewShelfAllCaughtUp ?? 'All caught up — no quests due for review right now.'}
        </p>
      </section>
    )
  }

  const ritual = getSessionRitual(t)

  return (
    <section className="card-fantasy p-4 review-shelf" aria-labelledby="review-shelf-title">
      <h2 id="review-shelf-title" className="heading-4 mb-3">
        {ritual.reviewShelfTitle}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.questId}>
            <button
              type="button"
              className="w-full text-left rounded-lg px-3 py-2 bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] transition-colors"
              onClick={() => navigate(`/quests/${item.questId}`)}
            >
              <span className="font-medium text-sm block">{item.questTitle}</span>
              <span className="text-xs text-[var(--text-muted)]">
                {ritual.reviewOverdue.replace('{days}', String(item.daysOverdue))}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
