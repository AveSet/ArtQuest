import { Suspense, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { useUIStore } from '@/store/useUIStore'

type Props = {
  fallback: ReactNode
  children: ReactNode
}

/**
 * Wraps React Router `<Routes>` with a keyed container so each navigation
 * plays a short page-enter animation (disabled when reduce-motion is on).
 */
export default function AnimatedRouteOutlet({ fallback, children }: Props) {
  const location = useLocation()
  const reduceMotion = useUIStore((s) => s.settings.reduceMotion)
  const motionClass = reduceMotion ? 'motion-page-instant' : 'motion-page-enter'

  return (
    <div key={location.pathname} className={motionClass}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </div>
  )
}
