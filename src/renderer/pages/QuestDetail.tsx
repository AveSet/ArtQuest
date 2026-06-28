import { useParams, useNavigate, useLocation } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore } from '@/store/useQuestStore'
import SubmitStepBackdrop from '@/components/SubmitStepBackdrop'
import { useState, useEffect, useRef, useCallback, Fragment, useMemo } from 'react'
import {
  useI18n,
} from '@/i18n'
import { playSound, playUiClick } from '@/utils/sound'
import { useQuestSubmit } from '@/utils/useQuestSubmit'
import {
  getQuestUnlockState,
  getSatisfiedQuestIds,
  isQuestPermanentlyCompleted,
  resolvePrerequisiteTitles,
} from '@/utils/questPrerequisites'
import type { QuestCompletionLog } from '@/store/models'
import {
  useQuestSessionStore,
  getSessionPracticeMinutes,
  sessionHasPhases,
} from '@/store/useQuestSessionStore'
import { getQuestDisplayMinutes } from '@/utils/questSessionPlan'
import { usePersonalizedQuestMinutes } from '@/utils/usePersonalizedQuestMinutes'
import { openReferenceWindow } from '@/utils/openReferenceWindow'
import { collapseSessionToOverlay } from '@/utils/sessionOverlayActions'
import { resolveQuestSkillNodeId } from '@/utils/resolveQuestSkillNode'
import { resolveQuestTitle } from '@/utils/questDisplay'
import QuestDetailOverview, { questCategoryColor } from '@/components/Quest/QuestDetailOverview'
import QuestDetailFocusSession from '@/components/Quest/QuestDetailFocusSession'
import { buildQuestSubmissionCriteria } from '@/utils/questReflectionCriteria'
import {
  isSubmitReflectionValid,
  pruneReflectionOnDifficultyChange,
} from '@/utils/questSubmitReflection'
import type { QuestFeedbackCriterion } from '@/store/models'
import {
  getFundamentalsExerciseSteps,
  getFundamentalsQuestById,
  getFundamentalsBookPageNumbers,
  isFundamentalsQuestId,
  isFundamentalsTrackId,
} from '@/data/fundamentalsExercises'
import { getWarmupQuestById, isWarmupQuestId } from '@/data/warmupQuests'
import {
  getFundamentalsUnlockState,
  resolveFundamentalsTrackSessionStart,
} from '@/utils/fundamentalsProgress'
import { isWarmupCompletedToday } from '@/utils/warmupQuest'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { QUEST_OPEN_FINISH_FLOW_EVENT } from '@/utils/questSessionEvents'
import { useSessionRitualStore } from '@/store/useSessionRitualStore'
import { playSessionSound } from '@/utils/sound'
import type { QuestFeedback } from '@/store/models'

