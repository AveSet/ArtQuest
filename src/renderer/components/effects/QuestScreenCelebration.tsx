import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { createPortal } from 'react-dom'
import { useUIStore } from '@/store/useUIStore'
import { buildQuestScreenSparks } from './celebrationLayout'
import { skillCategoryColor } from '@/utils/skillCategoryColors'
import type { QuestCategory } from '@/data/skillTree'

const SCREEN_SPARKS = buildQuestScreenSparks(18)

/** Full-screen quest-complete shimmer (casino-style, theme-aware). */
export default function QuestScreenCelebration() {
  const { portraitCelebrateUntil, celebrationCategory } = useUIStore(
    useShallow((s) => ({
      portraitCelebrateUntil: s.portraitCelebrateUntil,
      celebrationCategory: s.celebrationCategory,
    })),
  )
  const [active, setActive] = useState(false)

  const accent =
    celebrationCategory && celebrationCategory in { drawing: 1, anatomy: 1, animation: 1 }
      ? skillCategoryColor(celebrationCategory as QuestCategory)
      : undefined

  useEffect(() => {
    const remaining = portraitCelebrateUntil - Date.now()
    if (remaining <= 0) {
      setActive(false)
      return
    }
    setActive(true)
    const id = window.setTimeout(() => setActive(false), remaining)
    return () => window.clearTimeout(id)
  }, [portraitCelebrateUntil])

  if (!active) return null

  return createPortal(
    <div
      className="quest-celebration-screen"
      aria-hidden
      style={accent ? ({ '--celeb-accent': accent } as React.CSSProperties) : undefined}
    >
      <div className="quest-celebration-screen__vignette" />
      <div className="quest-celebration-screen__flash" />
      <div className="quest-celebration-screen__sweep quest-celebration-screen__sweep--a" />
      <div className="quest-celebration-screen__sweep quest-celebration-screen__sweep--b" />
      <div className="quest-celebration-screen__corner quest-celebration-screen__corner--tl" />
      <div className="quest-celebration-screen__corner quest-celebration-screen__corner--tr" />
      <div className="quest-celebration-screen__corner quest-celebration-screen__corner--bl" />
      <div className="quest-celebration-screen__corner quest-celebration-screen__corner--br" />
      {SCREEN_SPARKS.map(({ key, style }) => (
        <span key={key} className="quest-celebration-screen__spark" style={style} />
      ))}
    </div>,
    document.body,
  )
}
