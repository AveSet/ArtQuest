import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'
import { useQuestStore } from '@/store/useQuestStore'
import { resolveQuestTitle } from '@/utils/questDisplay'
import ConfirmDialog from '@/components/ConfirmDialog'
import type { Quest } from '@/store/models'

type Props = {
  quest: Quest
  headingClassName?: string
  /** Full-width title with controls on the next row */
  layout?: 'inline' | 'stacked'
  /** User-created quests can be deleted; catalog and warmup quests cannot. */
  allowDelete?: boolean
}

export default function QuestTitleEditor({
  quest,
  headingClassName = 'heading-fantasy text-left',
  layout = 'inline',
  allowDelete = true,
}: Props) {
  const { t, language } = useI18n()
  const lang = language
  const navigate = useNavigate()
  const { overrides, setQuestTitleOverride, clearQuestTitleOverride, deleteQuest } = useQuestStore(
    useShallow((s) => ({
      overrides: s.questTitleOverrides,
      setQuestTitleOverride: s.setQuestTitleOverride,
      clearQuestTitleOverride: s.clearQuestTitleOverride,
      deleteQuest: s.deleteQuest,
    })),
  )

  const displayTitle = resolveQuestTitle(quest, lang, overrides)
  const hasOverride = Boolean(overrides[quest.id]?.[lang]?.trim())
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(displayTitle)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!editing) setDraft(displayTitle)
  }, [displayTitle, editing])

  const save = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      clearQuestTitleOverride(quest.id, lang)
    } else if (trimmed !== (quest.title[lang] || quest.title.en)) {
      setQuestTitleOverride(quest.id, lang, trimmed)
    } else {
      clearQuestTitleOverride(quest.id, lang)
    }
    setEditing(false)
  }

  const resetToOriginal = () => {
    clearQuestTitleOverride(quest.id, lang)
    setDraft(quest.title[lang] || quest.title.en)
    setEditing(false)
  }

  const handleDelete = () => {
    deleteQuest(quest.id)
    setConfirmDelete(false)
    navigate('/quests', { replace: true })
  }

  return (
    <div className="mb-1">
      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-3 py-2 text-lg font-semibold"
            maxLength={160}
            aria-label={t.quests.editTitleLabel}
          />
          <p className="text-xs text-[var(--text-muted)]">{t.quests.editTitleLangHint}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} className="btn-primary text-sm py-1.5 px-3">
              {t.quests.editTitleSave}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-sm py-1.5 px-3">
              {t.common.cancel}
            </button>
            {hasOverride && (
              <button type="button" onClick={resetToOriginal} className="btn-secondary text-sm py-1.5 px-3">
                {t.quests.editTitleReset}
              </button>
            )}
          </div>
        </div>
      ) : layout === 'stacked' ? (
        <div className="space-y-2 w-full">
          <h1 className={`${headingClassName} mb-0 w-full block`}>{displayTitle}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-secondary text-xs py-1 px-2"
              aria-label={t.quests.editTitleLabel}
            >
              ✏️ {t.quests.editTitleLabel}
            </button>
            {allowDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="btn-secondary text-xs py-1 px-2 text-[var(--status-warning-text)]"
              >
                🗑 {t.quests.deleteQuest}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <h1 className={`${headingClassName} mb-0 flex-1 min-w-0`}>{displayTitle}</h1>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-secondary text-xs py-1 px-2 shrink-0"
              aria-label={t.quests.editTitleLabel}
            >
              ✏️ {t.quests.editTitleLabel}
            </button>
          </div>
          {allowDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn-secondary text-xs py-1 px-2 text-[var(--status-warning-text)]"
            >
              🗑 {t.quests.deleteQuest}
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t.quests.deleteQuestTitle ?? ''}
        message={t.quests.deleteQuestConfirm ?? ''}
        confirmLabel={t.quests.deleteQuest ?? ''}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
