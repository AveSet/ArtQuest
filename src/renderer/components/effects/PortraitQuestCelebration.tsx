import type { CSSProperties } from 'react'
import { buildPortraitSparks } from './celebrationLayout'

const RING_DELAYS = ['0s', '0.14s', '0.28s'] as const
const PORTRAIT_SPARKS = buildPortraitSparks(10)

/** Local portrait burst when a quest is completed (theme via --celeb-* CSS vars). */
export default function PortraitQuestCelebration({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div className="portrait-quest-celebrate" aria-hidden>
      <div className="portrait-quest-celebrate__halo" />
      {RING_DELAYS.map((delay, i) => (
        <div
          key={i}
          className="portrait-quest-celebrate__ring"
          style={{ '--ring-delay': delay } as CSSProperties}
        />
      ))}
      <div className="portrait-quest-celebrate__shimmer" />
      {PORTRAIT_SPARKS.map(({ key, style }) => (
        <span key={key} className="portrait-quest-celebrate__spark" style={style} />
      ))}
    </div>
  )
}
