type Props = {
  learnModeHint: string
  engagementHint?: string
}

/** Discoverability callout for engagement chips in Learning now mode. */
export default function LearnModeEngagementHint({ learnModeHint, engagementHint }: Props) {
  return (
    <div className="space-y-2 mb-2" data-onboarding="materials-engagement-hint">
      <p className="text-sm text-[var(--text-muted)]">{learnModeHint}</p>
      {engagementHint ? (
        <p className="text-xs rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/60 px-3 py-2 text-[var(--text-secondary)]">
          {engagementHint}
        </p>
      ) : null}
    </div>
  )
}
