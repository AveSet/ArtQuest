import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useI18n, getCategoryLabel, getQuestDescription } from '@/i18n'
import { resolveQuestTitle } from '@/utils/questDisplay'
import type { Quest } from '@/store/models'
import type { QuestTitleOverrides } from '@/store/models'
import { countDailyQuestsCompleted } from '@/utils/dailyQuests'
import { buildQuestLearningHint } from '@/utils/questLearningHint'
import { pickBestDailyQuest } from '@/utils/learningFocus'
import { playUiClick } from '@/utils/sound'
import type { QuestCategory } from '@/data/skillTree'
import QuestTimeMeta from '@/components/QuestTimeMeta'

type Props = {
  dailyQuests: Quest[]
  completedToday: number[]
  questTitleOverrides: QuestTitleOverrides
  focusTags: string[]
  favoriteCategories: QuestCategory[]
  allDailyCompleted: boolean
  dailyPartialHint: string | null
  hasEmptyDailyRoster: boolean
  dailyQuestsEmptyHint?: string
  tomorrowCategories: string[]
  todayCompleteTitle: string
  todayCompleteBody: string
  tomorrowPreviewBody?: string
}

export default function DashboardDailyChecklist({
  dailyQuests,
  completedToday,
  questTitleOverrides,
  focusTags,
  favoriteCategories,
  allDailyCompleted,
  dailyPartialHint,
  hasEmptyDailyRoster,
  dailyQuestsEmptyHint,
  tomorrowCategories,
  todayCompleteTitle,
  todayCompleteBody,
  tomorrowPreviewBody,
}: Props) {
  const navigate = useNavigate()
  const { t, language } = useI18n()

  const incompleteDaily = dailyQuests.filter((q) => !completedToday.includes(q.id))
  const bestDaily = pickBestDailyQuest(incompleteDaily, focusTags, favoriteCategories)
  const dailyCompletedCount = useMemo(
    () => countDailyQuestsCompleted(dailyQuests.map((q) => q.id), completedToday),
    [dailyQuests, completedToday],
  )
  const dailyProgressPct =
    dailyQuests.length > 0 ? Math.min(100, (dailyCompletedCount / dailyQuests.length) * 100) : 0

  const prevDailyCountRef = useRef(dailyCompletedCount)
  const [dailyProgressCelebrate, setDailyProgressCelebrate] = useState(false)

  useEffect(() => {
    if (dailyCompletedCount > prevDailyCountRef.current) {
      setDailyProgressCelebrate(true)
      const id = window.setTimeout(() => setDailyProgressCelebrate(false), 650)
      prevDailyCountRef.current = dailyCompletedCount
      return () => window.clearTimeout(id)
    }
    prevDailyCountRef.current = dailyCompletedCount
  }, [dailyCompletedCount])

  const takeQuest = useCallback(
    (questId: number) => {
      playUiClick()
      navigate(`/quests/${questId}`)
    },
    [navigate],
  )

  return (
    <div id="dashboard-dailies" className="card-fantasy dashboard-daily-checklist" data-onboarding="dashboard-dailies">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="heading-2 text-lg mb-0">
          {t.dashboard.today ?? t.dashboard.dailyQuests}
        </h2>
        {dailyQuests.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {allDailyCompleted && (
              <span className="font-semibold chip-success px-2 py-0.5 rounded-md" role="status">
                {t.quests.dailyCompleted}
              </span>
            )}
            <span className="text-[var(--text-muted)]">
              {dailyCompletedCount}/{dailyQuests.length} {t.dashboard.completed}
            </span>
          </div>
        )}
      </div>

      {dailyPartialHint && (
        <p className="text-sm text-[var(--text-secondary)] mb-3 px-1" role="status">
          {dailyPartialHint}
        </p>
      )}

      {hasEmptyDailyRoster && dailyQuestsEmptyHint && (
        <p className="text-sm text-[var(--text-secondary)] mb-3 px-1" role="status">
          {dailyQuestsEmptyHint}
        </p>
      )}

      {dailyQuests.length > 0 && (
        <div className="daily-progress-track h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-3">
          <div
            className={`daily-progress-fill h-full transition-all${dailyProgressCelebrate ? ' daily-progress-fill--celebrate' : ''}`}
            style={{ width: `${dailyProgressPct}%`, backgroundColor: 'var(--progress-fill)' }}
          />
        </div>
      )}

      {dailyQuests.length > 0 && !allDailyCompleted && (
        <ul className="dashboard-daily-checklist__list space-y-3">
          {dailyQuests.map((quest) => {
            const isDone = completedToday.includes(quest.id)
            const isHighlighted = !isDone && bestDaily?.id === quest.id
            const desc = getQuestDescription(quest.description, language)
            const hint = buildQuestLearningHint(quest, language, desc, focusTags)
            return (
              <li
                key={quest.id}
                className={`dashboard-daily-checklist__item bg-[var(--bg-secondary)] p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'dashboard-daily-checklist__item--done border-[var(--border-secondary)] opacity-70'
                    : isHighlighted
                      ? 'border-[var(--accent)]/60'
                      : 'border-[var(--border-secondary)] hover:border-[var(--gold-dark)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`dashboard-daily-checklist__check shrink-0 mt-0.5 text-xs font-bold ${isDone ? 'text-[var(--status-success-text)]' : 'text-[var(--text-muted)]'}`}
                    aria-hidden
                  >
                    {isDone ? '✓' : '·'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className={`quest-card-title ${isDone ? 'line-through' : ''}`}>
                      {resolveQuestTitle(quest, language, questTitleOverrides)}
                    </h3>
                    {!isDone && (
                      <>
                        <div className="quest-card-meta">
                          <span className="bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
                            {getCategoryLabel(quest.category, language)}
                          </span>
                          <QuestTimeMeta quest={quest} />
                          <span className="xp-gold">⭐ {quest.xp} {t.common.xp}</span>
                        </div>
                        <p className="mt-2 text-xs text-[var(--stat-quests)] leading-snug" role="note">
                          {hint.line}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() => takeQuest(quest.id)}
                            className="btn-primary min-w-[8rem]"
                          >
                            {t.common.startQuest}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {allDailyCompleted && dailyQuests.length > 0 && (
        <div className="today-complete-panel" role="status">
          <h3 className="today-complete-panel__title">{todayCompleteTitle}</h3>
          <p className="today-complete-panel__body">{todayCompleteBody}</p>
          {tomorrowCategories.length > 0 && tomorrowPreviewBody && (
            <p className="today-complete-panel__tomorrow">
              {tomorrowPreviewBody.replace('{categories}', tomorrowCategories.join(', '))}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
