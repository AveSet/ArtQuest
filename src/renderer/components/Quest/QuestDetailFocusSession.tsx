import QuestDetailSessionPanel from '@/components/Quest/QuestDetailSessionPanel'
import QuestDetailFundamentalsBlock from '@/components/Quest/QuestDetailFundamentalsBlock'
import QuestPhaseReferenceViewer from '@/components/Quest/QuestPhaseReferenceViewer'
import QuestDetailSubmitPanel from '@/components/Quest/QuestDetailSubmitPanel'
import QuestTitleEditor from '@/components/QuestTitleEditor'
import { formatSessionRemaining } from '@/store/useQuestSessionStore'
import { getDifficultyLabel, getQuestDescription } from '@/i18n'
import { resolveQuestTitle } from '@/utils/questDisplay'
import { isSessionWidgetModeEnabled } from '@/utils/sessionOverlayActions'
import type { Quest, QuestFeedbackCriterion, QuestTitleOverrides } from '@/store/models'
import type { Language, translations } from '@/i18n/translations'
import type { SubmitErrorCode } from '@/utils/submitErrors'
import type { FundamentalsExercise } from '@/data/fundamentalsExercises'

type TBundle = (typeof translations)[Language]

export type QuestDetailFocusSessionProps = {
  quest: Quest
  lang: Language
  catColor: string
  questTitleOverrides: QuestTitleOverrides
  t: TBundle
  isWarmupQuest: boolean
  isFundamentalsQuest: boolean
  fundamentalsExercise?: FundamentalsExercise
  hasFundamentalsMedia: boolean
  isThisQuestSession: boolean
  displayMinutes: number
  timerExpired: boolean
  onTimerExpired: () => void
  showSubmitModal: boolean
  onOpenFinishFlow: () => void
  onDismissSubmit: () => void
  inActivePhases: boolean
  onSessionPrimaryAction: () => void
  onCollapseToWidget: () => void
  onRequestAbandon: () => void
  uploadedFiles: string[]
  uploadedFileData: (File | null)[]
  onAppendUploadedFiles: (files: File[]) => void
  onRemoveUploadedFile: (index: number) => void
  lastPracticeNotesValue?: string
  uploadRequired: boolean
  submitError: SubmitErrorCode | null
  workComment: string
  onWorkCommentChange: (value: string) => void
  quickDifficulty: 1 | 2 | 3 | 4 | 5
  mistakeTags: string[]
  strengthRatings: Partial<Record<QuestFeedbackCriterion['label'], QuestFeedbackCriterion['rating']>>
  onQuickDifficultyChange: (n: 1 | 2 | 3 | 4 | 5) => void
  onMistakeTagToggle: (tag: string) => void
  onStrengthRatingChange: (
    criterion: QuestFeedbackCriterion['label'],
    rating: QuestFeedbackCriterion['rating'],
  ) => void
  onSubmitInline: () => void
  submitDisabledReason: string | null
  isSubmitting: boolean
  sessionHasPhasesActive: boolean
  sessionPhasesDone: boolean
  commentLabel: string
  commentPlaceholder: string
}

