import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keeps keyboard focus inside `rootRef` while `active` (modal / overlay).
 */
export function useFocusTrap(active: boolean, rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return
    const root = rootRef.current
    if (!root) return

    const getList = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0,
      )

    const focusables = getList()
    const first = focusables[0]
    const prevActive = document.activeElement as HTMLElement | null

    first?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.defaultPrevented) return
      const list = getList()
      if (list.length === 0) return
      const f = list[0]!
      const l = list[list.length - 1]!
      if (e.shiftKey) {
        if (document.activeElement === f) {
          e.preventDefault()
          l.focus()
        }
      } else {
        if (document.activeElement === l) {
          e.preventDefault()
          f.focus()
        }
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('keydown', onKeyDown)
      if (prevActive && root.contains(prevActive)) {
        prevActive.focus()
      }
    }
  }, [active, rootRef])
}
