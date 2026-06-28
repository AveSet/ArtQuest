import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { useI18n } from '@/i18n'
import { QUEST_REFERENCE_BONUS_MINUTES } from '@/store/useQuestSessionStore'
import { ToastDismissButton, ToastDismissWrap } from './ToastDismissButton'

export default function ReferenceBonusToast() {
  const visible = useQuestSessionStore((s) => s.referenceToastVisible)
  const clearReferenceToast = useQuestSessionStore((s) => s.clearReferenceToast)
  const { t } = useI18n()

  if (!visible) return null

  return (
    <div className="toast-anchor-top-right z-[210] max-w-xs animate-fade-in-up" role="status" aria-live="polite">
      <ToastDismissWrap>
        <div className="card-fantasy border border-[var(--accent)]/50 shadow-lg px-4 py-3 text-sm reference-bonus-toast pr-10">
          <ToastDismissButton onDismiss={clearReferenceToast} label={t.common.close} />
          {(t.quests.referenceBonusAdded ?? '+{n} min added for reference gathering').replace(
            '{n}',
            String(QUEST_REFERENCE_BONUS_MINUTES),
          )}
        </div>
      </ToastDismissWrap>
    </div>
  )
}
