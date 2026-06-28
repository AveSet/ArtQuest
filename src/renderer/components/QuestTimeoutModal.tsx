import { useI18n } from '@/i18n'

type Props = {
  open: boolean
  onClose: () => void
}

export default function QuestTimeoutModal({ open, onClose }: Props) {
  const { t } = useI18n()
  if (!open) return null

  return (
    <div className="modal-overlay" role="presentation">
      <div
        className="modal-panel card-fantasy max-w-md mx-auto text-center space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-timeout-title"
      >
        <h2 id="quest-timeout-title" className="heading-2 text-lg">
          {t.quests.timeoutFailTitle}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">
          {t.quests.timeoutFailBody}
        </p>
        <button type="button" className="btn-primary w-full" onClick={onClose}>
          {t.quests.timeoutFailCta}
        </button>
      </div>
    </div>
  )
}
