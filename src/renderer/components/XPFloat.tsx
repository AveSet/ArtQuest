import { useEffect, useState } from 'react'
import { useXpFloatStore, type XpFloatBurst, xpFloatTier } from '@/store/xpFloatStore'

const FLOAT_MS = 1200

/**
 * Floating +XP labels on quest completion. Subscribes via zustand (not quest store)
 * so quest list / toast layers do not re-render for each burst.
 */
export default function XPFloat() {
  const [bursts, setBursts] = useState<XpFloatBurst[]>([])

  useEffect(() => {
    setBursts(useXpFloatStore.getState().bursts)
    return useXpFloatStore.subscribe((state) => {
      setBursts(state.bursts)
    })
  }, [])

  if (bursts.length === 0) return null

  return (
    <div
      className="xp-float-layer pointer-events-none fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 'var(--z-toast)' }}
      aria-hidden
    >
      {bursts.map((burst, index) => (
        <XpFloatItem key={burst.id} burst={burst} index={index} total={bursts.length} />
      ))}
    </div>
  )
}

function XpFloatItem({
  burst,
  index,
  total,
}: {
  burst: XpFloatBurst
  index: number
  total: number
}) {
  const remove = useXpFloatStore((s) => s.remove)

  useEffect(() => {
    const id = window.setTimeout(() => remove(burst.id), FLOAT_MS)
    return () => window.clearTimeout(id)
  }, [burst.id, remove])

  const center = (total - 1) / 2
  const offsetX = (index - center) * 28
  const offsetY = index * -12

  return (
    <span
      className="absolute"
      style={{
        left: '50%',
        top: '42%',
        transform: `translate(calc(-50% + ${offsetX}px), ${offsetY}px)`,
      }}
    >
      <span
        className={`xp-float-burst xp-float-burst--${xpFloatTier(burst.amount)} relative font-bold tabular-nums drop-shadow-md`}
      >
        +{burst.amount} XP
      </span>
    </span>
  )
}
