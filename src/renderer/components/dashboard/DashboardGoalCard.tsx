import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Link } from 'react-router'
import { useI18n } from '@/i18n'
import { fmt } from '@/i18n/dashboardCopy'
import { useUIStore } from '@/store/useUIStore'
import { playSound, playUiClick } from '@/utils/sound'
import { Box } from '@/components/tags'

export default function DashboardGoalCard() {
  const { t } = useI18n()
  const { activeGoal, completedGoals, setActiveGoal, completeActiveGoal, reduceMotion } = useUIStore(
    useShallow((s) => ({
      activeGoal: s.activeGoal,
      completedGoals: s.completedGoals,
      setActiveGoal: s.setActiveGoal,
      completeActiveGoal: s.completeActiveGoal,
      reduceMotion: s.settings.reduceMotion,
    })),
  )

  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    if (activeGoal && !editing) {
      setDraft(activeGoal.text)
    }
    if (!activeGoal) {
      setDraft('')
      setEditing(true)
    }
  }, [activeGoal, editing])

  const handleSave = () => {
    playUiClick()
    setActiveGoal(draft)
    setEditing(false)
  }

  const handleComplete = () => {
    playSound('achievement')
    useUIStore.getState().triggerPortraitCelebrate()
    if (!reduceMotion) setCelebrating(true)
    completeActiveGoal()
    setDraft('')
    setEditing(true)
    if (!reduceMotion) {
      window.setTimeout(() => setCelebrating(false), 650)
    }
  }

  const showForm = !activeGoal || editing

  return (
    <section
      className={`card-fantasy border border-[var(--accent)]/25 mb-4${celebrating ? ' goal-complete-burst' : ''}`}
      aria-labelledby="dashboard-goal-title"
      data-onboarding="dashboard-goals"
    >
      <Box className="mb-3">
        <h2 id="dashboard-goal-title" className="heading-2 text-sm mb-1">
          {t.dashboard.goalTitle ?? 'Goal'}
        </h2>
        <p className="text-xs text-[var(--text-muted)]">{t.dashboard.goalHint}</p>
        {completedGoals.length > 0 ? (
          <Link
            to="/progress/goals"
            className="text-xs text-[var(--accent-hover)] underline mt-1 inline-block"
            data-onboarding="dashboard-goals-history"
          >
            {fmt(t.dashboard.goalsHistoryLink ?? 'View {count} completed goals →', {
              count: completedGoals.length,
            })}
          </Link>
        ) : null}
      </Box>

      {showForm ? (
        <div className="space-y-3">
          <label htmlFor="dashboard-goal-input" className="sr-only">
            {t.dashboard.goalTitle ?? 'Goal'}
          </label>
          <textarea
            id="dashboard-goal-input"
            className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm w-full min-h-[4.5rem] resize-y"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              activeGoal
                ? t.dashboard.goalPlaceholder
                : t.dashboard.goalNewPlaceholder ?? t.dashboard.goalPlaceholder
            }
            maxLength={500}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary text-sm py-2 px-4"
              onClick={handleSave}
              disabled={!draft.trim()}
            >
              {t.dashboard.goalSave ?? t.common.save}
            </button>
            {activeGoal && editing && (
              <button
                type="button"
                className="btn-secondary text-sm py-2 px-4"
                onClick={() => {
                  playUiClick()
                  setDraft(activeGoal.text)
                  setEditing(false)
                }}
              >
                {t.common.cancel}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-fantasy text-base font-medium leading-relaxed whitespace-pre-wrap">
            {activeGoal?.text}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn-primary text-sm py-2 px-4${celebrating ? ' goal-complete-btn-flash' : ''}`}
              onClick={handleComplete}
            >
              {t.dashboard.goalComplete}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm py-2 px-4"
              onClick={() => {
                playUiClick()
                setEditing(true)
              }}
            >
              {t.dashboard.goalEdit}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
