import { useI18n } from '@/i18n'
import { getQuestReferenceGuide, getQuestReferenceImageUrl } from '@/data/questReferences'
import type { Quest } from '@/store/models'

type Props = {
  quest: Quest
}

export default function QuestReferencePanel({ quest }: Props) {
  const { t, language } = useI18n()
  const guide = getQuestReferenceGuide(quest)
  const tips = guide.tips[language] ?? guide.tips.en
  const imageUrl = getQuestReferenceImageUrl(guide)

  return (
    <aside
      className="quest-reference-panel card-fantasy mb-6 border border-[var(--border-secondary)]"
      aria-labelledby="quest-reference-heading"
    >
      <h2 id="quest-reference-heading" className="heading-2 text-sm mb-3">
        {t.quests.referenceGuideTitle}
      </h2>
      <div
        className="quest-reference-visual rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] mb-4 overflow-hidden"
        aria-hidden={imageUrl ? undefined : true}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-auto max-h-44 object-contain mx-auto block"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="text-5xl text-center py-4">{guide.visual}</div>
        )}
      </div>
      <ul className="space-y-2 text-sm text-[var(--text-secondary)] list-disc pl-5">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </aside>
  )
}
