import { playUiClick } from '@/utils/sound'
import type { MaterialEngagementStatus } from '@/utils/useMaterialEngagement'

type Props = {
  videoId: string
  engagement: Record<string, MaterialEngagementStatus>
  onSetEngagement: (videoId: string, status: MaterialEngagementStatus) => void
  labels: {
    hint: string
    viewed: string
    helpful: string
    applied: string
  }
}

const STATUSES: MaterialEngagementStatus[] = ['viewed', 'helpful', 'applied']

export default function MaterialEngagementChips({
  videoId,
  engagement,
  onSetEngagement,
  labels,
}: Props) {
  return (
    <div
      className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[var(--border-secondary)]"
      aria-label={labels.hint}
      data-onboarding="materials-engagement-chips"
    >
      {STATUSES.map((status) => {
        const active = engagement[videoId] === status
        const label =
          status === 'viewed' ? labels.viewed : status === 'helpful' ? labels.helpful : labels.applied
        return (
          <button
            key={status}
            type="button"
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              active
                ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent-hover)]'
                : 'border-[var(--border-secondary)] text-[var(--text-muted)]'
            }`}
            aria-pressed={active}
            onClick={(e) => {
              e.stopPropagation()
              playUiClick()
              onSetEngagement(videoId, status)
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
