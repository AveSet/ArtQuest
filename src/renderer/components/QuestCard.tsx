import { memo } from 'react'
import type { Quest } from '@/store/models'
import { getQuestDescription, getDifficultyLabel, getCategoryLabel, getMediumLabel, useI18n } from '@/i18n'
import { buildQuestLearningHint } from '@/utils/questLearningHint'
import { resolveQuestTitle } from '@/utils/questDisplay'
import type { Language } from '@/i18n/translations'
import { Box } from '@/components/tags'
import QuestTimeMeta from '@/components/QuestTimeMeta'
interface QuestCardProps {
  quest: Quest
  language: Language
  questTitleOverrides?: import('@/store/models').QuestTitleOverrides
  completed?: boolean
  locked?: boolean
  prerequisiteHint?: string
  onStart?: (id: number, estimatedTime: number) => void
}

const QuestCard = memo(function QuestCard({
  quest,
  language,
  questTitleOverrides,
  completed,
  locked = false,
  prerequisiteHint,
  onStart,
}: QuestCardProps) {
  const { t } = useI18n()
  const title = resolveQuestTitle(quest, language, questTitleOverrides)
  const description = getQuestDescription(quest.description, language)
  const difficultyLabel = getDifficultyLabel(quest.difficulty, language)
  const learningHint = buildQuestLearningHint(quest, language, description)

  return (
    <article
      className={`quest-card${locked ? ' quest-card--locked opacity-80' : ''}`}
      aria-label={t.a11y.questCard.replace('{title}', title)}
      aria-describedby={
        quest.tags.length > 0 ? `quest-${quest.id}-desc quest-${quest.id}-tags` : `quest-${quest.id}-desc`
      }
    >
      <Box className="flex justify-between items-start mb-3 gap-2">
        <h3 className="quest-card-title" id={`quest-${quest.id}-title`}>{title}</h3>
        <span className={`difficulty-badge ${quest.difficulty} shrink-0`} role="status" aria-label={t.a11y.difficultyBadge.replace('{label}', difficultyLabel)}>
          {difficultyLabel}
        </span>
      </Box>

      {locked && prerequisiteHint && (
        <p className="text-xs text-[var(--status-warning-text)] mb-2 font-medium" role="status">
          🔒 {t.quests.prerequisiteLocked}: {prerequisiteHint}
        </p>
      )}

      <p className="text-xs text-[var(--stat-quests)] mb-2 leading-snug" role="note">
        {learningHint.line}
      </p>

      <div className="quest-card-desc-wrap">
        <p className="quest-card-description" id={`quest-${quest.id}-desc`}>
          {description}
        </p>
        {quest.tags.length > 0 && (
          <div className="quest-card-tags" id={`quest-${quest.id}-tags`} aria-label={t.resources.tag}>
            {quest.tags.map((tagLabel, i) => (
              <span key={`${tagLabel}-${i}`} className="quest-card-tag" title={tagLabel}>
                {tagLabel}
              </span>
            ))}
          </div>
        )}
      </div>

      <Box className="quest-card-meta">
        <span>📂 {getCategoryLabel(quest.category, language)}</span>
        <QuestTimeMeta quest={quest} />
        <span className="xp-gold">⭐ <span>{quest.xp} {t.common.xp}</span></span>
        <span className="text-muted text-sm">{t.common.source}: {quest.source}</span>
        <span className="text-muted text-sm">{t.quests.medium}: {getMediumLabel(quest.medium, language)}</span>
      </Box>

      <Box className="quest-card-actions flex-wrap" role="group" aria-label={t.a11y.questActions}>
        {completed && !quest.is_repeatable ? (
          <span className="text-success font-semibold" role="status" aria-label={t.a11y.questCompletedStatus.replace('{title}', title)}>✓ <span>{t.common.completed}</span></span>
        ) : locked ? (
          <span className="text-xs text-[var(--text-muted)] font-medium" role="status">
            {t.quests.prerequisiteLocked}
          </span>
        ) : (
          <>
            {onStart && (
              <button type="button" onClick={() => onStart(quest.id, quest.estimatedTime)} className="btn-primary text-sm" aria-label={t.a11y.startQuestNamed.replace('{title}', title)}>
                {t.common.startQuest}
              </button>
            )}
          </>
        )}
      </Box>
    </article>
  )
})

export default QuestCard
