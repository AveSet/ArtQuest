import { useNavigate } from 'react-router'
import { useI18n, getCategoryLabel } from '@/i18n'
import { resolveQuestTitle } from '@/utils/questDisplay'
import type { NextBestAction } from '@/utils/nextBestAction'
import type { Quest } from '@/store/models'
import type { QuestTitleOverrides } from '@/store/models'
import { FUNDAMENTALS_EXERCISE_COUNT } from '@/data/fundamentalsExercises'
import { playUiClick } from '@/utils/sound'
import { buildQuestDetailNavState } from '@/utils/resolveQuestById'
import { fmt, getDashboardCopy } from '@/i18n/dashboardCopy'
import type { LearningPlanStep } from '@/utils/nextBestAction'
import QuestTimeMeta from '@/components/QuestTimeMeta'

type Props = {
  action: NextBestAction
  questTitleOverrides: QuestTitleOverrides
  onStartWarmup?: (questId: number) => void
  /** Daily quest list is shown below — hide duplicate plan steps. */
  dailyChecklistVisible?: boolean
  dailyDone?: number
  dailyTotal?: number
  /** Hide duplicate quest CTA — daily list below is the source of truth. */
  compactOnly?: boolean
  onShowDailies?: () => void
}

export default function NextBestActionCard({
  action,
  questTitleOverrides,
  onStartWarmup,
  dailyChecklistVisible = false,
  dailyDone = 0,
  dailyTotal = 0,
  compactOnly = false,
  onShowDailies,
}: Props) {
  const navigate = useNavigate()
  const { t, language } = useI18n()

  const reasonText = (): string => {
    const p = action.primary.reasonParams ?? {}
    switch (action.primary.reasonKey) {
      case 'warmup':
        return t.dashboard.nextActionWarmupReason ?? ''
      case 'fundamentals':
        return fmt(t.dashboard.nextActionFundamentalsReason ?? '', {
          done: p.done ?? '0',
          total: p.total ?? String(FUNDAMENTALS_EXERCISE_COUNT),
        })
      case 'daily':
        return fmt(t.dashboard.nextActionDailyReason ?? '', {
          done: p.done ?? '0',
          total: p.total ?? '0',
        })
      case 'review':
        return t.dashboard.nextActionReviewReason ?? ''
      case 'weak_criterion':
        return fmt(t.dashboard.weakestCriterionBody ?? '', { criterion: p.criterion ?? '' })
      case 'mistake_tags':
        return t.dashboard.nextActionMistakeReason ?? ''
      case 'improvement_focus':
        return t.dashboard.nextActionImprovementReason ?? ''
      case 'skill_review':
        return fmt(t.dashboard.nextActionSkillReviewReason ?? '', { days: p.days ?? '0' })
      case 'weakest_track':
      default:
        return t.dashboard.recommendedWeakHint ?? ''
    }
  }

  const primaryTitle = (): string => {
    if (action.primary.quest) {
      return resolveQuestTitle(action.primary.quest, language, questTitleOverrides)
    }
    if (action.primary.kind === 'skill_review') {
      return t.dashboard.nextActionSkillReviewTitle ?? ''
    }
    if (action.primary.kind === 'materials') {
      return t.dashboard.nextActionMaterialsTitle ?? ''
    }
    return t.dashboard.nextActionTitle ?? ''
  }

  const handlePrimary = () => {
    playUiClick()
    const { primary } = action
    if (primary.quest) {
      if (primary.kind === 'warmup' && onStartWarmup) {
        onStartWarmup(primary.quest.id)
        return
      }
      navigate(`/quests/${primary.quest.id}`, {
        state: buildQuestDetailNavState(
          primary.quest.id,
          primary.kind === 'warmup' || primary.kind === 'fundamentals' ? { autoStart: true } : undefined,
        ),
      })
      return
    }
    if (primary.href) {
      navigate(primary.href)
      return
    }
    navigate('/skills')
  }

  const renderQuestMeta = (quest: Quest) => (
    <div className="quest-card-meta mt-2">
      <span className="bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">{getCategoryLabel(quest.category, language)}</span>
      <QuestTimeMeta quest={quest} />
      <span className="xp-gold">⭐ {quest.xp} {t.common.xp}</span>
    </div>
  )

  const scrollToDailies = () => {
    playUiClick()
    onShowDailies?.()
    requestAnimationFrame(() => {
      document.getElementById('dashboard-dailies')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const visiblePlan = action.plan.filter((step) => {
    if (step.kind === action.primary.kind) return false
    if (dailyChecklistVisible && step.kind === 'daily_quest') return false
    if (action.primary.kind === 'warmup' && step.kind === 'warmup') return false
    if (action.primary.kind === 'fundamentals' && step.kind === 'fundamentals') return false
    return true
  })

  const showDailyNextHint =
    dailyChecklistVisible &&
    dailyTotal > 0 &&
    dailyDone < dailyTotal &&
    (action.primary.kind === 'warmup' || compactOnly)

  return (
    <div className="card-fantasy dashboard-next-action-card" data-onboarding="dashboard-next-action">
      <h2 className="heading-2 text-lg mb-1">{t.dashboard.nextActionTitle}</h2>
      <p className="text-sm text-[var(--text-muted)] mb-3">{reasonText()}</p>

      {!compactOnly && (
        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-secondary)] mb-4">
          {action.primary.kind === 'daily_quest' && (
            <span className="dashboard-next-action__daily-badge">{t.dashboard.nextActionDailyBadge ?? t.dashboard.dailyQuests}</span>
          )}
          <h3 className="quest-card-title">{primaryTitle()}</h3>
          {action.primary.quest && renderQuestMeta(action.primary.quest)}
          <div className="flex flex-wrap gap-2 mt-3">
            {action.primary.quest && (
              <button
                type="button"
                className="btn-secondary flex-1 min-w-[8rem]"
                onClick={() => {
                  playUiClick()
                  navigate(`/quests/${action.primary.quest!.id}`)
                }}
              >
                {t.common.details}
              </button>
            )}
            <button type="button" className="btn-primary flex-1 min-w-[8rem]" onClick={handlePrimary}>
              {action.primary.kind === 'warmup'
                ? (t.dashboard.nextActionStartWarmup ?? t.common.startQuest)
                : action.primary.kind === 'fundamentals'
                  ? (t.dashboard.nextActionStartFundamentals ?? t.common.startQuest)
                  : action.primary.kind === 'materials'
                  ? (t.dashboard.nextActionOpenMaterials ?? t.common.open)
                  : action.primary.kind === 'skill_review'
                    ? (t.dashboard.reviewCta ?? t.common.startQuest)
                    : t.common.startQuest}
            </button>
          </div>
        </div>
      )}

      {showDailyNextHint && (
        <div className="dashboard-next-action__daily-hint" role="note">
          <span>
            {fmt(t.dashboard.learningPlanDailyNextHint ?? '', {
              done: dailyDone,
              total: dailyTotal,
            })}
          </span>
          <button type="button" className="dashboard-next-action__daily-hint-link" onClick={scrollToDailies}>
            {t.dashboard.scrollToDailies}
          </button>
        </div>
      )}

      {action.secondary?.quest && (
        <div className="bg-[var(--bg-secondary)]/80 p-3 rounded-xl border border-[var(--border-secondary)] mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
            {t.dashboard.nextActionSecondaryTitle ?? 'Also practice'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-2">
            {action.secondary.reasonKey === 'mistake_tags'
              ? (t.dashboard.nextActionMistakeReason ?? '')
              : action.secondary.reasonKey === 'weak_criterion'
                ? fmt(t.dashboard.weakestCriterionBody ?? '', {
                    criterion: action.secondary.reasonParams?.criterion ?? '',
                  })
                : (t.dashboard.nextActionImprovementReason ?? '')}
          </p>
          <h3 className="quest-card-title text-sm">{resolveQuestTitle(action.secondary.quest, language, questTitleOverrides)}</h3>
          {renderQuestMeta(action.secondary.quest)}
          <button
            type="button"
            className="btn-secondary w-full mt-2 text-sm py-2"
            onClick={() => {
              playUiClick()
              navigate(`/quests/${action.secondary!.quest.id}`)
            }}
          >
            {t.dashboard.nextActionSecondaryCta ?? t.common.startQuest}
          </button>
        </div>
      )}

      {visiblePlan.length > 0 && (
        <div className="dashboard-learning-plan">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
            {getDashboardCopy(language).learningPlanTitle ?? t.dashboard.learningPlanTitle}
          </h3>
          <ol className="dashboard-learning-plan__list space-y-2">
            {visiblePlan.map((step: LearningPlanStep, index) => (
              <li key={`${step.kind}-${step.questId ?? step.skillNodeId ?? index}`} className="dashboard-learning-plan__item flex gap-2 text-sm">
                <span className="dashboard-learning-plan__step shrink-0 w-6 h-6 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-[var(--text-primary)]">{step.title}</div>
                  {step.reason && (
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{step.reason}</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
