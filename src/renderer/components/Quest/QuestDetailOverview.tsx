import type { Quest } from '@/store/models'
import type { Language } from '@/i18n/translations'
import QuestMaterialsButton from '@/components/QuestMaterialsButton'
import ReferenceSourceChoices from '@/components/Quest/ReferenceSourceChoices'
import { getReferenceYoutubeButtonLabels } from '@/utils/referenceYtLabels'
import QuestTitleEditor from '@/components/QuestTitleEditor'
import { isFundamentalsQuestId } from '@/data/fundamentalsExercises'
import { isWarmupQuestId } from '@/data/warmupQuests'
import { getQuestDisplayMinutes } from '@/utils/questSessionPlan'
import { usePersonalizedQuestMinutes } from '@/utils/usePersonalizedQuestMinutes'
import { useLastQuestCompletionMinutes } from '@/utils/useLastQuestCompletionMinutes'
import { getQuestDescription, getDifficultyLabel } from '@/i18n'
import { CATEGORY_INFO } from '@/data/skillTree'
import FundamentalsBookPages from '@/components/Quest/FundamentalsBookPages'
import SessionPhasePlanPreview from '@/components/Quest/SessionPhasePlanPreview'
import { getFundamentalsQuestById } from '@/data/fundamentalsExercises'
import { buildQuestPhasePlanRows, sumPhasePlanMinutes } from '@/utils/questPhaseKeys'

export type QuestDetailOverviewProps = {
  quest: Quest
  lang: Language
  catColor: string
  isCompleted: boolean
  unlock: { unlocked: boolean }
  prereqHint: string
  lastPracticeNotesValue?: string
  fundamentalsSteps?: string[]
  isFundamentals?: boolean
  showReferenceChoices: boolean
  t: {
    quests: Record<string, string | undefined>
    common: Record<string, string | undefined>
  }
  returnAfterQuest: string | null
  onBack: () => void
  onShowReferenceChoices: () => void
  onStartYoutubeLong: () => void
  onStartYoutubeShort: () => void
  onStartPinterest: () => void
  onStartClipTips: () => void
  onStartSketchfab: () => void
  onStartQuestNow: () => void
}

