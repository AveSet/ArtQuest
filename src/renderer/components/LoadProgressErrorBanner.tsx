import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'

export default function LoadProgressErrorBanner() {
  const {
    loadProgressError,
    corruptProgressBackupPath,
    retryLoadProgress,
    exportCorruptProgressBackup,
    dismissCorruptAndStartFresh,
    clearLoadProgressError,
  } = useUIStore(
    useShallow((s) => ({
      loadProgressError: s.loadProgressError,
      corruptProgressBackupPath: s.corruptProgressBackupPath,
      retryLoadProgress: s.retryLoadProgress,
      exportCorruptProgressBackup: s.exportCorruptProgressBackup,
      dismissCorruptAndStartFresh: s.dismissCorruptAndStartFresh,
      clearLoadProgressError: s.clearLoadProgressError,
    })),
  )
  const { t } = useI18n()

  if (!loadProgressError) return null

  const message =
    loadProgressError === 'corrupt'
      ? t.errors.progressCorrupt
      : t.errors.loadFailed

  return (
    <div
      role="alertdialog"
      aria-labelledby="load-progress-error-title"
      className="banner-error fixed top-16 left-1/2 z-[260] -translate-x-1/2 max-w-lg w-[calc(100%-2rem)] px-4 py-3 rounded-lg shadow-lg"
    >
      <p id="load-progress-error-title" className="text-sm font-medium mb-2">
        {message}
      </p>
      {corruptProgressBackupPath ? (
        <p className="text-xs opacity-90 mb-3 break-all">{corruptProgressBackupPath}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 text-sm">
        {loadProgressError === 'corrupt' ? (
          <>
            <button
              type="button"
              onClick={() => void exportCorruptProgressBackup()}
              className="px-3 py-1 rounded border border-current/30 hover:bg-white/10"
            >
              {t.errors.exportCorruptBackup}
            </button>
            {corruptProgressBackupPath && window.electronAPI?.showItemInFolder ? (
              <button
                type="button"
                onClick={() => void window.electronAPI?.showItemInFolder(corruptProgressBackupPath)}
                className="px-3 py-1 rounded border border-current/30 hover:bg-white/10"
              >
                {t.errors.showBackupFolder}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void retryLoadProgress()}
              className="px-3 py-1 rounded border border-current/30 hover:bg-white/10"
            >
              {t.errors.retryLoad}
            </button>
            <button
              type="button"
              onClick={() => void dismissCorruptAndStartFresh()}
              className="px-3 py-1 rounded border border-current/30 hover:bg-white/10"
            >
              {t.errors.startFreshAfterCorrupt}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void retryLoadProgress()}
              className="px-3 py-1 rounded border border-current/30 hover:bg-white/10"
            >
              {t.errors.retryLoad}
            </button>
            <button
              type="button"
              onClick={clearLoadProgressError}
              className="px-3 py-1 rounded border border-current/30 hover:bg-white/10"
            >
              {t.errors.dismiss}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
