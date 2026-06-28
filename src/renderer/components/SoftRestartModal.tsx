import { useRef, useEffect } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'
import { useUIStore } from '@/store/useUIStore'
import { useSkillStore } from '@/store/useSkillStore'
import { AnimatedModal } from '@/components/ui/AnimatedOverlay'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SoftRestartModal({ open, onClose }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const streakState = useUIStore(s => s.streakState)
  const softRestartProgress = useUIStore(s => s.softRestartProgress)
  const skillNodes = useSkillStore(s => s.skillNodes)
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, dialogRef)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const longestStreak = streakState.longest
  const unlockedSkills = skillNodes.filter(n => n.isUnlocked).length
  const daysAway = streakState.lastActiveDate
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(streakState.lastActiveDate + 'T00:00:00').getTime()) / 86400000,
        ),
      )
    : 0
  const bodyLinesRaw = (t.softRestart as unknown as { bodyLines?: unknown }).bodyLines
  const bodyLines: string[] = Array.isArray(bodyLinesRaw)
    ? (bodyLinesRaw as unknown[]).map((v) => String(v))
    : bodyLinesRaw != null
      ? [String(bodyLinesRaw)]
      : []

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      panelRef={dialogRef}
      zClassName="z-[200]"
      aria-label={t.softRestart.title}
      panelClassName="max-w-md w-full p-6 text-center"
    >
      <div className="text-5xl mb-4 animate-celebrate">🎨</div>
      <h2 className="heading-2 text-xl mb-4">{t.softRestart.title}</h2>
      <div className="space-y-1 mb-6 text-sm text-[var(--text-secondary)]">
        {bodyLines.map((line, i) => (
          <p key={i}>
            {line
              .replace('{longestStreak}', String(longestStreak))
              .replace('{unlockedSkills}', String(unlockedSkills))
              .replace('{days}', String(daysAway))
              .replace('{daysAway}', String(daysAway))}
          </p>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={() => {
            void softRestartProgress().then(() => {
              onClose()
              navigate('/quests')
            })
          }}
        >
          {t.softRestart.easyStart}
        </button>
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={onClose}
        >
          {t.softRestart.continuePlaying}
        </button>
      </div>
    </AnimatedModal>
  )
}
