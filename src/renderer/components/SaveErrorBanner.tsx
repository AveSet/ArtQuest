import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'

export default function SaveErrorBanner() {
  const { saveError, clearSaveError } = useUIStore(
    useShallow((s) => ({ saveError: s.saveError, clearSaveError: s.clearSaveError })),
  )
  const { t } = useI18n()

  if (!saveError) return null

  const message =
    saveError === 'storage_full'
      ? t.errors.storageFull
      : saveError === 'reset_failed'
        ? t.errors.resetFailed
        : t.errors.saveFailed

  return (
    <div
      role="alert"
      className="banner-error fixed top-16 left-1/2 z-[250] -translate-x-1/2 max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-lg shadow-lg flex items-start gap-3"
    >
      <span className="flex-1 text-sm">{message}</span>
      <button
        type="button"
        onClick={clearSaveError}
        className="shrink-0 text-sm underline opacity-90 hover:opacity-100"
      >
        {t.errors.dismiss}
      </button>
    </div>
  )
}