export default function QuestDetailOverview({
  quest,
  lang,
  catColor,
  isCompleted,
  unlock,
  prereqHint,
  lastPracticeNotesValue,
  fundamentalsSteps = [],
  isFundamentals = false,
  showReferenceChoices,
  t,
  onBack,
  onShowReferenceChoices,
  onStartYoutubeLong,
  onStartYoutubeShort,
  onStartPinterest,
  onStartClipTips,
  onStartSketchfab,
  onStartQuestNow,
}: QuestDetailOverviewProps) {
  const isWarmup = isWarmupQuestId(quest.id)
  const isFundamentalsExercise = isFundamentals || isFundamentalsQuestId(quest.id)
  const isQuickSession = isWarmup || isFundamentalsExercise
  const personalized = usePersonalizedQuestMinutes(quest)
  const lastCompletionMinutes = useLastQuestCompletionMinutes(quest.id)
  const displayMinutes = getQuestDisplayMinutes(quest, false, personalized?.minutes)
  const ytLabels = getReferenceYoutubeButtonLabels(lang)
  const fundamentalsExercise = isFundamentalsExercise
    ? getFundamentalsQuestById(quest.id)
    : undefined
  const phasePlanRows = buildQuestPhasePlanRows(quest, lang, {
    fundamentalsExercise,
    fundamentalsSteps,
    questLabels: t.quests,
  })
  const phasePlanMinutes = phasePlanRows.length > 1 ? sumPhasePlanMinutes(phasePlanRows) : displayMinutes
  return (
    <div className="container-fantasy max-w-2xl mx-auto quest-detail-page">
      <button type="button" onClick={onBack} className="btn-secondary mb-3 text-sm py-1.5 px-3">
        ← {t.common.back}
      </button>

      <div
        className="quest-detail-card card-fantasy quest-detail-card--compact border-l-4"
        style={{ borderLeftColor: catColor, '--quest-category-color': catColor } as React.CSSProperties}
      >
        <div className="mb-2 w-full">
          <QuestTitleEditor
            quest={quest}
            layout="stacked"
            allowDelete={!isQuickSession}
            headingClassName="heading-fantasy text-left text-xl sm:text-2xl leading-snug"
          />
          <div className="flex items-center gap-2 mt-2">
            <span className={`difficulty-badge ${quest.difficulty}`}>
              {getDifficultyLabel(quest.difficulty, lang)}
            </span>
          </div>
        </div>

        <p className="quest-detail-desc quest-description mb-3 pl-3 border-l-2 text-sm leading-snug" style={{ borderColor: catColor }}>
          {getQuestDescription(quest.description, lang)}
        </p>

        {!unlock.unlocked && prereqHint && (
          <p className="text-xs text-[var(--status-warning-text)] mb-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]" role="status">
            🔒 {t.quests.prerequisiteRequires} {prereqHint}
          </p>
        )}

        {lastPracticeNotesValue && (
          <div className="mb-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-3 py-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-0.5">{t.quests.lastPracticeNotes}</p>
            <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap">{lastPracticeNotesValue}</p>
          </div>
        )}

        {phasePlanRows.length > 0 && (
          <SessionPhasePlanPreview
            quest={quest}
            lang={lang}
            fundamentalsExercise={fundamentalsExercise}
            fundamentalsSteps={fundamentalsSteps}
            minutesLabel={t.common.minutes ?? 'min'}
            sessionPlanTitle={t.quests.sessionPlanTitle ?? 'Session plan'}
            sessionPlanHint={t.quests.microChallengesSessionHint}
            totalPhasesLabel={t.quests.sessionPhaseTotal
              ? t.quests.sessionPhaseTotal
                  .replace('{count}', String(phasePlanRows.length))
                  .replace('{minutes}', String(phasePlanMinutes))
              : undefined}
          />
        )}

        {fundamentalsExercise && !fundamentalsExercise.trackPhases?.length ? (
          <FundamentalsBookPages exercise={fundamentalsExercise} compact />
        ) : null}

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="quest-detail-stat-pill panel-fantasy flex items-center gap-1.5 px-2.5 py-1.5 text-sm">
            <span className="font-bold xp-gold">{quest.xp}</span>
            <span className="meta-fantasy text-[10px]">{t.common.xp}</span>
          </div>
          <div className="quest-detail-stat-pill panel-fantasy flex items-center gap-1.5 px-2.5 py-1.5 text-sm">
            <span className="font-bold text-[var(--text-heading)]">{phasePlanMinutes}</span>
            <span className="meta-fantasy text-[10px]">{t.common.minutes}</span>
            {personalized?.isPersonalized ? (
              <span className="meta-fantasy text-[10px] text-[var(--text-muted)]">
                ({t.quests.typicalTimeLabel ?? 'typ.'} {personalized.catalogMinutes})
              </span>
            ) : null}
          </div>
          {lastCompletionMinutes != null ? (
            <div className="quest-detail-stat-pill panel-fantasy flex items-center gap-1.5 px-2.5 py-1.5 text-sm">
              <span className="font-bold text-[var(--text-heading)]">{lastCompletionMinutes}</span>
              <span className="meta-fantasy text-[10px]">
                {t.quests.lastCompletionTimeLabel ?? 'Last'} {t.common.minutes}
              </span>
            </div>
          ) : null}
          <details className="text-xs ml-auto">
            <summary className="cursor-pointer text-[var(--accent-hover)] font-medium">{t.quests.xpBreakdownTitle}</summary>
            <ul className="mt-1 space-y-0.5 text-[var(--text-muted)] list-disc pl-4 max-w-xs">
              <li>{t.quests.xpBreakdownQuest}</li>
              <li>{t.quests.xpBreakdownSkill}</li>
              {quest.microChallenges && quest.microChallenges.length > 0 && t.quests.xpBreakdownPhase && (
                <li>{t.quests.xpBreakdownPhase}</li>
              )}
            </ul>
          </details>
        </div>

        {quest.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {quest.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {quest.is_repeatable && !isQuickSession && (
          <p className="mb-2 text-center text-xs text-[var(--text-secondary)] px-2 py-1 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
            🔁 {t.quests.repeatableQuest}
          </p>
        )}
        {isCompleted ? (
          <div className="px-3 py-2 rounded-lg text-center banner-success text-sm font-semibold">
            ✓ {t.quests.questCompleted}
          </div>
        ) : unlock.unlocked ? (
          <div className="flex flex-col gap-1.5 mt-2">
            {isWarmup && (
              <p className="text-xs text-center text-[var(--text-muted)]">
                {t.quests.warmupSessionHint}
              </p>
            )}
            {isFundamentalsExercise && !isWarmup && (
              <p className="text-xs text-center text-[var(--text-muted)]">
                {t.quests.fundamentalsSessionHint ??
                  'Follow the steps above. Upload your work when the timer ends.'}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-1.5">
              {!isQuickSession &&
                (!showReferenceChoices ? (
                  <button type="button" onClick={onShowReferenceChoices} className="btn-secondary flex-1 py-1.5 text-xs">
                    🖼 {t.quests.needReferences}
                  </button>
                ) : (
                  <ReferenceSourceChoices
                    youtubeLongLabel={ytLabels.long}
                    youtubeShortLabel={ytLabels.short}
                    pinterestLabel={t.quests.referencePinterest ?? 'Pinterest'}
                    clipTipsLabel={t.quests.referenceClipTips ?? 'CSP Tips'}
                    sketchfabLabel={t.quests.referenceSketchfab ?? 'Sketchfab'}
                    onYoutubeLong={onStartYoutubeLong}
                    onYoutubeShort={onStartYoutubeShort}
                    onPinterest={onStartPinterest}
                    onClipTips={onStartClipTips}
                    onSketchfab={onStartSketchfab}
                  />
                ))}
              {!isQuickSession && <QuestMaterialsButton quest={quest} className="flex-1 py-1.5 text-xs" />}
            </div>
            <button type="button" onClick={onStartQuestNow} className="btn-primary w-full py-2.5 text-base">
              ⏱ {t.quests.startQuestNow}
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-[var(--text-muted)] py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
            🔒 {t.quests.prerequisiteRequires} {prereqHint}
          </p>
        )}
      </div>
    </div>
  )
}

export function questCategoryColor(quest: Quest): string {
  return CATEGORY_INFO[quest.category]?.color ?? 'var(--accent)'
}
