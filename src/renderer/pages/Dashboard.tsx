import { useNavigate } from 'react-router'

import { useDashboardQuestState } from '@/utils/useDashboardQuestState'

import { useSkillStore } from '@/store/useSkillStore'

import { useUIStore } from '@/store/useUIStore'

import { computePlayerLevel, getPlayerRankKey } from '@/utils/playerLevel'

import { generateShareCardPng, downloadShareCard } from '@/utils/shareCard'

import { useMemo, useCallback, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useI18n, getCategoryLabel } from '@/i18n'

import { resolveQuestTitle } from '@/utils/questDisplay'

import { Box } from '@/components/tags'

import { countDailyQuestsCompleted, getLocalDateStr, resolveDailyQuestSlots } from '@/utils/dailyQuests'

import { useDailyQuests } from '@/utils/useDailyQuests'

import WeeklyChallengeCard from '@/components/WeeklyChallengeCard'

import { usePortraitStore } from '@/store/usePortraitStore'

import { computeAvgSkillLevel } from '@/utils/recommendedQuest'

import NextBestActionCard from '@/components/NextBestActionCard'

import { useNextBestAction } from '@/utils/useNextBestAction'

import { useDashboardOverlays } from '@/utils/useDashboardOverlays'

import { useLearningProfile } from '@/utils/useVisibleCategories'


import DayCompleteModal from '@/components/DayCompleteModal'

import { peekTomorrowDailyCategories } from '@/utils/tomorrowDailyPreview'

import { playUiClick } from '@/utils/sound'
import { getMistakeTagLabel } from '@/utils/mistakeTags'

import { getWarmupQuestForDate } from '@/utils/warmupQuest'

import { buildQuestDetailNavState } from '@/utils/resolveQuestById'

import DashboardDailyChecklist from '@/components/dashboard/DashboardDailyChecklist'
import ReviewShelf from '@/components/dashboard/ReviewShelf'
import FundamentalsProgressCard from '@/components/dashboard/FundamentalsProgressCard'
import { shouldGateDailiesForBeginner, shouldUseFundamentalsPath } from '@/utils/fundamentalsProgress'

import DashboardProfilePanel from '@/components/dashboard/DashboardProfilePanel'

import DashboardGoalCard from '@/components/dashboard/DashboardGoalCard'

import ChestRevealModal from '@/components/ChestRevealModal'

import type { Skill } from '@/store/models'



