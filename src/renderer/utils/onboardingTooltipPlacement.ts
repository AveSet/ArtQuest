import type { CSSProperties } from 'react'

export type Hole = { x: number; y: number; w: number; h: number }

const TOOLTIP_EST_H = 200
const GAP = 16

export function computeOnboardingTooltipStyle(
  hole: Hole | null,
  viewportW: number,
  viewportH: number,
): CSSProperties {
  const maxW = Math.min(448, viewportW - 32)
  const base: CSSProperties = {
    maxWidth: maxW,
    width: 'calc(100% - 2rem)',
    zIndex: 330,
  }

  if (!hole || hole.w <= 0 || hole.h <= 0) {
    return { ...base, top: 96, left: '50%', transform: 'translateX(-50%)' }
  }

  const belowTop = hole.y + hole.h + GAP
  const aboveTop = hole.y - TOOLTIP_EST_H - GAP
  const fitsBelow = belowTop + TOOLTIP_EST_H <= viewportH - GAP
  const fitsAbove = aboveTop >= GAP
  const holeTall = hole.h > viewportH * 0.5

  if (!holeTall && fitsBelow) {
    return { ...base, top: belowTop, left: '50%', transform: 'translateX(-50%)' }
  }
  if (fitsAbove) {
    return { ...base, top: Math.max(GAP, aboveTop), left: '50%', transform: 'translateX(-50%)' }
  }

  const rightLeft = hole.x + hole.w + GAP
  if (rightLeft + maxW <= viewportW - GAP) {
    return {
      ...base,
      top: Math.max(GAP, Math.min(hole.y, viewportH - TOOLTIP_EST_H - GAP)),
      left: rightLeft,
      transform: 'none',
      width: maxW,
    }
  }

  const leftPos = hole.x - GAP - maxW
  if (leftPos >= GAP) {
    return {
      ...base,
      top: Math.max(GAP, Math.min(hole.y, viewportH - TOOLTIP_EST_H - GAP)),
      left: leftPos,
      transform: 'none',
      width: maxW,
    }
  }

  return { ...base, top: GAP, left: '50%', transform: 'translateX(-50%)' }
}
