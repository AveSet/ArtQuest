import { useEffect, useRef } from 'react'
import { useUIStore } from '@/store/useUIStore'
import type { Settings } from '@/store/models'

type WindowBoundsPartial = NonNullable<Settings['windowBounds']>

const BOUNDS_SAVE_DEBOUNCE_MS = 500

function mergeWindowBounds(
  current: WindowBoundsPartial,
  partial: WindowBoundsPartial,
): WindowBoundsPartial {
  return {
    ...current,
    ...(partial.main ? { main: { ...current.main, ...partial.main } } : {}),
    ...(partial.overlay ? { overlay: { ...current.overlay, ...partial.overlay } } : {}),
    ...(partial.reference ? { reference: { ...current.reference, ...partial.reference } } : {}),
  }
}

function boundsEqual(a: WindowBoundsPartial | undefined, b: WindowBoundsPartial): boolean {
  if (!a) return false
  const mainEq =
    (!a.main && !b.main) ||
    (a.main &&
      b.main &&
      a.main.x === b.main.x &&
      a.main.y === b.main.y &&
      a.main.width === b.main.width &&
      a.main.height === b.main.height)
  const overlayEq =
    (!a.overlay && !b.overlay) ||
    (a.overlay && b.overlay && a.overlay.x === b.overlay.x && a.overlay.y === b.overlay.y)
  const refEq =
    (!a.reference && !b.reference) ||
    (a.reference &&
      b.reference &&
      a.reference.x === b.reference.x &&
      a.reference.y === b.reference.y &&
      a.reference.width === b.reference.width &&
      a.reference.height === b.reference.height)
  return Boolean(mainEq && overlayEq && refEq)
}

/** Persist overlay/reference window positions reported by the main process. */
export default function WindowBoundsBridge() {
  const pendingPartialRef = useRef<WindowBoundsPartial>({})
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushBoundsSave = () => {
    saveTimerRef.current = null
    const partial = pendingPartialRef.current
    if (!partial.main && !partial.overlay && !partial.reference) return
    pendingPartialRef.current = {}

    const current = useUIStore.getState().settings.windowBounds ?? {}
    const next = mergeWindowBounds(current, partial)
    if (boundsEqual(current, next)) return
    useUIStore.getState().setSettings({ windowBounds: next })
  }

  const queueBoundsSave = (partial: WindowBoundsPartial) => {
    pendingPartialRef.current = mergeWindowBounds(pendingPartialRef.current, partial)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushBoundsSave, BOUNDS_SAVE_DEBOUNCE_MS)
  }

  useEffect(() => {
    const unsub = window.electronAPI?.onWindowBoundsReport?.((partial) => {
      queueBoundsSave(partial)
    })
    return () => {
      unsub?.()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      flushBoundsSave()
    }
  }, [])

  return null
}

export function applySavedWindowBounds(bounds: Settings['windowBounds']): void {
  if (!bounds || (!bounds.main && !bounds.overlay && !bounds.reference)) return
  void window.electronAPI?.applyWindowBounds?.(bounds)
}