function latestCompletionNotes(questId: number, logs: QuestCompletionLog[]): string | undefined {
  for (let i = logs.length - 1; i >= 0; i--) {
    const row = logs[i]
    if (row.questId !== questId) continue
    const trimmed = row.notes?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function readRouterReturnTo(locationState: unknown): string | null {
  if (locationState && typeof locationState === 'object' && 'returnTo' in locationState) {
    const rt = (locationState as { returnTo?: string }).returnTo
    if (typeof rt === 'string' && rt.startsWith('/')) return rt
  }
  return null
}

function readQuickStartMinutes(locationState: unknown): number | null {
  if (!locationState || typeof locationState !== 'object' || !('quickStartMinutes' in locationState)) {
    return null
  }
  const minutes = (locationState as { quickStartMinutes?: unknown }).quickStartMinutes
  return typeof minutes === 'number' && Number.isFinite(minutes) ? Math.max(1, Math.round(minutes)) : null
}

const QuestDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language } = useI18n()
  const returnAfterQuest = readRouterReturnTo(location.state)
  const quickStartMinutes = readQuickStartMinutes(location.state)

  const {
    quests,
    completedQuests,
    lastWarmupCompletedDate,
    fundamentalsProgress,
    questTitleOverrides,
    questCompletionLogs,
    questsLoaded,
  } = useQuestStore(
    useShallow((s) => ({
      quests: s.quests,
      completedQuests: s.completedQuests,
      lastWarmupCompletedDate: s.lastWarmupCompletedDate,
      fundamentalsProgress: s.fundamentalsProgress,
      questTitleOverrides: s.questTitleOverrides,
      questCompletionLogs: s.questCompletionLogs,
      questsLoaded: s.questsLoaded,
    })),
  )
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [showReferenceChoices, setShowReferenceChoices] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [uploadedFileData, setUploadedFileData] = useState<(File | null)[]>([])
  const [workComment, setWorkComment] = useState('')
  const [quickDifficulty, setQuickDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [mistakeTags, setMistakeTags] = useState<string[]>([])
  const [strengthRatings, setStrengthRatings] = useState<
    Partial<Record<QuestFeedbackCriterion['label'], QuestFeedbackCriterion['rating']>>
  >({})
  const urlsRef = useRef<string[]>([])
  const expireSoundPlayedRef = useRef(false)
  const { submitQuest, isSubmitting, submitError, clearSubmitError } = useQuestSubmit()
  const sessionQuestId = useQuestSessionStore((s) => s.session?.questId ?? null)
  const sessionPhaseKey = useQuestSessionStore((s) => {
    const session = s.session
    if (!session || session.questId !== Number(id)) return ''
    return `${session.phasesComplete ? 1 : 0}|${sessionHasPhases(session) ? 1 : 0}`
  })
  const [sessionPhasesCompleteFlag, sessionHasPhasesFlag] = sessionPhaseKey.split('|')
  const sessionPhasesComplete = sessionPhasesCompleteFlag === '1'
  const sessionHasPhasesActive = sessionHasPhasesFlag === '1'
  const startGlobalSession = useQuestSessionStore((s) => s.startSession)
  const cancelGlobalSession = useQuestSessionStore((s) => s.cancelSession)
  const advanceSessionPhase = useQuestSessionStore((s) => s.advancePhase)
  const questIdNum = Number(id) ?? 0
  const quest =
    quests.find((q) => q.id === questIdNum) ??
    getFundamentalsQuestById(questIdNum) ??
    getWarmupQuestById(questIdNum)
  const isWarmupQuest = quest != null && isWarmupQuestId(quest.id)
  const isFundamentalsQuest = quest != null && isFundamentalsQuestId(quest.id)
  const lang = language
  const fundamentalsSteps = isFundamentalsQuest
    ? getFundamentalsExerciseSteps(quest.id, lang)
    : []
  const fundamentalsExercise = isFundamentalsQuest
    ? getFundamentalsQuestById(quest.id)
    : undefined
  const warmupDoneToday =
    isWarmupQuest && isWarmupCompletedToday(lastWarmupCompletedDate, getLocalDateStr())

  const lastPracticeNotesValue = useMemo(
    () => (quest ? latestCompletionNotes(quest.id, questCompletionLogs) : undefined),
    [quest, questCompletionLogs],
  )
  const satisfiedOnceIds = useMemo(
    () => getSatisfiedQuestIds(questCompletionLogs),
    [questCompletionLogs],
  )

  const [timerExpired, setTimerExpired] = useState(false)
  const personalizedMinutes = usePersonalizedQuestMinutes(quest ?? null)

  const isThisQuestSession = sessionQuestId === quest?.id
  const quickStartHandledRef = useRef(false)

  const resolvePracticeMinutes = useCallback(() => {
    const session = useQuestSessionStore.getState().session
    if (session && session.questId === quest?.id) {
      return getSessionPracticeMinutes(session)
    }
    return quest ? quest.estimatedTime : 1
  }, [quest])

  const handleTimerExpired = useCallback(() => {
    setTimerExpired(true)
    if (!expireSoundPlayedRef.current) {
      expireSoundPlayedRef.current = true
      playSound('uiTap', quest?.category)
    }
  }, [quest?.category])
  useEffect(() => {
    const prev = urlsRef.current
    const next = uploadedFiles
    urlsRef.current = next
    prev.forEach(url => {
      if (!next.includes(url)) URL.revokeObjectURL(url)
    })
  }, [uploadedFiles])

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      urlsRef.current = []
    }
  }, [])

  const navigateAfterQuestExit = useCallback(
    (
      _peekedBundle: unknown,
      ifNoStoredTarget: 'home' | 'stay',
    ) => {
      const rawDest = readRouterReturnTo(location.state) ?? (ifNoStoredTarget === 'home' ? '/' : null)
      if (!rawDest) return
      navigate(rawDest, { replace: true })
    },
    [location.state, navigate],
  )

  const resetSubmitState = useCallback(() => {
    setShowSubmitModal(false)
    setUploadedFiles([])
    setUploadedFileData([])
    setWorkComment('')
    setMistakeTags([])
    setStrengthRatings({})
    clearSubmitError()
  }, [clearSubmitError])

  useEffect(() => {
    if (!quest || warmupDoneToday) return
    const existingSession = useQuestSessionStore.getState().session
    if (existingSession?.questId === quest.id) {
      quickStartHandledRef.current = true
      return
    }
    if (quickStartHandledRef.current || isThisQuestSession) return
    const minutes = quickStartMinutes
    if (!minutes) return
    quickStartHandledRef.current = true
    setTimerExpired(false)
    expireSoundPlayedRef.current = false
    setShowReferenceChoices(false)
    resetSubmitState()
    const trackStart = isFundamentalsTrackId(quest.id)
      ? resolveFundamentalsTrackSessionStart(quest.id, fundamentalsProgress)
      : undefined
    if (isFundamentalsTrackId(quest.id) && !trackStart) return
    startGlobalSession(
      quest,
      false,
      trackStart ?? { mainMinutesOverride: minutes },
    )
    useSessionRitualStore.getState().setActive()
    playSessionSound('sessionEnter', quest.category)
    playSound('questStart', quest.category)
  }, [isThisQuestSession, quest, quickStartMinutes, startGlobalSession, warmupDoneToday, fundamentalsProgress, resetSubmitState])

  const startQuestNow = useCallback(() => {
    if (!quest || warmupDoneToday) return
    setTimerExpired(false)
    expireSoundPlayedRef.current = false
    setShowReferenceChoices(false)
    const trackStart = isFundamentalsTrackId(quest.id)
      ? resolveFundamentalsTrackSessionStart(quest.id, fundamentalsProgress)
      : undefined
    const minutesOverride = trackStart
      ? trackStart.mainMinutesOverride
      : isWarmupQuest
        ? 5
        : isFundamentalsQuest
          ? quest.estimatedTime
          : personalizedMinutes?.minutes
    startGlobalSession(
      quest,
      false,
      trackStart ?? (minutesOverride ? { mainMinutesOverride: minutesOverride } : undefined),
    )
    resetSubmitState()
    useSessionRitualStore.getState().setActive()
    playSessionSound('sessionEnter', quest.category)
    playSound('questStart', quest.category)
  }, [quest, isWarmupQuest, isFundamentalsQuest, warmupDoneToday, startGlobalSession, personalizedMinutes?.minutes, fundamentalsProgress, resetSubmitState])

  const startWithReferenceBonus = useCallback(
    (afterStart: () => void) => {
      if (!quest) return
      setTimerExpired(false)
      expireSoundPlayedRef.current = false
      setShowReferenceChoices(false)
      const minutesOverride = personalizedMinutes?.minutes
      startGlobalSession(
        quest,
        true,
        minutesOverride ? { mainMinutesOverride: minutesOverride } : undefined,
      )
      resetSubmitState()
      useSessionRitualStore.getState().setActive()
      playSessionSound('sessionEnter', quest.category)
      playSound('questStart', quest.category)
      afterStart()
    },
    [quest, startGlobalSession, personalizedMinutes?.minutes, resetSubmitState],
  )


  const openQuestRefs = useCallback(
    (mode: 'long' | 'short' | 'pinterest' | 'clipTips' | 'sketchfab') => {
      if (!quest) return
      openReferenceWindow({
        mode,
        questId: quest.id,
        nodeId: resolveQuestSkillNodeId(quest),
        category: quest.category,
        tags: quest.tags,
        lang,
      })
    },
    [quest, lang],
  )

  const startWithYoutubeLong = useCallback(() => {
    if (!quest) return
    startWithReferenceBonus(() => openQuestRefs('long'))
  }, [quest, startWithReferenceBonus, openQuestRefs])

  const startWithYoutubeShort = useCallback(() => {
    if (!quest) return
    startWithReferenceBonus(() => openQuestRefs('short'))
  }, [quest, startWithReferenceBonus, openQuestRefs])

  const startWithPinterest = useCallback(() => {
    if (!quest) return
    startWithReferenceBonus(() => openQuestRefs('pinterest'))
  }, [quest, startWithReferenceBonus, openQuestRefs])

  const startWithClipTips = useCallback(() => {
    if (!quest) return
    startWithReferenceBonus(() => openQuestRefs('clipTips'))
  }, [quest, startWithReferenceBonus, openQuestRefs])

  const startWithSketchfab = useCallback(() => {
    if (!quest) return
    startWithReferenceBonus(() => openQuestRefs('sketchfab'))
  }, [quest, startWithReferenceBonus, openQuestRefs])

  const cancelSession = useCallback(() => {
    setTimerExpired(false)
    expireSoundPlayedRef.current = false
    cancelGlobalSession()
    setShowReferenceChoices(false)
    resetSubmitState()
  }, [cancelGlobalSession, resetSubmitState])

  const openFinishFlow = useCallback(() => {
    playUiClick()
    playSessionSound('debriefConfirm', quest?.category)
    clearSubmitError()
    setShowSubmitModal(true)
  }, [clearSubmitError, quest?.category])

  useEffect(() => {
    const onOpenFinish = () => {
      if (!isThisQuestSession) return
      openFinishFlow()
    }
    window.addEventListener(QUEST_OPEN_FINISH_FLOW_EVENT, onOpenFinish)
    return () => window.removeEventListener(QUEST_OPEN_FINISH_FLOW_EVENT, onOpenFinish)
  }, [isThisQuestSession, openFinishFlow])

  const submitInlineCb = useCallback(() => {
    if (!quest) return
    const files = uploadedFileData.filter((f): f is File => f != null)
    if (files.length === 0 && !isFundamentalsQuest) return
    playUiClick()
    const feedback: QuestFeedback = {
      difficultyRating: quickDifficulty,
      criteria: buildQuestSubmissionCriteria(mistakeTags, strengthRatings),
      mistakeTags: mistakeTags.length > 0 ? mistakeTags : undefined,
    }
    submitQuest(
      quest.id,
      uploadedFiles,
      files,
      () => {
        cancelGlobalSession()
        setShowSubmitModal(false)
        setUploadedFiles([])
        setUploadedFileData([])
        setWorkComment('')
        setMistakeTags([])
        useSessionRitualStore.getState().reset()
      },
      resolvePracticeMinutes(),
      () => navigateAfterQuestExit(null, 'home'),
      workComment.trim() || undefined,
      undefined,
      feedback,
    )
  }, [
    quest,
    uploadedFiles,
    uploadedFileData,
    quickDifficulty,
    mistakeTags,
    strengthRatings,
    submitQuest,
    cancelGlobalSession,
    resolvePracticeMinutes,
    navigateAfterQuestExit,
    workComment,
    isFundamentalsQuest,
  ])

  const abandonQuest = useCallback(() => {
    playSound('questAbandon', quest?.category)
    cancelSession()
    useSessionRitualStore.getState().reset()
    setShowAbandonConfirm(false)
    navigate('/', { replace: true })
  }, [cancelSession, navigate, quest?.category])

  const requestAbandonQuest = useCallback(() => {
    playUiClick()
    setShowAbandonConfirm(true)
  }, [])

  const appendUploadedFiles = useCallback((fileArr: File[]) => {
    const newUrls = fileArr.map(f => URL.createObjectURL(f))
    setUploadedFiles(prev => [...prev, ...newUrls])
    setUploadedFileData(prev => [...prev, ...fileArr])
  }, [])

  const removeUploadedFile = useCallback((index: number) => {
    playUiClick()
    setUploadedFiles(prev => {
      const url = prev[index]
      if (url) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
    setUploadedFileData(prev => prev.filter((_, i) => i !== index))
  }, [])

  const inActivePhases = isThisQuestSession && sessionHasPhasesActive && !sessionPhasesComplete

  const handleSessionPrimaryAction = useCallback(() => {
    if (inActivePhases) {
      playUiClick()
      advanceSessionPhase()
      return
    }
    openFinishFlow()
  }, [inActivePhases, advanceSessionPhase, openFinishFlow])

  const handleQuickDifficulty = useCallback((n: 1 | 2 | 3 | 4 | 5) => {
    const pruned = pruneReflectionOnDifficultyChange(quickDifficulty, n, {
      mistakeTags,
      strengthRatings,
    })
    setQuickDifficulty(n)
    setMistakeTags(pruned.mistakeTags)
    setStrengthRatings(pruned.strengthRatings)
  }, [quickDifficulty, mistakeTags, strengthRatings])

  const toggleMistakeTag = useCallback((tag: string) => {
    setMistakeTags((prev) => {
      if (prev.includes(tag)) return prev.filter((item) => item !== tag)
      if (prev.length >= 3) return [...prev.slice(1), tag]
      return [...prev, tag]
    })
  }, [])

  const handleStrengthRatingChange = useCallback((
    criterion: QuestFeedbackCriterion['label'],
    rating: QuestFeedbackCriterion['rating'],
  ) => {
    setStrengthRatings((prev) => {
      const next = { ...prev }
      if (prev[criterion] === rating) delete next[criterion]
      else next[criterion] = rating
      return next
    })
  }, [])

  const handleCollapseToWidget = useCallback(() => {
    playUiClick()
    collapseSessionToOverlay()
  }, [])

  const handleAppendUploadedFiles = useCallback((fileArr: File[]) => {
    playSound('itemSelect', quest?.category)
    appendUploadedFiles(fileArr)
  }, [appendUploadedFiles, quest?.category])

  const fundamentalsPhaseIndex = useQuestSessionStore((s) => {
    if (!quest || !isThisQuestSession || s.session?.questId !== quest.id) return undefined
    const phase = s.session.phases[s.session.currentPhaseIndex]
    if (phase && phase.kind === 'fundamentals') return phase.phaseIndex
    return undefined
  })

  const hasFundamentalsMedia = useMemo(() => {
    if (!fundamentalsExercise) return false
    return getFundamentalsBookPageNumbers(fundamentalsExercise, fundamentalsPhaseIndex).length > 0
  }, [fundamentalsExercise, fundamentalsPhaseIndex])

  if (!quest && !questsLoaded) {
    return (
      <div className="container-fantasy text-center py-12">
        <p className="text-fantasy">{t.common.loading}</p>
      </div>
    )
  }

  if (!quest) {
    return (
      <div className="container-fantasy text-center py-12">
        <p className="text-fantasy">{t.common.questNotFound}</p>
        <button type="button" onClick={() => navigate('/quests')} className="btn-primary mt-4">
          {t.common.back}
        </button>
      </div>
    )
  }

  const isCompleted = isWarmupQuest
    ? warmupDoneToday
    : isQuestPermanentlyCompleted(quest, completedQuests)
  const unlock = isWarmupQuest
    ? { unlocked: !warmupDoneToday, missingPrerequisiteIds: [] as number[] }
    : isFundamentalsQuest
      ? getFundamentalsUnlockState(quest, fundamentalsProgress)
      : getQuestUnlockState(quest, completedQuests, satisfiedOnceIds)
  const prereqHint = isFundamentalsQuest
    ? resolvePrerequisiteTitles(
        unlock.missingPrerequisiteIds,
        [],
        lang,
      )
        .map((title, i) => {
          const missingId = unlock.missingPrerequisiteIds[i]
          const missing = missingId != null ? getFundamentalsQuestById(missingId) : undefined
          return missing ? resolveQuestTitle(missing, lang, questTitleOverrides) : title
        })
        .join(' · ')
    : resolvePrerequisiteTitles(unlock.missingPrerequisiteIds, quests, lang, questTitleOverrides).join(' · ')
  const catColor = questCategoryColor(quest)
  const displayMinutes = getQuestDisplayMinutes(quest, false, personalizedMinutes?.minutes)

  const uploadRequired = !isFundamentalsQuest
  const isFundamentalsTrackQuest = isFundamentalsTrackId(quest.id)
  const sessionPhasesDone = !isThisQuestSession
    ? !isFundamentalsTrackQuest
    : isFundamentalsTrackQuest
      ? sessionHasPhasesActive && sessionPhasesComplete
      : !sessionHasPhasesActive || sessionPhasesComplete
  const submitDisabledReason =
    uploadRequired && uploadedFiles.length === 0
      ? t.quests.submitUploadFirstHint
      : isThisQuestSession && sessionHasPhasesActive && !sessionPhasesDone
        ? t.quests.sessionPhaseNext
        : !isSubmitReflectionValid(quickDifficulty, mistakeTags)
          ? t.quests.submitMistakeTagsRequired
          : null
  const sessionStageLabel = !isThisQuestSession
    ? (t.quests.startQuestNow ?? 'Start quest')
    : showSubmitModal
      ? t.common.submit
      : inActivePhases
        ? t.quests.sessionPhaseNext
        : timerExpired
          ? (t.quests.timerExpired ?? 'Time is up — wrap up and submit')
          : 'Focus session in progress'
  const focusCopy = {
    commentLabel: t.quests.workCommentLabel ?? '',
    commentPlaceholder: t.quests.workCommentPlaceholder ?? '',
  }

  const focusMode = isThisQuestSession || showSubmitModal

  return (
    <Fragment>
      {!focusMode ? (
        <QuestDetailOverview
          quest={quest}
          lang={lang}
          catColor={catColor}
          isCompleted={isCompleted}
          unlock={unlock}
          prereqHint={prereqHint}
          fundamentalsSteps={fundamentalsSteps}
          isFundamentals={isFundamentalsQuest}
          lastPracticeNotesValue={lastPracticeNotesValue}
          showReferenceChoices={showReferenceChoices}
          t={t}
          returnAfterQuest={returnAfterQuest}
          onBack={() => {
            navigate(returnAfterQuest ?? '/quests')
          }}
          onShowReferenceChoices={() => setShowReferenceChoices(true)}
          onStartYoutubeLong={startWithYoutubeLong}
          onStartYoutubeShort={startWithYoutubeShort}
          onStartPinterest={startWithPinterest}
          onStartClipTips={startWithClipTips}
          onStartSketchfab={startWithSketchfab}
          onStartQuestNow={startQuestNow}
        />
      ) : (
        <>
          <div className="container-fantasy mb-3">
            <div className="card-fantasy p-3 sm:p-4 border border-[var(--border-secondary)]" role="status" aria-live="polite">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {t.dashboard.nextBestActionLabel ?? 'Next action'}
                  </p>
                  <p className="text-sm font-semibold text-[var(--text-heading)]">{sessionStageLabel}</p>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {displayMinutes} min · {resolveQuestTitle(quest, lang, questTitleOverrides)}
                </div>
              </div>
            </div>
          </div>
          <QuestDetailFocusSession
            quest={quest}
            lang={lang}
            catColor={catColor}
            questTitleOverrides={questTitleOverrides}
            t={t}
            isWarmupQuest={isWarmupQuest}
            isFundamentalsQuest={isFundamentalsQuest}
            fundamentalsExercise={fundamentalsExercise}
            hasFundamentalsMedia={hasFundamentalsMedia}
            isThisQuestSession={isThisQuestSession}
            displayMinutes={displayMinutes}
            timerExpired={timerExpired}
            onTimerExpired={handleTimerExpired}
            showSubmitModal={showSubmitModal}
            onOpenFinishFlow={openFinishFlow}
            onDismissSubmit={() => setShowSubmitModal(false)}
            inActivePhases={inActivePhases}
            onSessionPrimaryAction={handleSessionPrimaryAction}
            onCollapseToWidget={handleCollapseToWidget}
            onRequestAbandon={requestAbandonQuest}
            uploadedFiles={uploadedFiles}
            uploadedFileData={uploadedFileData}
            onAppendUploadedFiles={handleAppendUploadedFiles}
            onRemoveUploadedFile={removeUploadedFile}
            lastPracticeNotesValue={lastPracticeNotesValue}
            uploadRequired={uploadRequired}
            submitError={submitError}
            workComment={workComment}
            onWorkCommentChange={setWorkComment}
            quickDifficulty={quickDifficulty}
            mistakeTags={mistakeTags}
            strengthRatings={strengthRatings}
            onQuickDifficultyChange={handleQuickDifficulty}
            onMistakeTagToggle={toggleMistakeTag}
            onStrengthRatingChange={handleStrengthRatingChange}
            onSubmitInline={submitInlineCb}
            submitDisabledReason={submitDisabledReason ?? null}
            isSubmitting={isSubmitting}
            sessionHasPhasesActive={sessionHasPhasesActive}
            sessionPhasesDone={sessionPhasesDone}
            commentLabel={focusCopy.commentLabel}
            commentPlaceholder={focusCopy.commentPlaceholder}
          />
        </>
      )}

      {showAbandonConfirm ? (
        <SubmitStepBackdrop open onDismiss={() => setShowAbandonConfirm(false)}>
          <div className="card-fantasy max-w-md mx-auto p-5 text-center" role="alertdialog" aria-labelledby="abandon-quest-title">
            <h2 id="abandon-quest-title" className="heading-3 mb-2">
              {t.common.abandonQuestTitle}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              {t.common.abandonQuestBody ?? 'Your session progress for this quest will be lost.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button type="button" className="btn-secondary py-2.5 px-4" onClick={() => setShowAbandonConfirm(false)}>
                {t.common.back}
              </button>
              <button type="button" className="btn-primary py-2.5 px-4" onClick={abandonQuest}>
                {t.common.cancel}
              </button>
            </div>
          </div>
        </SubmitStepBackdrop>
      ) : null}

    </Fragment>
  )
}

export default QuestDetail
