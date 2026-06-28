import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { useUIStore } from '@/store/useUIStore'

function useBreakReminderBucket(): number {
  const trackingEnabled = useUIStore((s) => s.settings.activityTrackingEnabled !== false)
  return useQuestSessionStore((s) => {
    const session = s.session
    if (!session || !session.isRunning || session.isExpired) return 0
    const totalSec = (session.mainMinutes + session.referenceMinutes) * 60
    const elapsedSec =
      trackingEnabled && typeof session.activeElapsedSec === 'number'
        ? session.activeElapsedSec
        : Math.max(0, totalSec - session.remainingSec)
    return Math.floor(elapsedSec / (20 * 60))
  })
}

export default function BreakReminderToast() {
  const { t } = useI18n()
  const bucket = useBreakReminderBucket()
  const sessionActive = useQuestSessionStore((s) => !!(s.session?.isRunning && !s.session.isExpired))
  const [visible, setVisible] = useState(false)
  const lastBucketRef = useRef(0)

  useEffect(() => {
    if (!sessionActive) {
      lastBucketRef.current = 0
      return
    }
    if (bucket > 0 && bucket > lastBucketRef.current) {
      lastBucketRef.current = bucket
      setVisible(true)
      const id = window.setTimeout(() => setVisible(false), 9000)
      return () => window.clearTimeout(id)
    }
  }, [bucket, sessionActive])

  if (!visible) return null

  return (
    <div className="break-reminder-toast card-fantasy" role="status" aria-live="polite">
      <div className="text-sm font-semibold">{t.settings.breakReminderTitle}</div>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{t.settings.breakReminderBody}</p>
      <button type="button" className="btn-secondary text-xs mt-2 py-1 px-3" onClick={() => setVisible(false)}>
        {t.settings.breakReminderDone}
      </button>
    </div>
  )
}
