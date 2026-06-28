import RatingPillGroup from '@/components/RatingPillGroup'
import type { Language, Translations } from '@/i18n/translations'
import type { QuestFeedbackCriterion } from '@/store/models'
import { MISTAKE_TAGS, getMistakeTagLabel } from '@/utils/mistakeTags'
import {
  getReflectionCriterionLabel,
  REFLECTION_CRITERIA_OPTIONS,
} from '@/utils/questReflectionCriteria'
import {
  shouldShowMistakeTags,
  shouldShowQualityRatings,
  type DifficultyRating,
  type StrengthRatings,
} from '@/utils/questSubmitReflection'
import { playUiClick } from '@/utils/sound'

type Props = {
  difficulty: DifficultyRating
  mistakeTags: string[]
  strengthRatings: StrengthRatings
  language: Language
  t: Translations
  compact?: boolean
  onDifficultyChange: (n: DifficultyRating) => void
  onMistakeTagToggle: (tag: string) => void
  onStrengthRatingChange: (
    criterion: QuestFeedbackCriterion['label'],
    rating: QuestFeedbackCriterion['rating'],
  ) => void
}

export default function QuestSubmitReflection({
  difficulty,
  mistakeTags,
  strengthRatings,
  language,
  t,
  compact = false,
  onDifficultyChange,
  onMistakeTagToggle,
  onStrengthRatingChange,
}: Props) {
  const showMistakes = !compact && shouldShowMistakeTags(difficulty)
  const showQuality = !compact && shouldShowQualityRatings(difficulty)

  return (
    <div className="quest-submit-reflection space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
          {t.quests.quickDifficulty}
        </p>
        <RatingPillGroup
          value={difficulty}
          onChange={(n) => {
            playUiClick()
            onDifficultyChange(n)
          }}
        />
      </div>

      {showQuality && (
        <div className="quest-submit-reflection__phase quest-submit-reflection__phase--enter">
          <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">
            {t.quests.feedbackQuality ?? t.quests.reflectionCriteriaHint}
          </p>
          {t.quests.reflectionCriteriaHint ? (
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {t.quests.reflectionCriteriaHint}
            </p>
          ) : null}
          <div className="space-y-2">
            {REFLECTION_CRITERIA_OPTIONS.map((criterion) => (
              <div key={criterion} className="flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--text-secondary)] shrink-0">
                  {getReflectionCriterionLabel(criterion, language)}
                </span>
                <RatingPillGroup
                  size="sm"
                  value={strengthRatings[criterion]}
                  onChange={(n) => {
                    playUiClick()
                    onStrengthRatingChange(criterion, n)
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {showMistakes && (
        <div className="quest-submit-reflection__phase quest-submit-reflection__phase--enter">
          <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
            {t.quests.submitMistakeTagsHint}
          </p>
          {mistakeTags.length === 0 && (
            <p className="text-xs text-[var(--status-warning-text)] mb-2" role="status">
              {t.quests.submitMistakeTagsRequired}
            </p>
          )}
          {difficulty === 5 && (
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {t.quests.submitMistakeTagsHardHint}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {MISTAKE_TAGS.map((tag) => {
              const active = mistakeTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  className={`session-mistake-chip rounded-full border px-2.5 py-1 text-xs font-medium ${active ? 'session-mistake-chip--active' : ''}`}
                  onClick={() => {
                    playUiClick()
                    onMistakeTagToggle(tag)
                  }}
                >
                  {getMistakeTagLabel(tag, language)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
