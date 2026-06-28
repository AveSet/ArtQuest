import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useI18n, getCategoryLabel, getDifficultyLabel } from '@/i18n'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useQuestStore } from '@/store/useQuestStore'
import type { Quest } from '@/store/models'
import { estimateQuestMetrics } from '@/utils/questMetricsEstimator'
import { useVisibleCategories } from '@/utils/useVisibleCategories'
import type { QuestCategory } from '@/data/skillTree'
import { AnimatedModal } from '@/components/ui/AnimatedOverlay'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (quest: Quest) => void
}

export default function AddQuestModal({ open, onClose, onCreated }: Props) {
  const { t, language } = useI18n()
  const lang = language
  const { addUserQuest, catalogQuests, quests } = useQuestStore(
    useShallow((s) => ({
      addUserQuest: s.addUserQuest,
      catalogQuests: s.catalogQuests,
      quests: s.quests,
    })),
  )
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, panelRef)
  const visibleCategories = useVisibleCategories()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<QuestCategory>('drawing')
  const [error, setError] = useState('')

  const catalog = catalogQuests.length > 0 ? catalogQuests : quests

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setCategory(visibleCategories[0] ?? 'drawing')
    setError('')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, visibleCategories])

  const preview = useMemo(() => {
    const trimmed = title.trim()
    if (!trimmed) return null
    return estimateQuestMetrics(trimmed, catalog, category, description.trim() || undefined)
  }, [title, description, catalog, category])

  const handleSubmit = () => {
    const created = addUserQuest({
      title,
      description: description.trim() || undefined,
      category,
      language: lang,
    })
    if (!created) {
      setError(t.quests.addQuestValidation ?? '')
      return
    }
    onCreated(created)
    onClose()
  }

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      panelRef={panelRef}
      aria-labelledby="add-quest-title"
      panelClassName="max-w-lg w-full my-auto py-6 overflow-y-auto max-h-[min(92vh,720px)]"
      overlayClassName="py-6 overflow-y-auto"
    >
      <h2 id="add-quest-title" className="heading-2 mb-2">
        {t.quests.addQuestTitle}
      </h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">{t.quests.addQuestHint}</p>

      <div className="space-y-3 text-left">
        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)]">
          {t.quests.addQuestNameLabel}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
            maxLength={160}
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)]">
          {t.common.category}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as QuestCategory)}
            className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm"
          >
            {visibleCategories.map((c) => (
              <option key={c} value={c}>
                {getCategoryLabel(c, lang)}
              </option>
            ))}
          </select>
        </label>

        {preview && (
          <div className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm motion-panel motion-panel--visible">
            <p className="font-semibold text-[var(--text-secondary)] mb-2">{t.quests.addQuestEstimateTitle}</p>
            <p className="mb-0">
              <span className={`difficulty-badge ${preview.difficulty} mr-2`}>
                {getDifficultyLabel(preview.difficulty, lang)}
              </span>
              ⭐ {preview.xp} {t.common.xp} · ⏱ {preview.estimatedTime} {t.common.minutes}
            </p>
          </div>
        )}

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)]">
          {t.quests.addQuestDescLabel}
          <span className="font-normal text-[var(--text-muted)]">{t.quests.addQuestDescOptional}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t.quests.addQuestDescPlaceholder}
            className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
            maxLength={2000}
          />
        </label>

        {error && (
          <p className="text-sm text-[var(--status-warning-text)]" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
          {t.common.cancel}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="btn-primary flex-1 py-2.5 disabled:opacity-50"
        >
          {t.quests.addQuestSubmit}
        </button>
      </div>
    </AnimatedModal>
  )
}
