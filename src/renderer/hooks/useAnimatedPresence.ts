import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/useUIStore'

const DEFAULT_MS = 260

/** Keeps content mounted while exit transition finishes; respects reduce-motion. */
export function useAnimatedPresence(open: boolean, durationMs = DEFAULT_MS) {
  const reduceMotion = useUIStore((s) => s.settings.reduceMotion)
  const duration = reduceMotion ? 0 : durationMs

  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      if (duration === 0) {
        setVisible(true)
        return
      }
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }

    if (!mounted) return

    setVisible(false)
    if (duration === 0) {
      setMounted(false)
      return
    }

    const timer = window.setTimeout(() => setMounted(false), duration)
    return () => window.clearTimeout(timer)
  }, [open, mounted, duration])

  return { mounted, visible, duration }
}
