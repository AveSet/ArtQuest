import { useState, useEffect } from 'react'
import { useI18n } from '@/i18n'
import { useQuestStore } from '@/store/useQuestStore'
import { MISTAKE_TAGS, getMistakeTagLabel } from '@/utils/mistakeTags'

type WorkKey = { id?: string; questId: number; date: string }

type Props = {
  workKey: WorkKey
  notes?: string
  improvementNotes?: string
  tags?: string[]
  compact?: boolean
  /** Lightbox: read-only, hide empty sections. Edit: full editor (default). */
  variant?: 'edit' | 'lightbox'
}

export default function GalleryWorkReview({
  workKey,
  notes,
  improvementNotes,
  tags = [],
  compact,
  variant = 'edit',
}: Props) {
  const { t, language } = useI18n()
  const updateWorkReview = useQuestStore((s) => s.updateWorkReview)
  const [noteDraft, setNoteDraft] = useState(notes ?? '')
  const [improvementDraft, setImprovementDraft] = useState(improvementNotes ?? '')
  const [tagSet, setTagSet] = useState<Set<string>>(new Set(tags))

  useEffect(() => {
    setNoteDraft(notes ?? '')
    setImprovementDraft(improvementNotes ?? '')
    setTagSet(new Set(tags))
  }, [notes, improvementNotes, tags, workKey.date, workKey.questId])

  if (variant === 'lightbox') {
    const hasNotes = Boolean(notes?.trim())
    const hasImprovement = Boolean(improvementNotes?.trim())
    const hasTags = tags.length > 0
    if (!hasNotes && !hasImprovement && !hasTags) return null
    return (
      <div className={`gallery-work-review gallery-work-review--readonly ${compact ? 'text-xs' : 'text-sm'} space-y-2`}>
        {hasNotes ? (
          <div>
            <span className="font-semibold block mb-1">{t.gallery.workComment}</span>
            <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{notes}</p>
          </div>
        ) : null}
        {hasImprovement ? (
          <div>
            <span className="font-semibold block mb-1">{t.gallery.improvementNotes}</span>
            <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{improvementNotes}</p>
          </div>
        ) : null}
        {hasTags ? (
          <div>
            <span className="font-semibold block mb-1">
              {t.gallery.mistakeTagsLabel}
            </span>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full border border-[var(--accent)] bg-[var(--accent)]/15 text-[10px]"
                >
                  {getMistakeTagLabel(tag, language)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const save = () => {
    updateWorkReview(workKey, {
      notes: noteDraft,
      improvementNotes: improvementDraft,
      tags: [...tagSet],
    })
  }

  return (
    <div className={`gallery-work-review ${compact ? 'text-xs' : 'text-sm'} space-y-2`}>
      <label className="block">
        <span className="font-semibold">{t.gallery.workComment}</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-primary)] px-2 py-1.5 text-[var(--text-primary)] min-h-[3rem]"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={save}
          placeholder={t.gallery.whatWentWellPlaceholder}
        />
      </label>
      <label className="block">
        <span className="font-semibold">{t.gallery.improvementNotes ?? 'Improve next time'}</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-primary)] px-2 py-1.5 text-[var(--text-primary)] min-h-[3rem]"
          value={improvementDraft}
          onChange={(e) => setImprovementDraft(e.target.value)}
          onBlur={save}
          placeholder={t.gallery.whatWentWellPlaceholder}
        />
      </label>
      <div>
        <span className="font-semibold block mb-1">
          {t.gallery.mistakeTagsLabel}
        </span>
        <div className="flex flex-wrap gap-1">
          {MISTAKE_TAGS.map((tag) => {
            const on = tagSet.has(tag)
            return (
              <button
                key={tag}
                type="button"
                className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors ${
                  on
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent-hover)]'
                    : 'border-[var(--border-secondary)] text-[var(--text-muted)]'
                }`}
                aria-pressed={on}
                onClick={() => {
                  setTagSet((prev) => {
                    const next = new Set(prev)
                    if (next.has(tag)) next.delete(tag)
                    else next.add(tag)
                    return next
                  })
                }}
                onBlur={save}
              >
                {getMistakeTagLabel(tag, language)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