export default function QuestDetailFocusSession({
  quest,
  lang,
  catColor,
  questTitleOverrides,
  t,
  isWarmupQuest,
  isFundamentalsQuest,
  fundamentalsExercise,
  hasFundamentalsMedia,
  isThisQuestSession,
  displayMinutes,
  timerExpired,
  onTimerExpired,
  showSubmitModal,
  onOpenFinishFlow,
  onDismissSubmit,
  inActivePhases,
  onSessionPrimaryAction,
  onCollapseToWidget,
  onRequestAbandon,
  uploadedFiles,
  uploadedFileData,
  onAppendUploadedFiles,
  onRemoveUploadedFile,
  lastPracticeNotesValue,
  uploadRequired,
  submitError,
  workComment,
  onWorkCommentChange,
  quickDifficulty,
  mistakeTags,
  strengthRatings,
  onQuickDifficultyChange,
  onMistakeTagToggle,
  onStrengthRatingChange,
  onSubmitInline,
  submitDisabledReason,
  isSubmitting,
  sessionHasPhasesActive,
  sessionPhasesDone,
  commentLabel,
  commentPlaceholder,
}: QuestDetailFocusSessionProps) {
  const useSessionHeroLayout = hasFundamentalsMedia || (isThisQuestSession && !isFundamentalsQuest)

  return (
    <div
      className={`container-fantasy mx-auto quest-session-page quest-session-page--active${
        useSessionHeroLayout ? ' quest-session-page--fundamentals-media' : ' max-w-2xl'
      }`}
    >
      <div
        className="card-fantasy quest-session-card quest-session-card--enter py-8 sm:py-10 border-t-4"
        style={{ borderTopColor: catColor }}
      >
        <div className={hasFundamentalsMedia ? 'fundamentals-session-header' : undefined}>
          {isWarmupQuest ? (
            <QuestTitleEditor
              quest={quest}
              layout="stacked"
              allowDelete={false}
              headingClassName={`heading-2 mb-4 leading-snug px-1${hasFundamentalsMedia ? ' text-center' : ' text-left'}`}
            />
          ) : (
            <h1
              className={`heading-2 w-full mb-2 leading-snug px-1${
                hasFundamentalsMedia ? ' text-center' : ' text-left mb-4'
              }`}
            >
              {resolveQuestTitle(quest, lang, questTitleOverrides)}
            </h1>
          )}
          {fundamentalsExercise ? (
            <QuestDetailFundamentalsBlock
              questId={quest.id}
              exercise={fundamentalsExercise}
              lang={lang}
              isActiveSession={isThisQuestSession}
              showPhaseTitle
            />
          ) : isThisQuestSession && !isFundamentalsQuest ? (
            <QuestPhaseReferenceViewer questId={quest.id} phaseKey="main" />
          ) : null}
        </div>
        {isThisQuestSession ? (
          <QuestDetailSessionPanel
            questId={quest.id}
            displayMinutes={displayMinutes}
            timerExpired={timerExpired}
            onTimerExpired={onTimerExpired}
            overtimeHint={t.quests.overtimeHint ?? ''}
            overtimeXpNote={t.quests.overtimeXpNote ?? ''}
            timerExpiredLabel={t.quests.timerExpired ?? ''}
            timerExpiredCta={t.quests.timerExpiredCta ?? ''}
            showSubmitModal={showSubmitModal}
            onOpenFinishFlow={onOpenFinishFlow}
          />
        ) : (
          <div className="mb-4 flex justify-center">
            <div className="text-5xl sm:text-6xl font-mono font-bold text-[var(--accent-hover)]">
              {formatSessionRemaining(displayMinutes * 60)}
            </div>
          </div>
        )}
        {fundamentalsExercise && !hasFundamentalsMedia ? (
          <QuestDetailFundamentalsBlock
            questId={quest.id}
            exercise={fundamentalsExercise}
            lang={lang}
            isActiveSession={isThisQuestSession}
          />
        ) : null}
        {!hasFundamentalsMedia ? (
          <p className="text-sm text-[var(--text-secondary)] mb-5 text-center max-w-lg mx-auto">
            {getQuestDescription(quest.description, lang)}
          </p>
        ) : null}
        {!hasFundamentalsMedia ? (
          <div className="flex flex-wrap justify-center gap-3 text-fantasy mb-8">
            <span className={`difficulty-badge ${quest.difficulty}`}>
              {getDifficultyLabel(quest.difficulty, lang)}
            </span>
            <span className="xp-gold">
              ⭐ {quest.xp} {t.common.xp}
            </span>
          </div>
        ) : null}

        {!showSubmitModal ? (
          <>
            <div
              className={
                hasFundamentalsMedia
                  ? 'quest-session-media-actions'
                  : 'flex flex-col gap-3 max-w-md mx-auto'
              }
            >
              <button
                type="button"
                onClick={onSessionPrimaryAction}
                className="btn-primary btn-session-primary text-lg py-3"
              >
                {inActivePhases ? t.quests.sessionPhaseNext : `📤 ${t.common.submit}`}
              </button>
              {window.electronAPI && isThisQuestSession && isSessionWidgetModeEnabled() ? (
                <button
                  type="button"
                  onClick={onCollapseToWidget}
                  className="btn-secondary btn-session-secondary text-lg py-3"
                >
                  {t.skills.collapseToWidget}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onRequestAbandon}
                className="btn-secondary btn-session-secondary text-lg py-3"
              >
                {t.common.cancel}
              </button>
            </div>
          </>
        ) : (
          <QuestDetailSubmitPanel
            onDismiss={onDismissSubmit}
            lastPracticeNotesValue={lastPracticeNotesValue}
            uploadedFiles={uploadedFiles}
            uploadedFileData={uploadedFileData}
            onFilesSelected={onAppendUploadedFiles}
            onRemoveFile={onRemoveUploadedFile}
            uploadRequired={uploadRequired}
            isFundamentalsQuest={isFundamentalsQuest}
            submitError={submitError}
            workComment={workComment}
            onWorkCommentChange={onWorkCommentChange}
            quickDifficulty={quickDifficulty}
            mistakeTags={mistakeTags}
            strengthRatings={strengthRatings}
            language={lang}
            t={t}
            onDifficultyChange={onQuickDifficultyChange}
            onMistakeTagToggle={onMistakeTagToggle}
            onStrengthRatingChange={onStrengthRatingChange}
            onSubmit={onSubmitInline}
            submitDisabledReason={submitDisabledReason}
            isSubmitting={isSubmitting}
            isThisQuestSession={isThisQuestSession}
            sessionHasPhasesActive={sessionHasPhasesActive}
            sessionPhasesDone={sessionPhasesDone}
            commentLabel={commentLabel}
            commentPlaceholder={commentPlaceholder}
          />
        )}
      </div>
    </div>
  )
}
