import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUIStore } from '@/store/useUIStore'
import { buildLevelUpOrbits, buildLevelUpShards } from './celebrationLayout'

const LEVELUP_SHARDS = buildLevelUpShards(14)
const LEVELUP_ORBITS = buildLevelUpOrbits(8)

const DURATION_MS = 3100

/** Full-screen skill level-up celebration (theme via --celeb-* CSS vars). */
export default function LevelUpCelebration() {
  const sweepKey = useUIStore((s) => s.levelUpSweepKey)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!sweepKey) return
    setActive(true)
    const id = window.setTimeout(() => setActive(false), DURATION_MS)
    return () => window.clearTimeout(id)
  }, [sweepKey])

  if (!active) return null

  return createPortal(
    <div className="levelup-celebration-screen" aria-hidden>
      <div className="levelup-celebration-screen__edge levelup-celebration-screen__edge--bottom" />
      <div className="levelup-celebration-screen__edge levelup-celebration-screen__edge--top" />
      <div className="levelup-celebration-screen__wave" />
      <div className="levelup-celebration-screen__beam" />
      <div className="levelup-celebration-screen__burst" />
      {LEVELUP_SHARDS.map(({ key, style }) => (
        <span key={key} className="levelup-celebration-screen__shard" style={style} />
      ))}
      {LEVELUP_ORBITS.map(({ key, style }) => (
        <span key={key} className="levelup-celebration-screen__orbit" style={style} />
      ))}
    </div>,
    document.body,
  )
}