const Dashboard = () => {

  const navigate = useNavigate()

  const { t, language } = useI18n()



  const {

    questCompletionLogs,

    completedQuests,

    completedToday,

    quests,

    questsLoaded,

    questsLoadError,

    questTitleOverrides,

    lastCompletionReward,

    dailyBonusGrantedDate,

    fundamentalsProgress,

  } = useDashboardQuestState()

  const { skillNodes, legacySkills } = useSkillStore(
    useShallow((s) => ({ skillNodes: s.skillNodes, legacySkills: s.legacySkills })),
  )

  const {
    streakState,
    portraitGender,
    favoriteCategories,
    useRandomCategories,
    learningProfileSetting,
    experienceTier,
  } = useUIStore(
    useShallow((s) => ({
      streakState: s.streakState,
      portraitGender: s.settings.portraitGender ?? 'male',
      favoriteCategories: s.settings.favoriteCategories,
      useRandomCategories: s.settings.useRandomCategories,
      learningProfileSetting: s.settings.learningProfile,
      experienceTier: s.settings.experienceTier ?? 'beginner',
    })),
  )

  const { dailyChestStreak, pendingChestReveal, clearPendingChestReveal } = usePortraitStore(
    useShallow((s) => ({
      dailyChestStreak: s.dailyChestStreak,
      pendingChestReveal: s.pendingChestReveal,
      clearPendingChestReveal: s.clearPendingChestReveal,
    })),
  )

  const learningProfile = useLearningProfile()

  const dailyQuests = useDailyQuests()

  const today = getLocalDateStr()

  const expectedDailySlots = useMemo(

    () => resolveDailyQuestSlots(streakState, today),

    [streakState, today],

  )

  const hasPartialDailyRoster =

    dailyQuests.length > 0 && dailyQuests.length < expectedDailySlots

  const hasEmptyDailyRoster = quests.length > 0 && dailyQuests.length === 0

  const dailyPartialHint = useMemo(() => {

    const template = t.dashboard.dailyQuestsPartialHint

    if (!template || !hasPartialDailyRoster) return null

    return template

      .replace('{available}', String(dailyQuests.length))

      .replace('{expected}', String(expectedDailySlots))

  }, [t.dashboard.dailyQuestsPartialHint, hasPartialDailyRoster, dailyQuests.length, expectedDailySlots])


  const fundamentalsPathActive = shouldUseFundamentalsPath(experienceTier, fundamentalsProgress)
  const gateDailies = shouldGateDailiesForBeginner(experienceTier, fundamentalsProgress)

  const { action: nextBestAction, warmupAvailable, focusTags, weakestCriterion } = useNextBestAction()
  const mainColumnRef = useRef<HTMLDivElement>(null)
  const [dailyPanelOpen, setDailyPanelOpen] = useState(true)

  const warmupQuest = useMemo(() => getWarmupQuestForDate(today), [today])



  const incompleteDailyQuests = dailyQuests.filter(q => !completedToday.includes(q.id))

  const allDailyCompleted = dailyQuests.length > 0 && incompleteDailyQuests.length === 0



  const { dayCompleteOpen, setDayCompleteOpen } = useDashboardOverlays({

    today,

    allDailyCompleted,

    dailyBonusGrantedDate,

  })



  const tomorrowCategories = useMemo(() => {

    if (!allDailyCompleted || quests.length === 0) return [] as string[]

    const cats = peekTomorrowDailyCategories({

      allQuests: quests,

      avgLevel: computeAvgSkillLevel(skillNodes, experienceTier),

      completedQuests,

      favoriteCategories,

      useRandomCategories,

      learningProfile: learningProfileSetting,

      questCompletionLogs,

    })

    return cats.map((c) => getCategoryLabel(c, language))

  }, [allDailyCompleted, quests, skillNodes, experienceTier, completedQuests, favoriteCategories, useRandomCategories, learningProfileSetting, language, questCompletionLogs])



  const startFiveMinuteQuest = useCallback(() => {

    if (!warmupAvailable) return

    playUiClick()

    navigate(`/quests/${warmupQuest.id}`, {

      state: buildQuestDetailNavState(warmupQuest.id, { autoStart: true }),

    })

  }, [navigate, warmupAvailable, warmupQuest.id])



  const lang = language

  const playerLevel = useMemo(
    () => computePlayerLevel(skillNodes, legacySkills),
    [skillNodes, legacySkills],
  )

  const rankKey = useMemo(() => getPlayerRankKey(playerLevel), [playerLevel])

  const character = useMemo(() => {

    const titles: Record<string, string> = { master: t.character.master, journeyman: t.character.journeyman, apprentice: t.character.apprentice, novice: t.character.novice, legend: t.character.legend }

    const colors: Record<string, string> = { master: 'var(--rank-master)', journeyman: 'var(--rank-advanced)', apprentice: 'var(--rank-apprentice)', novice: 'var(--rank-novice)', legend: 'var(--rank-legend)' }

    return { level: playerLevel, title: titles[rankKey] ?? t.character.novice, color: colors[rankKey] ?? colors.novice }

  }, [playerLevel, rankKey, t.character])



  const profileRoleLabel =

    learningProfile === 'drawing' ? t.profile.artistRole : t.profile.animatorRole



  const handleShareProgress = useCallback(async () => {

    playUiClick()

    const title = nextBestAction?.primary.quest

      ? resolveQuestTitle(nextBestAction.primary.quest, language, questTitleOverrides)

      : t.dashboard.title

    const rankTitles: Record<string, string> = {

      master: t.character.master,

      journeyman: t.character.journeyman,

      apprentice: t.character.apprentice,

      novice: t.character.novice,

      legend: t.character.legend,

    }

    const blob = await generateShareCardPng({

      questTitle: title,

      streak: streakState.current,

      rankLabel: rankTitles[rankKey] ?? t.character.novice,

      language: lang,

      playerLevel: character.level,

      rankColor: character.color,

      chestProgress: dailyChestStreak,

    })

    if (blob) await downloadShareCard(blob)

  }, [nextBestAction, language, questTitleOverrides, streakState, t, rankKey, lang, character.level, character.color, dailyChestStreak])



  const renderSkillBar = useCallback((skill: Skill) => (

    <div>

      <div className="flex items-center justify-between gap-2 mb-1 min-w-0">

        <div className="flex items-center gap-2 min-w-0">

          <span className="text-lg shrink-0">{skill.icon}</span>

          <span className="text-fantasy truncate">{t.categories[skill.category] ?? skill.name}</span>

        </div>

        <span className={`text-sm font-bold shrink-0 skill-label-${skill.category}`}>{t.skills.level} {skill.level}</span>

      </div>

      <div className="skill-bar">

        <div

          className={`skill-bar-fill skill-bar-fill--${skill.category}`}

          style={{ width: `${(skill.xp / skill.maxXp) * 100}%` }}

        />

      </div>

      <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">

        <span>{skill.xp} / {skill.maxXp} XP</span>

        <span>{Math.round((skill.xp / skill.maxXp) * 100)}%</span>

      </div>

    </div>

  ), [t])



  return (

    <Box className="container-fantasy dashboard-page">

      <DayCompleteModal

        open={dayCompleteOpen}

        onClose={() => setDayCompleteOpen(false)}

        streakDays={streakState.current}

        bonusXp={lastCompletionReward?.bonusDailyXp}

        starsFilled={dailyChestStreak}

      />

      <ChestRevealModal

        open={pendingChestReveal}

        onClose={() => {

          clearPendingChestReveal()

          useUIStore.getState().setSettings({ lastChestRevealDate: today })

        }}

      />



      {questsLoadError && (

        <div role="alert" className="card-fantasy banner-error text-sm mb-4">

          {t.common.questsLoadError}

        </div>

      )}



      <div className="dashboard-layout__body">

        <aside className="dashboard-layout__side hidden lg:block">
          <DashboardProfilePanel
            variant="sidebar"
            portraitGender={portraitGender}
            idle={streakState.current > 0}
            profileRoleLabel={profileRoleLabel}
            characterLevel={character.level}
            characterTitle={character.title}
            characterColor={character.color}
            levelLabel={t.skills.level}
            dailyChestStreak={dailyChestStreak}
            streakDays={streakState.current}
            chestHint={t.portrait.chestHint}
            renderSkillBar={renderSkillBar}
            showShareProgress={streakState.current > 0}
            shareProgressLabel={t.dashboard.shareProgress}
            onShareProgress={() => void handleShareProgress()}
          />
        </aside>

        <div className="dashboard-layout__main" ref={mainColumnRef}>
          <div className="lg:hidden">
            <DashboardProfilePanel
              variant="mobile"
              portraitGender={portraitGender}
              idle={streakState.current > 0}
              profileRoleLabel={profileRoleLabel}
              characterLevel={character.level}
              characterTitle={character.title}
              characterColor={character.color}
              levelLabel={t.skills.level}
              dailyChestStreak={dailyChestStreak}
              streakDays={streakState.current}
              chestHint={t.portrait.chestHint}
              renderSkillBar={renderSkillBar}
            />
          </div>

          <DashboardGoalCard />

          {focusTags.length > 0 && (
            <section className="card-fantasy p-4 mb-4" aria-labelledby="dashboard-focus-title">
              <h2 id="dashboard-focus-title" className="heading-4 mb-2">
                {t.dashboard.weakestCriterionTitle ?? 'Focus this week'}
              </h2>
              {weakestCriterion?.criterion && (
                <p className="text-xs text-[var(--text-muted)] mb-2">{weakestCriterion.criterion}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {focusTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="text-xs px-2.5 py-1 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/60 hover:bg-[var(--bg-tertiary)]"
                    onClick={() => {
                      playUiClick()
                      navigate(`/resources?view=learn&tag=${encodeURIComponent(tag)}`)
                    }}
                  >
                    {getMistakeTagLabel(tag, language)}
                  </button>
                ))}
              </div>
            </section>
          )}

          <ReviewShelf />

          <div className="card-fantasy p-3 dashboard-toggle-strip" data-onboarding="dashboard-next-action">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`text-xs px-3 py-1.5 rounded-lg border ${!dailyPanelOpen ? 'border-[var(--accent)] bg-[var(--accent)]/15' : 'border-[var(--border-secondary)]'}`}
                aria-pressed={!dailyPanelOpen}
                onClick={() => setDailyPanelOpen(false)}
              >
                {t.dashboard.nextBestActionLabel ?? 'Next action'}
              </button>
              <button
                type="button"
                className={`text-xs px-3 py-1.5 rounded-lg border ${dailyPanelOpen ? 'border-[var(--accent)] bg-[var(--accent)]/15' : 'border-[var(--border-secondary)]'}`}
                aria-pressed={dailyPanelOpen}
                onClick={() => setDailyPanelOpen(true)}
              >
                {t.dashboard.todayPracticeFocus ?? t.dashboard.today}
              </button>
              <div className="ml-auto text-xs text-[var(--text-muted)] dashboard-toggle-strip__count" aria-live="polite">
                {allDailyCompleted ? (t.dashboard.todayCompleteTitle ?? 'Daily complete') : `${dailyQuests.length}/${expectedDailySlots}`}
              </div>
            </div>
          </div>

          {dailyPanelOpen && (fundamentalsPathActive || fundamentalsProgress.completedIds.length > 0) && (
            <FundamentalsProgressCard
              experienceTier={experienceTier}
              fundamentalsProgress={fundamentalsProgress}
            />
          )}

          <div
            className={`dashboard-right-swap${dailyPanelOpen ? ' dashboard-right-swap--daily' : ''}`}
          >
            <div
              className="dashboard-right-swap__best"
              aria-hidden={dailyPanelOpen || undefined}
              {...(dailyPanelOpen ? { inert: true } : {})}
            >
              {!questsLoaded ? (
                <div className="card-fantasy p-4 mb-4" role="status">
                  <p className="text-sm text-[var(--text-muted)]">{t.common.loading}</p>
                </div>
              ) : nextBestAction ? (
                <NextBestActionCard
                  action={nextBestAction}
                  questTitleOverrides={questTitleOverrides}
                  onStartWarmup={startFiveMinuteQuest}
                  dailyChecklistVisible={!gateDailies && dailyQuests.length > 0 && !allDailyCompleted}
                  dailyDone={countDailyQuestsCompleted(dailyQuests.map((q) => q.id), completedToday)}
                  dailyTotal={dailyQuests.length}
                  onShowDailies={() => setDailyPanelOpen(true)}
                />
              ) : (
                <div className="card-fantasy p-4 mb-4" role="status">
                  <p className="text-sm text-[var(--text-muted)]">
                    {t.dashboard.dailyQuestsEmptyHint}
                  </p>
                </div>
              )}
            </div>

            <div
              className="dashboard-right-swap__daily"
              aria-hidden={!dailyPanelOpen || undefined}
              {...(!dailyPanelOpen ? { inert: true } : {})}
            >
              <header className="dashboard-practice-header mb-1">
                <h2 className="heading-fantasy text-xl sm:text-2xl text-[var(--text-heading)]">
                  {t.dashboard.todayPracticeFocus ?? t.dashboard.today}
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {t.dashboard.recommendedDailyHint}
                </p>
              </header>

              {gateDailies ? (
                <div
                  id="dashboard-dailies"
                  className="card-fantasy p-4 mb-4 border border-[var(--border-secondary)]"
                  role="status"
                  data-onboarding="dashboard-dailies"
                >
                  <p className="text-sm text-[var(--text-muted)]">
                    {t.fundamentals?.dailyLockedHint ??
                      'Complete the first fundamentals exercises to unlock daily quests.'}
                  </p>
                </div>
              ) : (
              <DashboardDailyChecklist
                dailyQuests={dailyQuests}
                completedToday={completedToday}
                questTitleOverrides={questTitleOverrides}
                focusTags={focusTags}
                favoriteCategories={favoriteCategories}
                allDailyCompleted={allDailyCompleted}
                dailyPartialHint={dailyPartialHint}
                hasEmptyDailyRoster={hasEmptyDailyRoster}
                dailyQuestsEmptyHint={t.dashboard.dailyQuestsEmptyHint}
                tomorrowCategories={tomorrowCategories}
                todayCompleteTitle={t.dashboard.todayCompleteTitle ?? ''}
                todayCompleteBody={t.dashboard.todayCompleteBody ?? ''}
                tomorrowPreviewBody={t.dashboard.tomorrowPreviewBody}
              />
              )}

              {!gateDailies && <WeeklyChallengeCard variant="default" requireAllDailies showTeaser />}
            </div>
          </div>
        </div>

      </div>

    </Box>

  )

}



export default Dashboard


