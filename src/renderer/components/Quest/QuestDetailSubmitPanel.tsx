import SubmitStepBackdrop from '@/components/SubmitStepBackdrop'
import WorkUploadPreview from '@/components/WorkUploadPreview'
import WorkUploadZone from '@/components/WorkUploadZone'
import QuestSubmitReflection from '@/components/QuestSubmitReflection'
import { resolveSubmitErrorMessage } from '@/utils/submitErrors'
import { isSubmitReflectionValid } from '@/utils/questSubmitReflection'
import { playUiClick } from '@/utils/sound'
import type { QuestFeedbackCriterion } from '@/store/models'
import type { Language, translations } from '@/i18n/translations'
import type { SubmitErrorCode } from '@/utils/submitErrors'

type TBundle = (typeof translations)[Language]

export type QuestDetailSubmitPanelProps = {
  onDismiss: () => void
  lastPracticeNotesValue?: string
  uploadedFiles: string[]
  uploadedFileData: (File | null)[]
  onFilesSelected: (files: File[]) => void
  onRemoveFile: (index: number) => void
  uploadRequired: boolean
  isFundamentalsQuest: boolean
  submitError: SubmitErrorCode | null
  workComment: string
  onWorkCommentChange: (value: string) => void
  quickDifficulty: 1 | 2 | 3 | 4 | 5
  mistakeTags: string[]
  strengthRatings: Partial<Record<QuestFeedbackCriterion['label'], QuestFeedbackCriterion['rating']>>
  language: Language
  t: TBundle
  onDifficultyChange: (n: 1 | 2 | 3 | 4 | 5) => void
  onMistakeTagToggle: (tag: string) => void
  onStrengthRatingChange: (
    criterion: QuestFeedbackCriterion['label'],
    rating: QuestFeedbackCriterion['rating'],
  ) => void
  onSubmit: () => void
  submitDisabledReason: string | null
  isSubmitting: boolean
  isThisQuestSession: boolean
  sessionHasPhasesActive: boolean
  sessionPhasesDone: boolean
  commentLabel: string
  commentPlaceholder: string
  useFullReflection?: boolean
}

export default function QuestDetailSubmitPanel({
  onDismiss,
  lastPracticeNotesValue,
  uploadedFiles,
  uploadedFileData,
  onFilesSelected,
  onRemoveFile,
  uploadRequired,
  isFundamentalsQuest,
  submitError,
  workComment,
  onWorkCommentChange,
  quickDifficulty,
  mistakeTags,
  strengthRatings,
  language,
  t,
  onDifficultyChange,
  onMistakeTagToggle,
  onStrengthRatingChange,
  onSubmit,
  submitDisabledReason,
  isSubmitting,
  isThisQuestSession,
  sessionHasPhasesActive,
  sessionPhasesDone,
  commentLabel,
  commentPlaceholder,
  useFullReflection = true,
}: QuestDetailSubmitPanelProps) {
  return (
    <SubmitStepBackdrop open onDismiss={onDismiss}>
      <div className="submit-step-panel submit-step-panel--enter card-fantasy text-left p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 text-center sm:text-left">
          📤 {t.common.submit}
        </h2>
        <div className="submit-step-panel__grid">
          <div className="submit-step-panel__media space-y-3">
            {lastPracticeNotesValue ? (
              <div className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-3">
                <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {t.quests.lastPracticeNotes}
                </span>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {lastPracticeNotesValue}
                </p>
              </div>
            ) : null}
            {uploadedFiles.length > 0 ? (
              <div className="submit-step-panel__previews grid grid-cols-2 gap-2">
                {uploadedFiles.map((url, idx) => (
                  <WorkUploadPreview
                    key={idx}
                    url={url}
                    file={uploadedFileData[idx]}
                    alt={t.a11y.uploadPreviewVideo}
                    onRemove={() => onRemoveFile(idx)}
                    removeLabel={t.common.removeUpload}
                  />
                ))}
              </div>
            ) : null}
            <WorkUploadZone onFilesSelected={onFilesSelected} />
            <p className="text-xs text-[var(--text-muted)]">
              {uploadRequired
                ? t.common.attachmentRequired
                : (t.fundamentals?.uploadOptionalHint ?? 'Upload optional — finish without a file if you prefer.')}
            </p>
          </div>

          <div className="submit-step-panel__form space-y-3">
            {submitError ? (
              <div role="alert" className="text-sm px-3 py-2 rounded-lg banner-error">
                {resolveSubmitErrorMessage(submitError, t.common)}
              </div>
            ) : null}
            {uploadedFiles.length > 0 || isFundamentalsQuest ? (
              <>
                <label className="block">
                  <span className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    {commentLabel}
                  </span>
                  <textarea
                    value={workComment}
                    onChange={(e) => onWorkCommentChange(e.target.value)}
                    placeholder={commentPlaceholder}
                    rows={2}
                    className="w-full rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)] p-3 text-sm text-[var(--text-primary)]"
                  />
                </label>
                <QuestSubmitReflection
                  difficulty={quickDifficulty}
                  mistakeTags={mistakeTags}
                  strengthRatings={strengthRatings}
                  language={language}
                  t={t}
                  compact={!useFullReflection}
                  onDifficultyChange={onDifficultyChange}
                  onMistakeTagToggle={onMistakeTagToggle}
                  onStrengthRatingChange={onStrengthRatingChange}
                />
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-4">{t.quests.submitUploadFirstHint}</p>
            )}
            <div className="submit-step-panel__actions flex flex-col sm:flex-row gap-2 pt-1">
              {submitDisabledReason ? (
                <p className="text-xs text-[var(--status-warning-text)] sm:basis-full" role="status">
                  {submitDisabledReason}
                </p>
              ) : null}
              <button
                type="button"
                onClick={onSubmit}
                disabled={
                  (uploadRequired && uploadedFiles.length === 0) ||
                  isSubmitting ||
                  Boolean(isThisQuestSession && sessionHasPhasesActive && !sessionPhasesDone) ||
                  !isSubmitReflectionValid(quickDifficulty, mistakeTags)
                }
                className="btn-primary btn-session-primary text-base py-2.5 flex-1"
              >
                {t.common.submit}
              </button>
              <button
                type="button"
                onClick={() => {
                  playUiClick()
                  onDismiss()
                }}
                className="btn-secondary btn-session-secondary py-2.5 sm:min-w-[7rem]"
              >
                {t.common.back}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SubmitStepBackdrop>
  )
}
