import { memo } from 'react'
import type { Quest, QuestTitleOverrides } from '@/store/models'
import type { Language } from '@/i18n/translations'
import QuestCard from '@/components/QuestCard'
import {
  getQuestUnlockState,
  isQuestPermanentlyCompleted,
  resolvePrerequisiteTitles,
} from '@/utils/questPrerequisites'

export type QuestCatalogRowProps = {
  quest: Quest
  index: number
  language: Language
  completedQuests: number[]
  satisfiedOnceIds: Set<number>
  allQuests: Quest[]
  questTitleOverrides: QuestTitleOverrides
  onDetails: (id: number) => void
}

const QuestCatalogRow = memo(function QuestCatalogRow({
  quest,
  index,
  language,
  completedQuests,
  satisfiedOnceIds,
  allQuests,
  questTitleOverrides,
  onDetails,
}: QuestCatalogRowProps) {
  const unlock = getQuestUnlockState(quest, completedQuests, satisfiedOnceIds)
  const prereqHint = resolvePrerequisiteTitles(
    unlock.missingPrerequisiteIds,
    allQuests,
    language,
    questTitleOverrides,
  ).join(' · ')

  return (
    <div
      className="motion-stagger-item"
      style={{ ['--stagger-index' as string]: index }}
      data-quest-row
      data-quest-index={index}
    >
      <QuestCard
        quest={quest}
        language={language}
        questTitleOverrides={questTitleOverrides}
        locked={!unlock.unlocked}
        prerequisiteHint={prereqHint}
        onStart={unlock.unlocked ? onDetails : undefined}
        completed={isQuestPermanentlyCompleted(quest, completedQuests)}
      />
    </div>
  )
})

export default QuestCatalogRow
