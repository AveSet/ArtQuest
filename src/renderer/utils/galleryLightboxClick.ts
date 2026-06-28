export type LightboxClickAction = 'close' | 'prev' | 'next' | 'none'

/** Map overlay click position to close / prev / next (zones beside & above/below media). */
export function resolveLightboxClickAction(
  clientX: number,
  clientY: number,
  mediaRect: DOMRect | null,
  canNavigate: boolean,
): LightboxClickAction {
  if (!mediaRect || mediaRect.width <= 0 || mediaRect.height <= 0) return 'close'
  const { left, right, top, bottom } = mediaRect
  if (clientY < top || clientY > bottom) return 'close'
  if (clientX < left) return canNavigate ? 'prev' : 'close'
  if (clientX > right) return canNavigate ? 'next' : 'close'
  return 'none'
}
