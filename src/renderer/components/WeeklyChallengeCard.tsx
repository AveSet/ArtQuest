import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore } from '@/store/useQuestStore'
import { useI18n, getDifficultyLabel } from '@/i18n'
import { resolveQuestTitle } from '@/utils/questDisplay'
import { getIsoWeekKey, isWeeklyChallengeComplete } from '@/utils/weeklyChallenge'
import { areAllDailyQuestsCompleted } from '@/utils/dailyQuests'
import { Box } from '@/components/tags'

type WeeklyChallengeCardProps = {
  /** Full card on Quests page; compact strip on Dashboard. */
  variant?: 'default' | 'compact'
  className?: string
  /** When true, card is hidden until all of today's daily quests are done. */
  requireAllDailies?: boolean
  /** Show locked preview before dailies are complete. */
  showTeaser?: boolean
}

export default function WeeklyChallengeCard({
  variant = 'default',
  className = '',
  requireAllDailies = false,
  showTeaser = false,
}: WeeklyChallengeCardProps) {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const {
    quests,
    questTitleOverrides,
    questId,
    weekKey,
    completedWeek,
    completedQuests,
    dailyQuestsIds,
    completedToday,
    ensureWeeklyChallenge,
  } = useQuestStore(
    useShallow((s) => ({
      quests: s.quests,
      questTitleOverrides: s.questTitleOverrides,
      questId: s.weeklyChallengeQuestId,
      weekKey: s.weeklyChallengeWeek,
      completedWeek: s.weeklyChallengeCompletedWeek,
      completedQuests: s.completedQuests,
      dailyQuestsIds: s.dailyQuestsIds,
      completedToday: s.completedToday,
      ensureWeeklyChallenge: s.ensureWeeklyChallenge,
    })),
  )

  const allDailiesDone = useMemo(
    () => areAllDailyQuestsCompleted(dailyQuestsIds, completedToday),
    [dailyQuestsIds, completedToday],
  )

  useEffect(() => {
    if (!requireAllDailies || allDailiesDone || showTeaser) {
      ensureWeeklyChallenge()
    }
  }, [requireAllDailies, allDailiesDone, showTeaser, ensureWeeklyChallenge])

  const quest = useMemo(() => quests.find((q) => q.id === questId), [quests, questId])
  const done = useMemo(
    () => isWeeklyChallengeComplete(weekKey || getIsoWeekKey(), completedWeek, questId, completedQuests),
    [weekKey, completedWeek, questId, completedQuests],
  )

  if (requireAllDailies && !allDailiesDone && !showTeaser) return null
  if (!quest || !questId) return null

  const lang = language
  const title = resolveQuestTitle(quest, lang, questTitleOverrides)
  const meta = `⭐ ${quest.xp} ${t.common.xp} · ⏱ ${quest.estimatedTime} ${t.common.minutes}`

  if (showTeaser && !allDailiesDone) {
    return (
      <div
        className={`weekly-challenge-teaser card-fantasy border border-dashed border-[var(--gold-primary)]/40 opacity-90 ${className}`.trim()}
        role="region"
        aria-label={t.quests.weeklyChallenge}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
          {t.quests.weeklyChallenge}
        </p>
        <p className="text-sm font-medium text-fantasy truncate" title={title}>
          {title}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{t.quests.weeklyChallengeLockedHint}</p>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={`weekly-challenge-compact flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-[var(--gold-primary)]/35 bg-[var(--bg-tertiary)]/60 px-3 py-2.5 ${className}`.trim()}
        role="region"
        aria-label={t.quests.weeklyChallenge}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] shrink-0">
          {t.quests.weeklyChallenge}
        </span>
        {done ? (
          <span className="text-sm font-medium text-status-success">✓ {t.quests.weeklyChallengeDone}</span>
        ) : (
          <>
            <span className={`difficulty-badge ${quest.difficulty} shrink-0 text-xs`}>
              {getDifficultyLabel(quest.difficulty, lang)}
            </span>
            <span className="text-sm font-medium text-fantasy min-w-0 flex-1 basis-[10rem] truncate" title={title}>
              {title}
            </span>
            <span className="text-xs text-[var(--text-muted)] shrink-0 hidden sm:inline">{meta}</span>
            <button
              type="button"
              className="btn-primary text-xs py-1.5 px-3 shrink-0 w-full sm:w-auto sm:ml-auto"
              onClick={() => navigate(`/quests/${quest.id}`)}
            >
              {t.quests.weeklyChallengeCta}
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <section
      className={`card-fantasy border border-[var(--gold-primary)]/40 weekly-challenge-card ${className}`.trim()}
    >
      <Box className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <Box>
          <h2 className="heading-2 text-sm mb-1">{t.quests.weeklyChallenge}</h2>
          <p className="text-xs text-[var(--text-muted)]">{t.quests.weeklyChallengeHint}</p>
        </Box>
        {done ? (
          <span className="text-sm font-semibold text-status-success shrink-0">✓ {t.quests.weeklyChallengeDone}</span>
        ) : (
          <span className={`difficulty-badge ${quest.difficulty} shrink-0`}>
            {getDifficultyLabel(quest.difficulty, lang)}
          </span>
        )}
      </Box>
      <p className="text-fantasy font-medium mb-2">{title}</p>
      <p className="text-xs text-[var(--text-muted)] mb-3">{meta}</p>
      {!done && (
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          onClick={() => navigate(`/quests/${quest.id}`)}
        >
          {t.quests.weeklyChallengeCta}
        </button>
      )}
    </section>
  )
}
