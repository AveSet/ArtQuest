import { useEffect } from 'react'

type HotkeyOptions = {
  enabled?: boolean
  preventDefault?: boolean
  target?: EventTarget | null
}

/**
 * Register a single keyboard shortcut on window (or custom target).
 */
export function useHotkey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
): void {
  const { enabled = true, preventDefault = false, target = typeof window !== 'undefined' ? window : null } =
    options

  useEffect(() => {
    if (!enabled || !target) return

    const onKeyDown = (event: Event) => {
      const e = event as KeyboardEvent
      if (e.key !== key) return
      if (preventDefault) e.preventDefault()
      handler(e)
    }

    target.addEventListener('keydown', onKeyDown)
    return () => target.removeEventListener('keydown', onKeyDown)
  }, [enabled, handler, key, preventDefault, target])
}
