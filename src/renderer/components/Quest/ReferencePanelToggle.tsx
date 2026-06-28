import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useI18n } from '@/i18n'
import { useQuestStore } from '@/store/useQuestStore'
import ReferencePanel from './ReferencePanel'
import { REFERENCE_PANEL_TOGGLE_EVENT } from '@/components/QuestSessionCommandBridge'

export default function ReferencePanelToggle() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const questId = id ? Number(id) : NaN
  const [open, setOpen] = useState(false)
  const refCount = useQuestStore((s) =>
    Number.isFinite(questId) ? (s.questSavedReferences[String(questId)]?.length ?? 0) : 0,
  )

  const hasQuest = Number.isFinite(questId) && questId > 0
  const showBadge = useMemo(() => refCount > 0 && !open, [refCount, open])
  const savedBadge = (t.reference.savedBadge ?? '{count} saved').replace('{count}', String(refCount))

  useEffect(() => {
    const onToggle = () => setOpen((v) => !v)
    window.addEventListener(REFERENCE_PANEL_TOGGLE_EVENT, onToggle)
    return () => window.removeEventListener(REFERENCE_PANEL_TOGGLE_EVENT, onToggle)
  }, [])

  if (!hasQuest) return null

  return (
    <>
      {open && <ReferencePanel questId={questId} onClose={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="reference-panel-toggle fixed bottom-20 sm:bottom-24 right-4 w-12 h-12 flex items-center justify-center rounded-full shadow-lg bg-[var(--accent)] text-[var(--btn-on-accent-text)] hover:bg-[var(--accent-hover)] transition-colors"
        style={{ zIndex: 'var(--z-reference)' }}
        aria-label={
          showBadge
            ? `${t.reference.title}. ${savedBadge}`
            : t.reference.title
        }
        title={showBadge ? savedBadge : t.reference.title}
        aria-expanded={open}
      >
        {showBadge && (
          <span className="reference-panel-toggle__badge" aria-hidden>
            {refCount > 9 ? '9+' : refCount}
          </span>
        )}
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        )}
      </button>
    </>
  )
}
